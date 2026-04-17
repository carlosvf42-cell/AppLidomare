"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import type { Ejercicio, GrupoMuscular } from "@/lib/types";

const ADMIN_EMAIL = "carlosvf42@gmail.com";
const GRUPOS: GrupoMuscular[] = ["Pecho", "Espalda", "Piernas", "Hombro", "Brazo", "Core", "Otro"];

type UsuarioRow = {
  id: string;
  email: string;
  last_sign_in_at: string | null;
  created_at: string;
};

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "Nunca";
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Invite state
  const [email, setEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState<"idle" | "ok" | "error">("idle");
  const [inviteMsg, setInviteMsg] = useState("");
  const [isSending, startSend] = useTransition();

  // Users state
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Catálogo state
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);
  const [catSearch, setCatSearch] = useState("");
  const [catGrupo, setCatGrupo] = useState<GrupoMuscular | "Todos">("Todos");

  // Form nuevo/editar ejercicio
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formNombre, setFormNombre] = useState("");
  const [formGrupo, setFormGrupo] = useState<GrupoMuscular>("Pecho");
  const [formDesc, setFormDesc] = useState("");
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Confirm delete
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Auth check + capture token for API calls
  useEffect(() => {
    getSupabase()
      .auth.getSession()
      .then(({ data }) => {
        if (data.session?.user?.email !== ADMIN_EMAIL) {
          router.replace("/");
        } else {
          setToken(data.session.access_token);
          setChecking(false);
        }
      });
  }, [router]);

  // Load catálogo
  useEffect(() => {
    if (checking || !token) return;
    setCatLoading(true);
    fetch("/api/ejercicios", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setCatError(data.error);
        else setEjercicios(data.ejercicios as Ejercicio[]);
        setCatLoading(false);
      })
      .catch((err) => { setCatError(err.message); setCatLoading(false); });
  }, [checking, token]);

  // Load users
  useEffect(() => {
    if (checking || !token) return;
    fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setUsersError(data.error);
        } else {
          const sorted = (data.users as UsuarioRow[]).sort(
            (a, b) =>
              new Date(b.last_sign_in_at ?? b.created_at).getTime() -
              new Date(a.last_sign_in_at ?? a.created_at).getTime()
          );
          setUsuarios(sorted);
        }
        setUsersLoading(false);
      })
      .catch((err) => {
        setUsersError(err.message);
        setUsersLoading(false);
      });
  }, [checking, token]);

  // ── Catálogo helpers ──
  function openCreate() {
    setEditingId(null);
    setFormNombre("");
    setFormGrupo("Pecho");
    setFormDesc("");
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(ej: Ejercicio) {
    setEditingId(ej.id);
    setFormNombre(ej.nombre);
    setFormGrupo(ej.grupo_muscular);
    setFormDesc(ej.descripcion ?? "");
    setFormError(null);
    setShowForm(true);
  }

  async function handleSaveEjercicio() {
    if (!formNombre.trim() || !token) return;
    setFormSaving(true);
    setFormError(null);
    const isEdit = !!editingId;
    const res = await fetch("/api/ejercicios", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: editingId, nombre: formNombre.trim(), grupo_muscular: formGrupo, descripcion: formDesc.trim() || null }),
    });
    const data = await res.json();
    if (!res.ok) { setFormError(data.error ?? "Error"); setFormSaving(false); return; }
    const saved = data.ejercicio as Ejercicio;
    setEjercicios((prev) =>
      isEdit
        ? prev.map((e) => (e.id === saved.id ? saved : e))
        : [...prev, saved].sort((a, b) => a.grupo_muscular.localeCompare(b.grupo_muscular) || a.nombre.localeCompare(b.nombre))
    );
    setShowForm(false);
    setFormSaving(false);
  }

  async function handleDelete(id: string) {
    if (!token) return;
    const res = await fetch(`/api/ejercicios?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setEjercicios((prev) => prev.filter((e) => e.id !== id));
    }
    setDeletingId(null);
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setInviteStatus("idle");
    setInviteMsg("");

    startSend(async () => {
      try {
        const res = await fetch("/api/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ email: email.trim() }),
        });
        const data = await res.json();
        if (res.ok) {
          setInviteStatus("ok");
          setInviteMsg("Invitación enviada correctamente.");
          setEmail("");
        } else {
          setInviteStatus("error");
          setInviteMsg(data.details ?? data.error ?? "Error al enviar la invitación.");
        }
      } catch (err: any) {
        setInviteStatus("error");
        setInviteMsg(err.message ?? "Error de red.");
      }
    });
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Header */}
      <div className="px-6 pt-14 pb-6">
        <p className="text-[10px] tracking-[0.2em] uppercase text-[#2abfbf] mb-1">Admin</p>
        <h1 className="text-xl font-light text-[#f0f0f0] tracking-tight">Panel de administración</h1>
      </div>

      <div className="px-4 pb-10 space-y-6">
        {/* ── Invitar alumno ── */}
        <section>
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#444] mb-3 px-1">Invitar alumno</p>
          <div className="rounded-xl px-4 py-4 space-y-3" style={{ background: "#141414", border: "1px solid #222" }}>
            <form onSubmit={handleInvite} className="space-y-3">
              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase text-[#555] mb-2">
                  Email del alumno
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setInviteStatus("idle");
                  }}
                  placeholder="alumno@email.com"
                  required
                  className="w-full bg-[#1a1a1a] border border-[#222] rounded-lg px-4 py-3 text-[#f0f0f0] placeholder-[#333] text-sm outline-none focus:border-[#2abfbf] transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isSending}
                className="w-full py-3.5 rounded-xl text-sm font-semibold tracking-widest uppercase transition-colors disabled:opacity-50"
                style={{ background: "#2abfbf", color: "#080808" }}
              >
                {isSending ? "Enviando…" : "Enviar invitación"}
              </button>
            </form>

            {inviteStatus === "ok" && (
              <p className="text-xs text-center" style={{ color: "#4caf7d" }}>
                {inviteMsg}
              </p>
            )}
            {inviteStatus === "error" && (
              <p className="text-xs text-center text-[#f0a0a0]">{inviteMsg}</p>
            )}
          </div>
        </section>

        {/* ── Alumnos registrados ── */}
        <section>
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#444] mb-3 px-1">
            Alumnos registrados
            {!usersLoading && !usersError && (
              <span className="ml-2 normal-case text-[#333]">({usuarios.length})</span>
            )}
          </p>

          {usersLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : usersError ? (
            <p className="text-[#f0a0a0] text-xs text-center py-4">{usersError}</p>
          ) : (
            <div className="space-y-2">
              {usuarios.map((u) => (
                <div
                  key={u.id}
                  className="rounded-xl px-4 py-3.5"
                  style={{ background: "#141414", border: "1px solid #222" }}
                >
                  <p className="text-[#f0f0f0] text-sm font-light truncate">{u.email}</p>
                  <p className="text-[#555] text-xs mt-0.5">
                    Último acceso: {formatDate(u.last_sign_in_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Catálogo de ejercicios ── */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#444]">
              Catálogo del gym
              {!catLoading && !catError && (
                <span className="ml-2 normal-case text-[#333]">({ejercicios.length})</span>
              )}
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-1.5 text-xs font-light"
              style={{ color: "#2abfbf" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Añadir
            </button>
          </div>

          {/* Filters */}
          <div className="space-y-2 mb-3">
            <input
              type="text"
              value={catSearch}
              onChange={(e) => setCatSearch(e.target.value)}
              placeholder="Buscar ejercicio…"
              className="w-full bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2.5 text-[#f0f0f0] placeholder-[#333] text-xs outline-none focus:border-[#2abfbf] transition-colors"
            />
            <div className="flex gap-1.5 flex-wrap">
              {(["Todos", ...GRUPOS] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setCatGrupo(g)}
                  className="px-2.5 py-1 rounded-lg text-[10px] transition-colors"
                  style={{
                    background: catGrupo === g ? "rgba(42,191,191,0.15)" : "#111",
                    border: `1px solid ${catGrupo === g ? "rgba(42,191,191,0.4)" : "#1e1e1e"}`,
                    color: catGrupo === g ? "#2abfbf" : "#555",
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {catLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : catError ? (
            <p className="text-[#f0a0a0] text-xs text-center py-4">{catError}</p>
          ) : (
            <div className="space-y-1.5">
              {ejercicios
                .filter((e) =>
                  (catGrupo === "Todos" || e.grupo_muscular === catGrupo) &&
                  (!catSearch.trim() || e.nombre.toLowerCase().includes(catSearch.toLowerCase()))
                )
                .map((ej) => (
                  <div
                    key={ej.id}
                    className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                    style={{ background: "#141414", border: "1px solid #222" }}
                  >
                    <div className="min-w-0">
                      <p className="text-[#f0f0f0] text-xs font-light truncate">{ej.nombre}</p>
                      <p className="text-[#444] text-[10px] mt-0.5">{ej.grupo_muscular}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(ej)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-[#1e1e1e]"
                        style={{ color: "#555" }}
                        aria-label="Editar"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(ej.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-[#1e1e1e]"
                        style={{ color: "#555" }}
                        aria-label="Eliminar"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                          <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              {ejercicios.filter((e) =>
                (catGrupo === "Todos" || e.grupo_muscular === catGrupo) &&
                (!catSearch.trim() || e.nombre.toLowerCase().includes(catSearch.toLowerCase()))
              ).length === 0 && (
                <p className="text-[#444] text-xs text-center py-4">Sin resultados</p>
              )}
            </div>
          )}
        </section>
      </div>

      {/* ── Modal crear/editar ejercicio global ── */}
      {showForm && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div
            className="w-full max-w-[430px] rounded-t-2xl px-5 pt-6 pb-10 space-y-4"
            style={{ background: "#141414", border: "1px solid #222" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] tracking-[0.2em] uppercase text-[#2abfbf]">catálogo del gym</p>
                <h2 className="text-sm font-light text-[#f0f0f0]">
                  {editingId ? "Editar ejercicio" : "Nuevo ejercicio global"}
                </h2>
              </div>
              <button type="button" onClick={() => setShowForm(false)} style={{ color: "#555" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div>
              <label className="block text-[9px] tracking-wider uppercase text-[#555] mb-1.5">Nombre *</label>
              <input
                type="text"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
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
                    onClick={() => setFormGrupo(g)}
                    className="px-3 py-1.5 rounded-lg text-xs transition-colors"
                    style={{
                      background: formGrupo === g ? "rgba(42,191,191,0.15)" : "#111",
                      border: `1px solid ${formGrupo === g ? "rgba(42,191,191,0.4)" : "#222"}`,
                      color: formGrupo === g ? "#2abfbf" : "#666",
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
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Notas, técnica, variantes…"
                rows={2}
                className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 text-[#f0f0f0] placeholder-[#333] text-xs outline-none focus:border-[#2abfbf] transition-colors resize-none"
              />
            </div>

            {formError && <p className="text-[#f0a0a0] text-xs">{formError}</p>}

            <button
              type="button"
              onClick={handleSaveEjercicio}
              disabled={formSaving || !formNombre.trim()}
              className="w-full py-3 rounded-xl text-sm font-semibold tracking-widest uppercase transition-all disabled:opacity-50"
              style={{ background: "#2abfbf", color: "#080808" }}
            >
              {formSaving ? "Guardando…" : editingId ? "Guardar cambios" : "Crear ejercicio"}
            </button>
          </div>
        </div>
      )}

      {/* ── Confirm delete ── */}
      {deletingId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.8)" }}
        >
          <div
            className="w-full max-w-[340px] rounded-2xl px-5 py-6 space-y-4"
            style={{ background: "#141414", border: "1px solid #333" }}
          >
            <p className="text-sm font-light text-[#f0f0f0] text-center">
              ¿Eliminar este ejercicio del catálogo?
            </p>
            <p className="text-xs text-[#555] text-center">
              Los ejercicios ya añadidos a rutinas no se verán afectados.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                style={{ background: "#1e1e1e", color: "#888" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                style={{ background: "rgba(240,80,80,0.15)", border: "1px solid rgba(240,80,80,0.3)", color: "#f05050" }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
