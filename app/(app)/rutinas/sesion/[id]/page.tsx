"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type SerieRealizada = {
  id: string;
  numero_serie: number;
  repeticiones: number | null;
  peso: number | null;
  completada: boolean;
};
type EjercicioConSeries = {
  id: string;
  nombre: string;
  orden: number;
  series: SerieRealizada[];
};
type SesionDetalle = {
  id: string;
  fecha: string;
  dia_nombre: string;
  ejercicios: EjercicioConSeries[];
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

export default function SesionDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [sesion, setSesion] = useState<SesionDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const supabase = getSupabase();
    supabase
      .from("sesiones")
      .select(`
        id, fecha,
        rutina_dias(nombre),
        series_realizadas(
          id, numero_serie, repeticiones, peso, completada,
          rutina_ejercicios(id, nombre, orden)
        )
      `)
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { router.push("/rutinas"); return; }
        const d = data as any;

        // Group series by ejercicio
        const ejMap = new Map<string, EjercicioConSeries>();
        for (const sr of d.series_realizadas ?? []) {
          const ej = sr.rutina_ejercicios;
          if (!ej) continue;
          if (!ejMap.has(ej.id)) {
            ejMap.set(ej.id, { id: ej.id, nombre: ej.nombre, orden: ej.orden, series: [] });
          }
          ejMap.get(ej.id)!.series.push({
            id: sr.id,
            numero_serie: sr.numero_serie,
            repeticiones: sr.repeticiones,
            peso: sr.peso,
            completada: sr.completada,
          });
        }
        const ejercicios = Array.from(ejMap.values())
          .sort((a, b) => a.orden - b.orden)
          .map((ej) => ({ ...ej, series: ej.series.sort((a, b) => a.numero_serie - b.numero_serie) }));

        setSesion({
          id: d.id,
          fecha: d.fecha,
          dia_nombre: d.rutina_dias?.nombre ?? "—",
          ejercicios,
        });
        setLoading(false);
      });
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!sesion) return null;

  const totalSeries = sesion.ejercicios.reduce((s, ej) => s + ej.series.length, 0);
  const completadas = sesion.ejercicios.reduce((s, ej) => s + ej.series.filter((sr) => sr.completada).length, 0);
  const todosLosPesos = sesion.ejercicios.flatMap((ej) =>
    ej.series.map((s) => s.peso).filter((p): p is number => p != null)
  );
  const pesoMax = todosLosPesos.length ? Math.max(...todosLosPesos) : null;

  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="px-6 pt-14 pb-4 flex items-center gap-3">
        <Link href="/rutinas" className="shrink-0" style={{ color: "#444" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#444]">{formatFecha(sesion.fecha)}</p>
          <h1 className="text-xl font-light text-[#f0f0f0] truncate">{sesion.dia_nombre}</h1>
        </div>
      </div>

      <div className="px-4 pb-10 space-y-3">
        {/* Stats */}
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-6"
          style={{ background: "#141414", border: "1px solid #222" }}
        >
          <div className="text-center">
            <p className="text-[#f0f0f0] text-lg font-light">{sesion.ejercicios.length}</p>
            <p className="text-[9px] tracking-wider uppercase text-[#444]">ejercicios</p>
          </div>
          <div className="w-px h-8 bg-[#222]" />
          <div className="text-center">
            <p className="text-[#f0f0f0] text-lg font-light">{completadas}/{totalSeries}</p>
            <p className="text-[9px] tracking-wider uppercase text-[#444]">series</p>
          </div>
          <div className="w-px h-8 bg-[#222]" />
          <div className="text-center">
            <p className="text-[#f0f0f0] text-lg font-light">
              {pesoMax != null ? `${pesoMax} kg` : "—"}
            </p>
            <p className="text-[9px] tracking-wider uppercase text-[#444]">peso máx.</p>
          </div>
        </div>

        {/* Exercise results */}
        {sesion.ejercicios.map((ej) => (
          <div key={ej.id} className="rounded-xl overflow-hidden" style={{ border: "1px solid #222" }}>
            <div className="px-4 py-3" style={{ background: "#141414" }}>
              <p className="text-[#f0f0f0] text-sm font-light">{ej.nombre}</p>
            </div>
            <div className="divide-y divide-[#151515]" style={{ background: "#0f0f0f" }}>
              <div className="px-4 py-1.5 grid grid-cols-[28px_1fr_1fr_24px] gap-2 items-center">
                <span className="text-[8px] tracking-wider uppercase text-[#2a2a2a]">ser.</span>
                <span className="text-[8px] tracking-wider uppercase text-[#2a2a2a] text-center">kg</span>
                <span className="text-[8px] tracking-wider uppercase text-[#2a2a2a] text-center">reps</span>
                <span />
              </div>
              {ej.series.map((s) => (
                <div
                  key={s.id}
                  className="px-4 py-2.5 grid grid-cols-[28px_1fr_1fr_24px] gap-2 items-center"
                  style={{ background: s.completada ? "rgba(42,191,191,0.03)" : undefined }}
                >
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: s.completada ? "#2abfbf" : "#444" }}
                  >
                    {String(s.numero_serie).padStart(2, "0")}
                  </span>
                  <p className="text-[#ccc] text-xs text-center font-light">
                    {s.peso != null ? `${s.peso}` : "—"}
                  </p>
                  <p className="text-[#ccc] text-xs text-center font-light">
                    {s.repeticiones != null ? s.repeticiones : "—"}
                  </p>
                  <div className="flex justify-center">
                    {s.completada ? (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12l5 5L19 7" stroke="#2abfbf" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <div className="w-2 h-2 rounded-full" style={{ background: "#1e1e1e" }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
