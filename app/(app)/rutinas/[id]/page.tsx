"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type Ejercicio = {
  id: string;
  nombre: string;
  series: number;
  repeticiones: number;
  peso: number | null;
  orden: number;
};

type Rutina = {
  id: string;
  nombre: string;
  fecha: string;
  ejercicios_rutina: Ejercicio[];
};

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function formatFecha(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
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
      .select("id, nombre, fecha, ejercicios_rutina(id, nombre, series, repeticiones, peso, orden)")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { router.push("/rutinas"); return; }
        const r = data as Rutina;
        r.ejercicios_rutina.sort((a, b) => a.orden - b.orden);
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

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Header */}
      <div className="px-6 pt-14 pb-4 flex items-center gap-3">
        <Link href="/rutinas" className="transition-colors shrink-0" style={{ color: "#444" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#444]">
            {formatFecha(rutina.fecha)}
          </p>
          <h1 className="text-xl font-light text-[#f0f0f0] tracking-tight truncate">{rutina.nombre}</h1>
        </div>
      </div>

      <div className="px-4 pb-10 space-y-3">
        {/* Stats bar */}
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-6"
          style={{ background: "#141414", border: "1px solid #222" }}
        >
          <div className="text-center">
            <p className="text-[#f0f0f0] text-lg font-light">{rutina.ejercicios_rutina.length}</p>
            <p className="text-[9px] tracking-wider uppercase text-[#444]">ejercicios</p>
          </div>
          <div className="w-px h-8 bg-[#222]" />
          <div className="text-center">
            <p className="text-[#f0f0f0] text-lg font-light">
              {rutina.ejercicios_rutina.reduce((s, e) => s + e.series, 0)}
            </p>
            <p className="text-[9px] tracking-wider uppercase text-[#444]">series totales</p>
          </div>
          <div className="w-px h-8 bg-[#222]" />
          <div className="text-center">
            <p className="text-[#f0f0f0] text-lg font-light">
              {rutina.ejercicios_rutina.filter((e) => e.peso).length > 0
                ? `${Math.max(...rutina.ejercicios_rutina.filter((e) => e.peso).map((e) => e.peso!))} kg`
                : "—"}
            </p>
            <p className="text-[9px] tracking-wider uppercase text-[#444]">peso máx.</p>
          </div>
        </div>

        {/* Exercise list */}
        <div className="space-y-2">
          {rutina.ejercicios_rutina.map((ej, i) => (
            <div
              key={ej.id}
              className="rounded-xl px-4 py-3.5 flex items-center gap-3"
              style={{ background: "#141414", border: "1px solid #222" }}
            >
              <span className="text-[10px] font-mono text-[#333] w-5 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[#f0f0f0] text-sm font-light truncate">{ej.nombre}</p>
                <p className="text-[#555] text-xs mt-0.5 font-light">
                  {ej.series} series × {ej.repeticiones} reps
                  {ej.peso ? ` · ${ej.peso} kg` : ""}
                </p>
              </div>
              {/* Series badges */}
              <div className="flex gap-1 shrink-0">
                {Array.from({ length: Math.min(ej.series, 5) }).map((_, s) => (
                  <div
                    key={s}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "rgba(42,191,191,0.4)" }}
                  />
                ))}
                {ej.series > 5 && (
                  <span className="text-[9px] text-[#444]">+{ej.series - 5}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Delete */}
        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full border border-[#222] text-[#555] text-xs tracking-[0.2em] uppercase py-4 rounded-xl hover:border-[#f0a0a0] hover:text-[#f0a0a0] transition-colors mt-4"
          >
            Eliminar rutina
          </button>
        ) : (
          <div
            className="rounded-xl px-4 py-4 space-y-3 mt-4"
            style={{ border: "1px solid #3a1a1a", background: "#1a0e0e" }}
          >
            <p className="text-[#f0a0a0] text-sm text-center font-light">
              ¿Eliminar esta rutina? No se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 border border-[#222] text-[#555] text-xs tracking-widest uppercase py-3 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 border border-[#f0a0a0] text-[#f0a0a0] text-xs tracking-widest uppercase py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Eliminando…" : "Sí, eliminar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
