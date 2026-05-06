"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const ADMIN_EMAIL = "carlosvf42@gmail.com";

const FONT_UI = "var(--font-ui)";
const FONT_SERIF = "var(--font-serif)";

const META = {
  fuerza: { color: "#ff8060", bg: "rgba(255,128,96,0.1)", border: "rgba(255,128,96,0.35)" },
  cardio: { color: "#ffb040", bg: "rgba(255,176,64,0.1)", border: "rgba(255,176,64,0.35)" },
  funcional: { color: "#2abfbf", bg: "rgba(42,191,191,0.12)", border: "rgba(42,191,191,0.4)" },
} as const;

const MAQUINA_LABELS: Record<string, string> = {
  carrera: "Carrera",
  bici: "Bici",
  ski: "Ski",
  remo: "Remo",
};

const FORMATO_LABELS: Record<string, string> = {
  for_time: "For time",
  amrap: "AMRAP",
  emom: "EMOM",
  tabata: "Tabata",
};

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function formatFecha(s: string): string {
  const d = new Date(s + "T12:00:00");
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

type SesionData = {
  id: string;
  fecha: string;
  duracion_minutos: number | null;
  rpe: number | null;
  comentario: string | null;
  tipo_resumen: string | null;
  nombre: string | null;
};

type FuerzaSerie = {
  id: string;
  numero_serie: number;
  peso: number | null;
  repeticiones: number | null;
  completada: boolean;
};

type FuerzaEjercicioGrupo = {
  bloque_id: string | null;
  ejercicio_fuerza_id: string | null;
  nombre: string;
  orden: number;
  series: FuerzaSerie[];
};

type CardioGrupo = {
  bloque_id: string | null;
  nombre: string;
  maquina: string | null;
  modo: string | null;
  rondas: Array<{
    id: string;
    numero_ronda: number;
    watts: number | null;
    calorias_real: number | null;
    distancia_metros_real: number | null;
    calorias_total_real: number | null;
    completada: boolean;
  }>;
};

type FuncionalEjReg = {
  id: string;
  nombre: string;
  tipo: "fuerza" | "cardio" | string;
  kg: number | null;
  reps_real: number | null;
  calorias_real: number | null;
  metros_real: number | null;
};

type FuncionalGrupo = {
  bloque_id: string | null;
  nombre: string;
  formato: string | null;
  tiempo_minutos: number | null;
  registros: FuncionalEjReg[];
};

export default function SesionAntifragilDetailPage() {
  const router = useRouter();
  const rawParams = useParams();
  const userId =
    typeof rawParams?.userId === "string" ? rawParams.userId :
    Array.isArray(rawParams?.userId) ? rawParams.userId[0] : "";
  const sesionId =
    typeof rawParams?.sesionId === "string" ? rawParams.sesionId :
    Array.isArray(rawParams?.sesionId) ? rawParams.sesionId[0] : "";

  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sesion, setSesion] = useState<SesionData | null>(null);
  const [fuerza, setFuerza] = useState<FuerzaEjercicioGrupo[]>([]);
  const [cardio, setCardio] = useState<CardioGrupo[]>([]);
  const [funcional, setFuncional] = useState<FuncionalGrupo[]>([]);

  useEffect(() => {
    getSupabase()
      .auth.getSession()
      .then(({ data }) => {
        if (data.session?.user?.email !== ADMIN_EMAIL) {
          router.replace("/");
        } else {
          setChecking(false);
        }
      });
  }, [router]);

  useEffect(() => {
    if (checking || !sesionId) return;
    const supabase = getSupabase();
    (async () => {
      const [sesRes, fuerzaRes, cardioRes, funcRes] = await Promise.all([
        supabase
          .from("sesiones_antifragil")
          .select("id, fecha, duracion_minutos, rpe, comentario, tipo_resumen, entrenos_antifragil(nombre)")
          .eq("id", sesionId)
          .maybeSingle(),
        supabase
          .from("series_fuerza_antifragil")
          .select("id, numero_serie, peso, repeticiones, completada, bloque_id, ejercicio_fuerza_id, ejercicios_fuerza(orden, nombre_ejercicio, ejercicios:ejercicio_id(nombre))")
          .eq("sesion_id", sesionId),
        supabase
          .from("series_cardio_antifragil")
          .select("id, numero_ronda, watts, calorias_real, distancia_metros_real, calorias_total_real, completada, bloque_id, bloques_cardio(nombre, maquina, modo)")
          .eq("sesion_id", sesionId)
          .order("numero_ronda", { ascending: true }),
        supabase
          .from("registros_funcional")
          .select("id, kg, reps_real, calorias_real, metros_real, ejercicio_funcional_id, ejercicios_funcional(tipo, nombre_ejercicio, bloque_id, ejercicios:ejercicio_id(nombre), bloques_funcional:bloque_id(nombre, formato, tiempo_minutos))")
          .eq("sesion_id", sesionId),
      ]);

      if (!sesRes.data) {
        setError("Sesión no encontrada");
        setLoading(false);
        return;
      }
      const s = sesRes.data as any;
      const ent = Array.isArray(s.entrenos_antifragil) ? s.entrenos_antifragil[0] : s.entrenos_antifragil;
      setSesion({
        id: s.id,
        fecha: s.fecha,
        duracion_minutos: s.duracion_minutos,
        rpe: s.rpe,
        comentario: s.comentario,
        tipo_resumen: s.tipo_resumen,
        nombre: ent?.nombre ?? null,
      });

      // Fuerza: agrupa por ejercicio_fuerza_id
      const fuerzaMap = new Map<string, FuerzaEjercicioGrupo>();
      for (const r of (fuerzaRes.data ?? []) as any[]) {
        const ef = Array.isArray(r.ejercicios_fuerza) ? r.ejercicios_fuerza[0] : r.ejercicios_fuerza;
        const cat = ef && (Array.isArray(ef.ejercicios) ? ef.ejercicios[0] : ef.ejercicios);
        const key = `${r.ejercicio_fuerza_id ?? r.bloque_id ?? "x"}`;
        const nombre = cat?.nombre || ef?.nombre_ejercicio || "Ejercicio";
        if (!fuerzaMap.has(key)) {
          fuerzaMap.set(key, {
            bloque_id: r.bloque_id ?? null,
            ejercicio_fuerza_id: r.ejercicio_fuerza_id ?? null,
            nombre,
            orden: ef?.orden ?? 0,
            series: [],
          });
        }
        fuerzaMap.get(key)!.series.push({
          id: r.id,
          numero_serie: r.numero_serie,
          peso: r.peso,
          repeticiones: r.repeticiones,
          completada: !!r.completada,
        });
      }
      const fuerzaArr = Array.from(fuerzaMap.values())
        .map((g) => ({ ...g, series: g.series.sort((a, b) => a.numero_serie - b.numero_serie) }))
        .sort((a, b) => a.orden - b.orden);
      setFuerza(fuerzaArr);

      // Cardio: agrupa por bloque_id
      const cardioMap = new Map<string, CardioGrupo>();
      for (const r of (cardioRes.data ?? []) as any[]) {
        const bc = Array.isArray(r.bloques_cardio) ? r.bloques_cardio[0] : r.bloques_cardio;
        const key = r.bloque_id ?? `x:${r.id}`;
        if (!cardioMap.has(key)) {
          cardioMap.set(key, {
            bloque_id: r.bloque_id ?? null,
            nombre: bc?.nombre ?? "Cardio",
            maquina: bc?.maquina ?? null,
            modo: bc?.modo ?? null,
            rondas: [],
          });
        }
        cardioMap.get(key)!.rondas.push({
          id: r.id,
          numero_ronda: r.numero_ronda,
          watts: r.watts,
          calorias_real: r.calorias_real,
          distancia_metros_real: r.distancia_metros_real,
          calorias_total_real: r.calorias_total_real,
          completada: !!r.completada,
        });
      }
      setCardio(Array.from(cardioMap.values()));

      // Funcional: agrupa por bloque
      const funcMap = new Map<string, FuncionalGrupo>();
      for (const r of (funcRes.data ?? []) as any[]) {
        const ef = Array.isArray(r.ejercicios_funcional) ? r.ejercicios_funcional[0] : r.ejercicios_funcional;
        const cat = ef && (Array.isArray(ef.ejercicios) ? ef.ejercicios[0] : ef.ejercicios);
        const bf = ef && (Array.isArray(ef.bloques_funcional) ? ef.bloques_funcional[0] : ef.bloques_funcional);
        const key = ef?.bloque_id ?? `x:${r.id}`;
        if (!funcMap.has(key)) {
          funcMap.set(key, {
            bloque_id: ef?.bloque_id ?? null,
            nombre: bf?.nombre ?? "Funcional",
            formato: bf?.formato ?? null,
            tiempo_minutos: bf?.tiempo_minutos ?? null,
            registros: [],
          });
        }
        funcMap.get(key)!.registros.push({
          id: r.id,
          nombre: cat?.nombre || ef?.nombre_ejercicio || "Ejercicio",
          tipo: ef?.tipo ?? "fuerza",
          kg: r.kg,
          reps_real: r.reps_real,
          calorias_real: r.calorias_real,
          metros_real: r.metros_real,
        });
      }
      setFuncional(Array.from(funcMap.values()));

      setLoading(false);
    })();
  }, [checking, sesionId]);

  if (checking || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080808" }}>
        <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !sesion) {
    return (
      <div className="min-h-screen p-8" style={{ background: "#080808" }}>
        <p className="text-xs text-center" style={{ color: "#ff8080", fontFamily: FONT_UI }}>
          {error ?? "No se pudo cargar la sesión"}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#080808" }}>
      {/* Header */}
      <div className="px-6 pt-14 pb-4 flex items-center gap-3">
        <Link href={`/admin/antifragil/${userId}`} className="shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div className="min-w-0">
          <p style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(42,191,191,0.7)", fontFamily: FONT_UI }}>
            {formatFecha(sesion.fecha)}
          </p>
          <h1 className="truncate" style={{ fontFamily: FONT_SERIF, fontSize: "1.6rem", fontWeight: 500, color: "rgba(255,255,255,0.95)" }}>
            {sesion.nombre || "Sesión Antifrágil"}
          </h1>
        </div>
      </div>

      <div className="px-4 pb-12 space-y-3">
        {/* Stats */}
        {(sesion.duracion_minutos != null || sesion.rpe != null) && (
          <div className="rounded-xl px-4 py-3 flex items-center gap-6" style={{ background: "#141414", border: "1px solid #222" }}>
            {sesion.duracion_minutos != null && (
              <div className="text-center">
                <p style={{ fontSize: 18, fontWeight: 300, color: "#f0f0f0", fontFamily: FONT_UI }}>{sesion.duracion_minutos}</p>
                <p className="text-[9px] tracking-wider uppercase" style={{ color: "#444", fontFamily: FONT_UI }}>min</p>
              </div>
            )}
            {sesion.duracion_minutos != null && sesion.rpe != null && <div className="w-px h-8 bg-[#222]" />}
            {sesion.rpe != null && (
              <div className="text-center">
                <p style={{ fontSize: 18, fontWeight: 300, color: "#f0f0f0", fontFamily: FONT_UI }}>{sesion.rpe}/10</p>
                <p className="text-[9px] tracking-wider uppercase" style={{ color: "#444", fontFamily: FONT_UI }}>RPE</p>
              </div>
            )}
            {sesion.tipo_resumen && (
              <>
                <div className="w-px h-8 bg-[#222]" />
                <div className="text-center">
                  <p className="capitalize" style={{ fontSize: 13, fontWeight: 400, color: "#2abfbf", fontFamily: FONT_UI }}>{sesion.tipo_resumen}</p>
                  <p className="text-[9px] tracking-wider uppercase" style={{ color: "#444", fontFamily: FONT_UI }}>tipo</p>
                </div>
              </>
            )}
          </div>
        )}

        {sesion.comentario && (
          <div className="rounded-xl px-4 py-3" style={{ background: "rgba(42,191,191,0.05)", border: "0.5px solid rgba(42,191,191,0.2)" }}>
            <p className="text-[9px] tracking-[0.2em] uppercase mb-1" style={{ color: "rgba(42,191,191,0.7)", fontFamily: FONT_UI }}>
              Comentario
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontFamily: FONT_UI, lineHeight: 1.5 }}>{sesion.comentario}</p>
          </div>
        )}

        {/* Fuerza */}
        {fuerza.map((g) => (
          <div key={g.bloque_id ?? g.nombre} className="rounded-xl overflow-hidden" style={{ border: "1px solid #2a1f0a" }}>
            <div className="px-4 py-3" style={{ background: "rgba(255,128,96,0.06)" }}>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] tracking-[0.2em] uppercase font-semibold"
                style={{ background: META.fuerza.bg, border: `0.5px solid ${META.fuerza.border}`, color: META.fuerza.color, fontFamily: FONT_UI }}>
                Fuerza
              </span>
              <p className="mt-1.5 text-sm font-light" style={{ color: "#f0f0f0", fontFamily: FONT_UI }}>{g.nombre}</p>
            </div>
            <div className="divide-y divide-[#151515]" style={{ background: "#0f0f0f" }}>
              <div className="px-4 py-1.5 grid grid-cols-[28px_1fr_1fr_24px] gap-2 items-center">
                <span className="text-[8px] tracking-wider uppercase text-[#2a2a2a]">ser.</span>
                <span className="text-[8px] tracking-wider uppercase text-[#2a2a2a] text-center">kg</span>
                <span className="text-[8px] tracking-wider uppercase text-[#2a2a2a] text-center">reps</span>
                <span />
              </div>
              {g.series.map((s) => (
                <div key={s.id} className="px-4 py-2.5 grid grid-cols-[28px_1fr_1fr_24px] gap-2 items-center"
                  style={{ background: s.completada ? "rgba(42,191,191,0.03)" : undefined }}>
                  <span className="text-[10px] font-mono" style={{ color: s.completada ? "#2abfbf" : "#444" }}>
                    {String(s.numero_serie).padStart(2, "0")}
                  </span>
                  <p className="text-[#ccc] text-xs text-center font-light">{s.peso != null ? s.peso : "—"}</p>
                  <p className="text-[#ccc] text-xs text-center font-light">{s.repeticiones != null ? s.repeticiones : "—"}</p>
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

        {/* Cardio */}
        {cardio.map((c, idx) => (
          <div key={`c-${idx}`} className="rounded-xl overflow-hidden" style={{ border: "1px solid #2a1f0a" }}>
            <div className="px-4 py-3" style={{ background: "rgba(255,176,64,0.06)" }}>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] tracking-[0.2em] uppercase font-semibold"
                style={{ background: META.cardio.bg, border: `0.5px solid ${META.cardio.border}`, color: META.cardio.color, fontFamily: FONT_UI }}>
                Cardio{c.maquina ? ` · ${MAQUINA_LABELS[c.maquina] ?? c.maquina}` : ""}
              </span>
              {c.nombre && <p className="mt-1.5 text-sm font-light" style={{ color: "#f0f0f0", fontFamily: FONT_UI }}>{c.nombre}</p>}
            </div>
            <div className="divide-y divide-[#151515]" style={{ background: "#0f0f0f" }}>
              <div className="px-4 py-1.5 grid grid-cols-[28px_1fr_1fr_1fr_24px] gap-2 items-center">
                <span className="text-[8px] tracking-wider uppercase text-[#2a2a2a]">r</span>
                <span className="text-[8px] tracking-wider uppercase text-[#2a2a2a] text-center">cal</span>
                <span className="text-[8px] tracking-wider uppercase text-[#2a2a2a] text-center">m</span>
                <span className="text-[8px] tracking-wider uppercase text-[#2a2a2a] text-center">W</span>
                <span />
              </div>
              {c.rondas.map((r) => (
                <div key={r.id} className="px-4 py-2.5 grid grid-cols-[28px_1fr_1fr_1fr_24px] gap-2 items-center"
                  style={{ background: r.completada ? "rgba(42,191,191,0.03)" : undefined }}>
                  <span className="text-[10px] font-mono" style={{ color: r.completada ? "#2abfbf" : "#444" }}>
                    {String(r.numero_ronda).padStart(2, "0")}
                  </span>
                  <p className="text-[#ccc] text-xs text-center font-light">{r.calorias_real ?? r.calorias_total_real ?? "—"}</p>
                  <p className="text-[#ccc] text-xs text-center font-light">{r.distancia_metros_real ?? "—"}</p>
                  <p className="text-[#ccc] text-xs text-center font-light">{r.watts ?? "—"}</p>
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

        {/* Funcional */}
        {funcional.map((f, idx) => (
          <div key={`f-${idx}`} className="rounded-xl overflow-hidden" style={{ border: "1px solid #0a2a2a" }}>
            <div className="px-4 py-3" style={{ background: "rgba(42,191,191,0.05)" }}>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] tracking-[0.2em] uppercase font-semibold"
                style={{ background: META.funcional.bg, border: `0.5px solid ${META.funcional.border}`, color: META.funcional.color, fontFamily: FONT_UI }}>
                Funcional{f.formato ? ` · ${FORMATO_LABELS[f.formato] ?? f.formato}` : ""}
                {f.tiempo_minutos != null ? ` · ${f.tiempo_minutos} min` : ""}
              </span>
              {f.nombre && <p className="mt-1.5 text-sm font-light" style={{ color: "#f0f0f0", fontFamily: FONT_UI }}>{f.nombre}</p>}
            </div>
            <div className="divide-y divide-[#151515]" style={{ background: "#0f0f0f" }}>
              {f.registros.map((r) => (
                <div key={r.id} className="px-4 py-2.5">
                  <p className="text-[#ccc] text-sm font-light">{r.nombre}</p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]" style={{ color: "rgba(255,255,255,0.45)", fontFamily: FONT_UI }}>
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

        {fuerza.length === 0 && cardio.length === 0 && funcional.length === 0 && (
          <p className="text-center pt-12 text-xs" style={{ color: "rgba(255,255,255,0.35)", fontFamily: FONT_UI }}>
            La sesión no tiene registros.
          </p>
        )}
      </div>
    </div>
  );
}
