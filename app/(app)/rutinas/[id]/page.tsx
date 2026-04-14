"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type RutinaEjercicio = { id: string; nombre: string; series: number; repeticiones: number; orden: number };
type RutinaDia = { id: string; nombre: string; orden: number; rutina_ejercicios: RutinaEjercicio[] };
type Rutina = { id: string; nombre: string; activa: boolean; rutina_dias: RutinaDia[] };

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function RutinaDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [rutina, setRutina] = useState<Rutina | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, startDelete] = useTransition();

  useEffect(() => {
    if (!id) return;
    const supabase = getSupabase();
    supabase
      .from("rutinas")
      .select("id, nombre, activa, rutina_dias(id, nombre, orden, rutina_ejercicios(id, nombre, series, repeticiones, orden))")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { router.push("/rutinas"); return; }
        const r = data as Rutina;
        r.rutina_dias.sort((a, b) => a.orden - b.orden);
        r.rutina_dias.forEach((d) => d.rutina_ejercicios.sort((a, b) => a.orden - b.orden));
        setRutina(r);
        setLoading(false);
      });
  }, [id, router]);

  function handleDelete() {
    startDelete(async () => {
      const supabase = getSupabase();
      await supabase.from("rutinas").delete().eq("id", id);
      router.push("/rutinas");
      router.refresh();
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!rutina) return null;

  const dias = rutina.rutina_dias;
  const totalEj = dias.reduce((s, d) => s + d.rutina_ejercicios.length, 0);
  const totalSeries = dias.reduce((s, d) => s + d.rutina_ejercicios.reduce((ss, e) => ss + e.series, 0), 0);

  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="px-6 pt-14 pb-4 flex items-center gap-3">
        <Link href="/rutinas" className="transition-colors shrink-0" style={{ color: "#444" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#444]">plan de entrenamiento</p>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-light text-[#f0f0f0] tracking-tight truncate">{rutina.nombre}</h1>
            {rutina.activa && (
              <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(42,191,191,0.12)", color: "#2abfbf", border: "1px solid rgba(42,191,191,0.2)" }}>
                activa
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-10 space-y-3">
        {/* Stats */}
        <div className="rounded-xl px-4 py-3 flex items-center gap-6"
          style={{ background: "#141414", border: "1px solid #222" }}>
          <div className="text-center">
            <p className="text-[#f0f0f0] text-lg font-light">{dias.length}</p>
            <p className="text-[9px] tracking-wider uppercase text-[#444]">días</p>
          </div>
          <div className="w-px h-8 bg-[#222]" />
          <div className="text-center">
            <p className="text-[#f0f0f0] text-lg font-light">{totalEj}</p>
            <p className="text-[9px] tracking-wider uppercase text-[#444]">ejercicios</p>
          </div>
          <div className="w-px h-8 bg-[#222]" />
          <div className="text-center">
            <p className="text-[#f0f0f0] text-lg font-light">{totalSeries}</p>
            <p className="text-[9px] tracking-wider uppercase text-[#444]">series totales</p>
          </div>
        </div>

        {/* Days */}
        {dias.map((dia) => (
          <div key={dia.id} className="rounded-xl overflow-hidden" style={{ border: "1px solid #222" }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ background: "#141414" }}>
              <p className="text-[#f0f0f0] text-sm font-light">{dia.nombre}</p>
              <Link
                href={`/rutinas/${rutina.id}/entrenar/${dia.id}`}
                className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: "rgba(42,191,191,0.1)", color: "#2abfbf", border: "1px solid rgba(42,191,191,0.2)" }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <path d="M5 3l14 9-14 9V3z" fill="currentColor"/>
                </svg>
                Entrenar
              </Link>
            </div>
            <div className="divide-y divide-[#1a1a1a]" style={{ background: "#0f0f0f" }}>
              {dia.rutina_ejercicios.map((ej, i) => (
                <div key={ej.id} className="px-4 py-2.5 flex items-center gap-3">
                  <span className="text-[9px] font-mono text-[#2a2a2a] w-4 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="flex-1 text-[#ccc] text-xs font-light truncate">{ej.nombre}</p>
                  <p className="text-[#555] text-[10px] shrink-0">{ej.series}×{ej.repeticiones}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Delete */}
        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full border border-[#222] text-[#555] text-xs tracking-[0.2em] uppercase py-4 rounded-xl hover:border-[#f0a0a0] hover:text-[#f0a0a0] transition-colors mt-4"
          >
            Eliminar rutina
          </button>
        ) : (
          <div className="rounded-xl px-4 py-4 space-y-3 mt-4"
            style={{ border: "1px solid #3a1a1a", background: "#1a0e0e" }}>
            <p className="text-[#f0a0a0] text-sm text-center font-light">
              ¿Eliminar esta rutina? No se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 border border-[#222] text-[#555] text-xs tracking-widest uppercase py-3 rounded-lg transition-colors">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={isDeleting}
                className="flex-1 border border-[#f0a0a0] text-[#f0a0a0] text-xs tracking-widest uppercase py-3 rounded-lg transition-colors disabled:opacity-50">
                {isDeleting ? "Eliminando…" : "Sí, eliminar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
