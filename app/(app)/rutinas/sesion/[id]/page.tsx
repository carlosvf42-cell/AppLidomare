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
type CardioRonda = {
  id: string;
  numero_ronda: number;
  watts: number | null;
  calorias_real: number | null;
  distancia_metros_real: number | null;
  duracion_seg_real: number | null;
  completada: boolean;
};
type CardioBlockRegistro = {
  bloqueId: string | null;
  nombre: string | null;
  maquina: string;
  modo: string | null;
  rondas: CardioRonda[];
};
type FuncionalRegistro = {
  id: string;
  nombre_ejercicio: string | null;
  kg: number | null;
  reps_real: number | null;
  calorias_real: number | null;
  metros_real: number | null;
  ejercicio_funcional_id: string | null;
};
type FuncionalBlockRegistro = {
  bloqueId: string | null;
  nombre: string | null;
  formato: string | null;
  tiempo_minutos: number | null;
  registros: FuncionalRegistro[];
};
type SesionDetalle = {
  id: string;
  fecha: string;
  dia_nombre: string;
  ejercicios: EjercicioConSeries[];
  cardio: CardioBlockRegistro[];
  funcional: FuncionalBlockRegistro[];
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

const MAQUINA_LABELS: Record<string, string> = {
  carrera: "Carrera",
  bici: "Bici",
  ski: "Ski",
  remo: "Remo",
};
const MODO_LABELS: Record<string, string> = {
  distancia: "Distancia",
  intervalos_tiempo: "Intervalos por tiempo",
  calorias_total: "Calorías totales",
  distancia_total: "Distancia total",
  intervalos_calorias: "Intervalos por calorías",
};
const FORMATO_LABELS: Record<string, string> = {
  for_time: "For time",
  amrap: "AMRAP",
  emom: "EMOM",
  tabata: "Tabata",
};

export default function SesionDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [sesion, setSesion] = useState<SesionDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const supabase = getSupabase();
    (async () => {
      const [{ data: sesData, error: sesErr }, { data: cardioData }, { data: funcData }] = await Promise.all([
        supabase
          .from("sesiones")
          .select(`
            id, fecha,
            rutina_dias(nombre),
            series_realizadas(
              id, numero_serie, repeticiones, peso, completada,
              ejercicio_catalogo_id,
              rutina_ejercicios(id, nombre, orden),
              ejercicios:ejercicio_catalogo_id(id, nombre)
            )
          `)
          .eq("id", id)
          .single(),
        supabase
          .from("registros_cardio")
          .select("id, bloque_id, maquina, numero_ronda, watts, calorias_real, distancia_metros_real, duracion_seg_real, completada, rutina_bloques_cardio(id, nombre, modo)")
          .eq("sesion_id", id)
          .order("numero_ronda", { ascending: true }),
        supabase
          .from("registros_funcional_user")
          .select("id, bloque_id, ejercicio_funcional_id, nombre_ejercicio, kg, reps_real, calorias_real, metros_real, rutina_bloques_funcional(id, nombre, formato, tiempo_minutos)")
          .eq("sesion_id", id),
      ]);

      if (sesErr || !sesData) {
        router.push("/rutinas");
        return;
      }
      const d = sesData as any;

      const ejMap = new Map<string, EjercicioConSeries>();
      // Counter para asegurar orden estable de los ad-hoc (sin rutina_ejercicios)
      let adHocOrden = 9000;
      for (const sr of d.series_realizadas ?? []) {
        const ej = sr.rutina_ejercicios;
        let key: string;
        let nombre: string;
        let orden: number;
        if (ej) {
          key = `r:${ej.id}`;
          nombre = ej.nombre;
          orden = ej.orden;
        } else if (sr.ejercicio_catalogo_id) {
          // Bloque fuerza ad-hoc → agrupa por catálogo
          key = `c:${sr.ejercicio_catalogo_id}`;
          nombre = sr.ejercicios?.nombre ?? "Ejercicio extra";
          orden = adHocOrden;
        } else {
          // Sin rutina_ejercicio ni catálogo → no se puede agrupar, lo saltamos
          continue;
        }
        if (!ejMap.has(key)) {
          ejMap.set(key, { id: key, nombre, orden, series: [] });
          if (!ej) adHocOrden++;
        }
        ejMap.get(key)!.series.push({
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

      // Group cardio registros by bloque_id (null → ad-hoc grouped by maquina)
      const cardioGroups = new Map<string, CardioBlockRegistro>();
      for (const r of (cardioData ?? []) as any[]) {
        const key = r.bloque_id ?? `adhoc:${r.maquina}`;
        if (!cardioGroups.has(key)) {
          cardioGroups.set(key, {
            bloqueId: r.bloque_id ?? null,
            nombre: r.rutina_bloques_cardio?.nombre ?? null,
            maquina: r.maquina,
            modo: r.rutina_bloques_cardio?.modo ?? null,
            rondas: [],
          });
        }
        cardioGroups.get(key)!.rondas.push({
          id: r.id,
          numero_ronda: r.numero_ronda,
          watts: r.watts,
          calorias_real: r.calorias_real,
          distancia_metros_real: r.distancia_metros_real,
          duracion_seg_real: r.duracion_seg_real,
          completada: r.completada,
        });
      }
      const cardio = Array.from(cardioGroups.values()).map((c) => ({
        ...c,
        rondas: c.rondas.sort((a, b) => a.numero_ronda - b.numero_ronda),
      }));

      // Group funcional registros by bloque_id (null → ad-hoc as a single group)
      const funcGroups = new Map<string, FuncionalBlockRegistro>();
      for (const r of (funcData ?? []) as any[]) {
        const key = r.bloque_id ?? `adhoc:${r.id}`;
        if (!funcGroups.has(key)) {
          funcGroups.set(key, {
            bloqueId: r.bloque_id ?? null,
            nombre: r.rutina_bloques_funcional?.nombre ?? null,
            formato: r.rutina_bloques_funcional?.formato ?? null,
            tiempo_minutos: r.rutina_bloques_funcional?.tiempo_minutos ?? null,
            registros: [],
          });
        }
        funcGroups.get(key)!.registros.push({
          id: r.id,
          nombre_ejercicio: r.nombre_ejercicio,
          kg: r.kg,
          reps_real: r.reps_real,
          calorias_real: r.calorias_real,
          metros_real: r.metros_real,
          ejercicio_funcional_id: r.ejercicio_funcional_id,
        });
      }
      const funcional = Array.from(funcGroups.values());

      setSesion({
        id: d.id,
        fecha: d.fecha,
        dia_nombre: d.rutina_dias?.nombre ?? "—",
        ejercicios,
        cardio,
        funcional,
      });
      setLoading(false);
    })();
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
        {sesion.ejercicios.length > 0 && (
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
        )}

        {/* Exercise results (fuerza) */}
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

        {/* Cardio results */}
        {sesion.cardio.map((c, idx) => (
          <div key={`c-${idx}`} className="rounded-xl overflow-hidden" style={{ border: "1px solid #2a1f0a" }}>
            <div className="px-4 py-3" style={{ background: "rgba(255,176,64,0.06)" }}>
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-[9px] tracking-[0.2em] uppercase font-semibold"
                style={{ background: "rgba(255,176,64,0.15)", border: "0.5px solid rgba(255,176,64,0.4)", color: "#ffb040" }}
              >
                Cardio · {MAQUINA_LABELS[c.maquina] ?? c.maquina}
              </span>
              {c.nombre && <p className="mt-1.5 text-[#f0f0f0] text-sm font-light">{c.nombre}</p>}
              {c.modo && (
                <p className="mt-1 text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {MODO_LABELS[c.modo] ?? c.modo}
                </p>
              )}
            </div>
            <div className="divide-y divide-[#151515]" style={{ background: "#0f0f0f" }}>
              <div className="px-4 py-1.5 grid grid-cols-[28px_1fr_1fr_1fr_24px] gap-2 items-center">
                <span className="text-[8px] tracking-wider uppercase text-[#2a2a2a]">r</span>
                <span className="text-[8px] tracking-wider uppercase text-[#2a2a2a] text-center">cal</span>
                <span className="text-[8px] tracking-wider uppercase text-[#2a2a2a] text-center">m</span>
                <span className="text-[8px] tracking-wider uppercase text-[#2a2a2a] text-center">seg</span>
                <span />
              </div>
              {c.rondas.map((r) => (
                <div
                  key={r.id}
                  className="px-4 py-2.5 grid grid-cols-[28px_1fr_1fr_1fr_24px] gap-2 items-center"
                  style={{ background: r.completada ? "rgba(42,191,191,0.03)" : undefined }}
                >
                  <span className="text-[10px] font-mono" style={{ color: r.completada ? "#2abfbf" : "#444" }}>
                    {String(r.numero_ronda).padStart(2, "0")}
                  </span>
                  <p className="text-[#ccc] text-xs text-center font-light">
                    {r.calorias_real != null ? r.calorias_real : "—"}
                  </p>
                  <p className="text-[#ccc] text-xs text-center font-light">
                    {r.distancia_metros_real != null ? r.distancia_metros_real : "—"}
                  </p>
                  <p className="text-[#ccc] text-xs text-center font-light">
                    {r.duracion_seg_real != null ? r.duracion_seg_real : "—"}
                  </p>
                  <div className="flex justify-center">
                    {r.completada ? (
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

        {/* Funcional results */}
        {sesion.funcional.map((f, idx) => (
          <div key={`f-${idx}`} className="rounded-xl overflow-hidden" style={{ border: "1px solid #0a2a2a" }}>
            <div className="px-4 py-3" style={{ background: "rgba(42,191,191,0.05)" }}>
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-[9px] tracking-[0.2em] uppercase font-semibold"
                style={{ background: "rgba(42,191,191,0.15)", border: "0.5px solid rgba(42,191,191,0.4)", color: "#2abfbf" }}
              >
                Funcional{f.formato ? ` · ${FORMATO_LABELS[f.formato] ?? f.formato}` : ""}
                {f.tiempo_minutos != null ? ` · ${f.tiempo_minutos} min` : ""}
              </span>
              {f.nombre && <p className="mt-1.5 text-[#f0f0f0] text-sm font-light">{f.nombre}</p>}
            </div>
            <div className="divide-y divide-[#151515]" style={{ background: "#0f0f0f" }}>
              {f.registros.map((r) => (
                <div key={r.id} className="px-4 py-2.5">
                  <p className="text-[#ccc] text-sm font-light">{r.nombre_ejercicio || "Ejercicio"}</p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {r.kg != null && <span>{r.kg} kg</span>}
                    {r.reps_real != null && <span>{r.reps_real} reps</span>}
                    {r.calorias_real != null && <span>{r.calorias_real} cal</span>}
                    {r.metros_real != null && <span>{r.metros_real} m</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {sesion.ejercicios.length === 0 && sesion.cardio.length === 0 && sesion.funcional.length === 0 && (
          <p className="text-center pt-12 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            Sesión sin registros.
          </p>
        )}
      </div>
    </div>
  );
}
