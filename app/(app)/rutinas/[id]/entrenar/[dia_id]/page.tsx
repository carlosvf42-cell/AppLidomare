"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type SerieForm = { repeticiones: string; peso: string; completada: boolean };
type EjercicioSession = {
  id: string;
  nombre: string;
  series: number;
  repeticiones: number;
  orden: number;
  seriesData: SerieForm[];
};
type Dia = { id: string; nombre: string; rutina_id: string };

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function EntrenarPage() {
  const router = useRouter();
  const { id, dia_id } = useParams<{ id: string; dia_id: string }>();
  const [dia, setDia] = useState<Dia | null>(null);
  const [ejercicios, setEjercicios] = useState<EjercicioSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, startSave] = useTransition();
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!dia_id) return;
    const supabase = getSupabase();
    supabase
      .from("rutina_dias")
      .select("id, nombre, rutina_id, rutina_ejercicios(id, nombre, series, repeticiones, orden)")
      .eq("id", dia_id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { router.push(`/rutinas/${id}`); return; }
        const d = data as any;
        setDia({ id: d.id, nombre: d.nombre, rutina_id: d.rutina_id });
        const sorted = [...d.rutina_ejercicios].sort((a: any, b: any) => a.orden - b.orden);
        setEjercicios(
          sorted.map((ej: any) => ({
            ...ej,
            seriesData: Array.from({ length: ej.series }, () => ({
              repeticiones: String(ej.repeticiones),
              peso: "",
              completada: false,
            })),
          }))
        );
        setLoading(false);
      });
  }, [dia_id, id, router]);

  function updateSerie(ejIdx: number, sIdx: number, key: keyof SerieForm, value: string | boolean) {
    setEjercicios((prev) =>
      prev.map((ej, i) =>
        i === ejIdx
          ? { ...ej, seriesData: ej.seriesData.map((s, j) => (j === sIdx ? { ...s, [key]: value } : s)) }
          : ej
      )
    );
  }

  function toggleSerie(ejIdx: number, sIdx: number) {
    setEjercicios((prev) =>
      prev.map((ej, i) =>
        i === ejIdx
          ? { ...ej, seriesData: ej.seriesData.map((s, j) => (j === sIdx ? { ...s, completada: !s.completada } : s)) }
          : ej
      )
    );
  }

  function handleSave() {
    setSaveError(null);
    startSave(async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: sesion, error: sesionErr } = await supabase
        .from("sesiones")
        .insert({ user_id: user.id, dia_id, fecha: todayISO() })
        .select("id")
        .single();

      if (sesionErr || !sesion) {
        console.error("Sesion insert error:", sesionErr);
        setSaveError(`No se pudo guardar la sesión. ${sesionErr?.message ?? ""}`);
        return;
      }

      const seriesRows = ejercicios.flatMap((ej) =>
        ej.seriesData.map((s, sIdx) => ({
          sesion_id: sesion.id,
          ejercicio_id: ej.id,
          numero_serie: sIdx + 1,
          repeticiones: s.repeticiones ? parseInt(s.repeticiones) : null,
          peso: s.peso ? parseFloat(s.peso) : null,
          completada: s.completada,
        }))
      );

      const { error: seriesErr } = await supabase.from("series_realizadas").insert(seriesRows);
      if (seriesErr) {
        console.error("Series insert error:", seriesErr);
        setSaveError(`Sesión creada pero error guardando series. ${seriesErr.message}`);
        return;
      }

      setSaved(true);
      setTimeout(() => router.push(`/rutinas/${id}`), 1200);
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!dia) return null;

  const totalCompletadas = ejercicios.reduce((s, ej) => s + ej.seriesData.filter((sr) => sr.completada).length, 0);
  const totalSeries = ejercicios.reduce((s, ej) => s + ej.seriesData.length, 0);

  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="px-6 pt-14 pb-4 flex items-center gap-3">
        <Link href={`/rutinas/${id}`} className="transition-colors shrink-0" style={{ color: "#444" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#444]">sesión de hoy</p>
          <h1 className="text-xl font-light text-[#f0f0f0] tracking-tight truncate">{dia.nombre}</h1>
        </div>
      </div>

      <div className="px-4 pb-28 space-y-4">
        {/* Progress bar */}
        <div className="rounded-xl px-4 py-3 flex items-center gap-4"
          style={{ background: "#141414", border: "1px solid #222" }}>
          <div className="shrink-0">
            <p className="text-[#f0f0f0] text-lg font-light">{totalCompletadas}/{totalSeries}</p>
            <p className="text-[9px] tracking-wider uppercase text-[#444]">series</p>
          </div>
          <div className="flex-1 h-1 rounded-full bg-[#1e1e1e] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: totalSeries ? `${(totalCompletadas / totalSeries) * 100}%` : "0%",
                background: "#2abfbf",
              }}
            />
          </div>
        </div>

        {/* Exercises */}
        {ejercicios.map((ej, ejIdx) => (
          <div key={ej.id} className="rounded-xl overflow-hidden" style={{ border: "1px solid #222" }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ background: "#141414" }}>
              <p className="text-[#f0f0f0] text-sm font-light">{ej.nombre}</p>
              <p className="text-[#555] text-[10px]">objetivo: {ej.repeticiones} reps</p>
            </div>
            <div className="divide-y divide-[#151515]" style={{ background: "#0f0f0f" }}>
              {/* Column headers */}
              <div className="px-4 py-1.5 grid grid-cols-[28px_1fr_1fr_36px] gap-2 items-center">
                <span className="text-[8px] tracking-wider uppercase text-[#2a2a2a]">serie</span>
                <span className="text-[8px] tracking-wider uppercase text-[#2a2a2a] text-center">kg</span>
                <span className="text-[8px] tracking-wider uppercase text-[#2a2a2a] text-center">reps</span>
                <span />
              </div>
              {ej.seriesData.map((s, sIdx) => (
                <div
                  key={sIdx}
                  className="px-4 py-2 grid grid-cols-[28px_1fr_1fr_36px] gap-2 items-center transition-colors"
                  style={{ background: s.completada ? "rgba(42,191,191,0.04)" : undefined }}
                >
                  <span className="text-[10px] font-mono"
                    style={{ color: s.completada ? "#2abfbf" : "#444" }}>
                    {String(sIdx + 1).padStart(2, "0")}
                  </span>
                  <input
                    type="number" min={0} step={0.5} value={s.peso}
                    onChange={(e) => updateSerie(ejIdx, sIdx, "peso", e.target.value)}
                    placeholder="—"
                    className="w-full bg-[#141414] border border-[#1e1e1e] rounded-lg px-2 py-2 text-[#f0f0f0] placeholder-[#333] text-xs text-center outline-none focus:border-[#2abfbf] transition-colors"
                    style={{ opacity: s.completada ? 0.5 : 1 }}
                  />
                  <input
                    type="number" min={0} value={s.repeticiones}
                    onChange={(e) => updateSerie(ejIdx, sIdx, "repeticiones", e.target.value)}
                    className="w-full bg-[#141414] border border-[#1e1e1e] rounded-lg px-2 py-2 text-[#f0f0f0] text-xs text-center outline-none focus:border-[#2abfbf] transition-colors"
                    style={{ opacity: s.completada ? 0.5 : 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => toggleSerie(ejIdx, sIdx)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                    style={{
                      background: s.completada ? "rgba(42,191,191,0.15)" : "#141414",
                      border: `1px solid ${s.completada ? "rgba(42,191,191,0.4)" : "#222"}`,
                    }}
                  >
                    {s.completada ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12l5 5L19 7" stroke="#2abfbf" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#222" }} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {saveError && <p className="text-[#f0a0a0] text-xs text-center px-4">{saveError}</p>}
      </div>

      {/* Floating save button */}
      <div
        className="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 px-4 pb-6 pt-4"
        style={{ background: "linear-gradient(to top, #080808 70%, transparent)" }}
      >
        <button
          onClick={handleSave}
          disabled={isSaving || saved}
          className="w-full py-4 rounded-xl font-semibold text-sm tracking-widest uppercase transition-all disabled:opacity-60"
          style={{
            background: saved ? "rgba(42,191,191,0.15)" : "#2abfbf",
            color: saved ? "#2abfbf" : "#080808",
            border: saved ? "1px solid rgba(42,191,191,0.3)" : "none",
          }}
        >
          {saved ? "Sesión guardada" : isSaving ? "Guardando…" : "Guardar sesión"}
        </button>
      </div>
    </div>
  );
}
