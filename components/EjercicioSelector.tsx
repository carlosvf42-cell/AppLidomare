"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { Ejercicio, GrupoMuscular } from "@/lib/types";

export type { Ejercicio };

interface Props {
  value: string;
  ejercicioId?: string | null;
  onChange: (nombre: string, ejercicioId: string | null) => void;
}

const GRUPOS: GrupoMuscular[] = ["Pecho", "Espalda", "Piernas", "Hombro", "Brazo", "Core", "Otro"];

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

type EjercicioRow = Ejercicio & { creado_por: string | null };

function groupByMuscle(items: EjercicioRow[]): Record<string, EjercicioRow[]> {
  const result: Record<string, EjercicioRow[]> = {};
  for (const g of GRUPOS) {
    const filtered = items.filter((e) => e.grupo_muscular === g);
    if (filtered.length) result[g] = filtered;
  }
  // Catch any unknown grupo
  const unknown = items.filter((e) => !GRUPOS.includes(e.grupo_muscular as GrupoMuscular));
  if (unknown.length) result["Otro"] = [...(result["Otro"] ?? []), ...unknown];
  return result;
}

export default function EjercicioSelector({ value, ejercicioId, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [catalogo, setCatalogo] = useState<EjercicioRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);

  // Modal crear ejercicio
  const [showModal, setShowModal] = useState(false);
  const [newNombre, setNewNombre] = useState("");
  const [newGrupo, setNewGrupo] = useState<GrupoMuscular>("Otro");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Load catalog on first open
  useEffect(() => {
    if (!open || catalogo.length > 0) return;
    setLoadingCatalogo(true);
    const supabase = getSupabase();
    Promise.all([
      supabase.auth.getUser(),
      supabase
        .from("ejercicios")
        .select("id, nombre, grupo_muscular, descripcion, creado_por, created_at")
        .order("grupo_muscular")
        .order("nombre"),
    ]).then(([{ data: authData }, { data: ejData }]) => {
      setUserId(authData.user?.id ?? null);
      setCatalogo((ejData as EjercicioRow[]) ?? []);
      setLoadingCatalogo(false);
    });
  }, [open, catalogo.length]);

  // Focus search when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = search.trim()
    ? catalogo.filter((e) => {
        const terminos = search.toLowerCase().split(" ").filter(Boolean);
        const nombre = e.nombre.toLowerCase();
        return terminos.every((termino) => nombre.includes(termino));
      })
    : catalogo;

  const gymEjercicios = filtered.filter((e) => e.creado_por === null);
  const misEjercicios = filtered.filter((e) => e.creado_por !== null && e.creado_por === userId);

  const gymGrouped = groupByMuscle(gymEjercicios);
  const misGrouped = groupByMuscle(misEjercicios);

  function select(ej: EjercicioRow) {
    onChange(ej.nombre, ej.id);
    setOpen(false);
    setSearch("");
  }

  async function handleCreate() {
    if (!newNombre.trim()) return;
    setSaving(true);
    setSaveError(null);
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaveError("Debes iniciar sesión."); setSaving(false); return; }

    const { data, error } = await supabase
      .from("ejercicios")
      .insert({
        nombre: newNombre.trim(),
        grupo_muscular: newGrupo,
        descripcion: newDesc.trim() || null,
        creado_por: user.id,
      })
      .select("id, nombre, grupo_muscular, descripcion, creado_por, created_at")
      .single();

    if (error || !data) {
      setSaveError(error?.message ?? "Error al crear");
      setSaving(false);
      return;
    }

    const nuevo = data as EjercicioRow;
    setCatalogo((prev) =>
      [...prev, nuevo].sort(
        (a, b) => a.grupo_muscular.localeCompare(b.grupo_muscular) || a.nombre.localeCompare(b.nombre)
      )
    );
    setUserId(user.id);
    onChange(nuevo.nombre, nuevo.id);
    setShowModal(false);
    setOpen(false);
    setSearch("");
    setNewNombre("");
    setNewGrupo("Otro");
    setNewDesc("");
    setSaving(false);
  }

  return (
    <>
      {/* Input + dropdown */}
      <div ref={containerRef} className="relative flex-1">
        <div className="relative">
          <input
            type="text"
            value={value}
            onClick={() => setOpen(true)}
            onChange={(e) => {
              onChange(e.target.value, null);
              setOpen(true);
              setSearch(e.target.value);
            }}
            placeholder="Nombre del ejercicio"
            className="w-full bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] placeholder-[#333] text-xs outline-none focus:border-[#2abfbf] transition-colors pr-7"
          />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2"
            style={{ color: "#444" }}
            tabIndex={-1}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {open && (
          <div
            className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-50 shadow-2xl"
            style={{ background: "#141414", border: "1px solid #222", maxHeight: 320 }}
          >
            {/* Search */}
            <div className="px-3 pt-2 pb-1.5 border-b border-[#1e1e1e]">
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar ejercicio…"
                className="w-full bg-[#0f0f0f] border border-[#222] rounded-lg px-3 py-2 text-[#f0f0f0] placeholder-[#333] text-xs outline-none focus:border-[#2abfbf] transition-colors"
              />
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: 230 }}>
              {loadingCatalogo ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-4 h-4 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-[#444] text-xs text-center py-4">Sin resultados</p>
              ) : (
                <>
                  {/* Sección: Ejercicios del gym */}
                  {Object.keys(gymGrouped).length > 0 && (
                    <>
                      <div className="px-3 pt-2 pb-1 flex items-center gap-2">
                        <span className="text-[8px] tracking-[0.2em] uppercase font-semibold text-[#2abfbf]">Ejercicios del gym</span>
                        <div className="flex-1 h-px" style={{ background: "rgba(42,191,191,0.15)" }} />
                      </div>
                      {Object.entries(gymGrouped).map(([grupo, items]) => (
                        <div key={`gym-${grupo}`}>
                          <p className="px-3 py-1 text-[9px] tracking-[0.15em] uppercase text-[#3a3a3a]">{grupo}</p>
                          {items.map((ej) => (
                            <EjercicioItem key={ej.id} ej={ej} selected={ej.id === ejercicioId} onSelect={select} />
                          ))}
                        </div>
                      ))}
                    </>
                  )}

                  {/* Sección: Mis ejercicios */}
                  {Object.keys(misGrouped).length > 0 && (
                    <>
                      <div className="px-3 pt-2 pb-1 flex items-center gap-2">
                        <span className="text-[8px] tracking-[0.2em] uppercase font-semibold text-[#555]">Mis ejercicios</span>
                        <div className="flex-1 h-px bg-[#222]" />
                      </div>
                      {Object.entries(misGrouped).map(([grupo, items]) => (
                        <div key={`mis-${grupo}`}>
                          <p className="px-3 py-1 text-[9px] tracking-[0.15em] uppercase text-[#3a3a3a]">{grupo}</p>
                          {items.map((ej) => (
                            <EjercicioItem key={ej.id} ej={ej} selected={ej.id === ejercicioId} onSelect={select} />
                          ))}
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Create button */}
            <div className="border-t border-[#1e1e1e]">
              <button
                type="button"
                onClick={() => { setShowModal(true); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs transition-colors hover:bg-[#1a1a1a]"
                style={{ color: "#2abfbf" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                Crear ejercicio propio
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal crear ejercicio */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            className="w-full max-w-[430px] rounded-t-2xl px-5 pt-6 pb-10 space-y-4"
            style={{ background: "#141414", border: "1px solid #222" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] tracking-[0.2em] uppercase text-[#444]">catálogo personal</p>
                <h2 className="text-sm font-light text-[#f0f0f0]">Nuevo ejercicio</h2>
              </div>
              <button type="button" onClick={() => setShowModal(false)} style={{ color: "#555" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div>
              <label className="block text-[9px] tracking-wider uppercase text-[#555] mb-1.5">Nombre *</label>
              <input
                type="text"
                value={newNombre}
                onChange={(e) => setNewNombre(e.target.value)}
                placeholder="Ej. Press Banca con mancuernas"
                className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 text-[#f0f0f0] placeholder-[#333] text-sm outline-none focus:border-[#2abfbf] transition-colors"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[9px] tracking-wider uppercase text-[#555] mb-1.5">Grupo muscular</label>
              <div className="flex flex-wrap gap-2">
                {GRUPOS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setNewGrupo(g)}
                    className="px-3 py-1.5 rounded-lg text-xs transition-colors"
                    style={{
                      background: newGrupo === g ? "rgba(42,191,191,0.15)" : "#111",
                      border: `1px solid ${newGrupo === g ? "rgba(42,191,191,0.4)" : "#222"}`,
                      color: newGrupo === g ? "#2abfbf" : "#666",
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[9px] tracking-wider uppercase text-[#555] mb-1.5">Descripción (opcional)</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Notas, técnica, variantes…"
                rows={2}
                className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 text-[#f0f0f0] placeholder-[#333] text-xs outline-none focus:border-[#2abfbf] transition-colors resize-none"
              />
            </div>

            {saveError && <p className="text-[#f0a0a0] text-xs">{saveError}</p>}

            <button
              type="button"
              onClick={handleCreate}
              disabled={saving || !newNombre.trim()}
              className="w-full py-3 rounded-xl text-sm font-semibold tracking-widest uppercase transition-all disabled:opacity-50"
              style={{ background: "#2abfbf", color: "#080808" }}
            >
              {saving ? "Guardando…" : "Crear y añadir"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function EjercicioItem({
  ej,
  selected,
  onSelect,
}: {
  ej: EjercicioRow;
  selected: boolean;
  onSelect: (ej: EjercicioRow) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(ej)}
      className="w-full text-left px-3 py-2 text-xs transition-colors hover:bg-[#1a1a1a] flex items-center justify-between gap-2"
      style={{ color: selected ? "#2abfbf" : "#d0d0d0" }}
    >
      <span>{ej.nombre}</span>
      {selected && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <path d="M5 12l5 5L19 7" stroke="#2abfbf" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
}
