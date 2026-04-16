"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// ─── Row types from Supabase ──────────────────────────────────────────────────

type SesionRow = {
  id: string;
  fecha: string;
  completada: boolean;
  duracion_minutos: number | null;
};

type SerieRow = {
  sesion_id: string;
  peso: number | null;
  repeticiones: number | null;
  completada: boolean;
  ejercicio_catalogo_id: string | null;
};

type PRRow = {
  ejercicio_id: string;
  peso_max: number;
  repeticiones: number;
  ejercicios: { nombre: string; grupo_muscular: string } | null;
};

type SeguidoRow = {
  ejercicio_id: string;
  ejercicios: { id: string; nombre: string; grupo_muscular: string } | null;
};

// ─── Derived state types ──────────────────────────────────────────────────────

type Metrics = {
  completadas: number;
  total: number;
  volumenKg: number;
  durMedia: number | null;
};

type WeekBar   = { key: string; label: string; vol: number };
type PRItem    = { nombre: string; grupo: string; pesoMax: number; reps: number };
type LinePoint = { fecha: string; peso: number };
type SeguimientoData = { nombre: string; grupo: string; historial: LinePoint[] } | null;
type DiaItem   = { day: number; status: "done" | "partial" | "none" };
type GrupoBar  = { grupo: string; vol: number };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoWeek(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const wn = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(wn).padStart(2, "0")}`;
}

function mondayLabel(weekKey: string): string {
  const [yearStr, wStr] = weekKey.split("-W");
  const jan4 = new Date(Date.UTC(Number(yearStr), 0, 4));
  const dow = jan4.getUTCDay() || 7;
  jan4.setUTCDate(jan4.getUTCDate() - dow + 1 + (Number(wStr) - 1) * 7);
  return `${jan4.getUTCDate()}/${jan4.getUTCMonth() + 1}`;
}

function getLast8Weeks(): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  const now = new Date();
  for (let i = 63; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const wk = isoWeek(d.toISOString().split("T")[0]);
    if (!seen.has(wk)) { seen.add(wk); result.push(wk); }
  }
  return result.slice(-8);
}

function fmtVol(kg: number): string {
  if (kg === 0) return "0 kg";
  if (kg < 1000) return `${Math.round(kg)} kg`;
  return `${(kg / 1000).toFixed(2)} t`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[#1a1a1a] ${className}`} />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] tracking-[0.22em] uppercase font-medium mb-3 px-0.5" style={{ color: "#2abfbf" }}>
      {children}
    </p>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[14px] px-4 py-4 ${className ?? ""}`}
      style={{ background: "#111", border: "0.5px solid #222" }}
    >
      {children}
    </div>
  );
}

function MetricCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xl font-light text-[#f0f0f0]">{value}</span>
      <span className="text-[9px] tracking-[0.15em] uppercase text-[#444]">{label}</span>
    </div>
  );
}

function BarChart({ bars }: { bars: WeekBar[] }) {
  const max = Math.max(...bars.map((b) => b.vol), 1);
  return (
    <div>
      <div className="flex items-end gap-1.5 h-16">
        {bars.map((b) => {
          const pct = b.vol / max;
          return (
            <div key={b.key} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-sm transition-all duration-500 relative overflow-hidden"
                style={{ height: `${Math.max(pct * 56, b.vol > 0 ? 4 : 0)}px` }}>
                <div className="absolute inset-0 rounded-t-sm"
                  style={{ background: b.vol > 0 ? "#2abfbf" : "#1e1e1e", opacity: b.vol > 0 ? 0.7 + pct * 0.3 : 1 }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 mt-1.5">
        {bars.map((b) => (
          <div key={b.key} className="flex-1 text-center">
            <span className="text-[8px] text-[#333]">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineChart({ data }: { data: LinePoint[] }) {
  if (data.length === 0) {
    return <p className="text-[#444] text-xs text-center py-4">Entrena este ejercicio para ver la progresión</p>;
  }
  if (data.length === 1) {
    return (
      <div className="text-center py-3">
        <p className="text-[#2abfbf] text-base font-light">{data[0].peso} kg</p>
        <p className="text-[#444] text-[10px] mt-0.5">Primera sesión — sigue entrenando</p>
      </div>
    );
  }

  const W = 280, H = 72, PAD = 10;
  const pesos = data.map((d) => d.peso);
  const minP = Math.min(...pesos);
  const maxP = Math.max(...pesos);
  const range = maxP - minP || 1;
  const pts = data.map((d, i) => ({
    x: PAD + (i / (data.length - 1)) * (W - PAD * 2),
    y: PAD + (1 - (d.peso - minP) / range) * (H - PAD * 2),
    d,
  }));
  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
        <polyline
          points={polyline}
          fill="none"
          stroke="#2abfbf"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.7"
        />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#2abfbf" />
        ))}
      </svg>
      <div className="flex justify-between mt-1 px-0.5">
        <span className="text-[9px] text-[#444]">{data[0].fecha.slice(5).replace("-", "/")}</span>
        <span className="text-[9px] text-[#2abfbf]">{maxP} kg</span>
        <span className="text-[9px] text-[#444]">{data[data.length - 1].fecha.slice(5).replace("-", "/")}</span>
      </div>
    </div>
  );
}

function HBars({ bars }: { bars: GrupoBar[] }) {
  const max = Math.max(...bars.map((b) => b.vol), 1);
  return (
    <div className="space-y-2.5">
      {bars.map((b) => (
        <div key={b.grupo} className="flex items-center gap-3">
          <span className="text-[10px] text-[#555] w-14 shrink-0 truncate">{b.grupo}</span>
          <div className="flex-1 h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(b.vol / max) * 100}%`, background: "#2abfbf", opacity: 0.6 + (b.vol / max) * 0.4 }}
            />
          </div>
          <span className="text-[9px] text-[#444] w-14 text-right shrink-0">{fmtVol(b.vol)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProgresoSection() {
  const [loading, setLoading]     = useState(true);
  const [metrics, setMetrics]     = useState<Metrics | null>(null);
  const [semanas, setSemanas]     = useState<WeekBar[]>([]);
  const [prs, setPrs]             = useState<PRItem[]>([]);
  const [seguido, setSeguido]     = useState<SeguimientoData>(null);
  const [seguidoReady, setSeguidoReady] = useState(false);
  const [diasMes, setDiasMes]     = useState<DiaItem[]>([]);
  const [grupos, setGrupos]       = useState<GrupoBar[]>([]);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const supabase = createClient();

    // ── Batch 1: independent queries ──────────────────────────────────────
    const [sesRes, prsRes, segRes] = await Promise.all([
      supabase.from("sesiones").select("id, fecha, completada, duracion_minutos"),
      supabase.from("prs").select("ejercicio_id, peso_max, repeticiones, ejercicios(nombre, grupo_muscular)"),
      supabase.from("ejercicios_seguidos")
        .select("ejercicio_id, ejercicios(id, nombre, grupo_muscular)")
        .limit(1),
    ]);

    const allSesiones  = (sesRes.data ?? []) as SesionRow[];
    const completedSes = allSesiones.filter((s) => s.completada);
    const allIds       = allSesiones.map((s) => s.id);

    // Duration avg
    const durs  = completedSes.filter((s) => s.duracion_minutos != null).map((s) => s.duracion_minutos as number);
    const durMedia = durs.length ? Math.round(durs.reduce((a, b) => a + b, 0) / durs.length) : null;

    // ── Batch 2: series (needs session IDs) ───────────────────────────────
    let series: SerieRow[] = [];
    if (allIds.length > 0) {
      const { data } = await supabase
        .from("series_realizadas")
        .select("sesion_id, peso, repeticiones, completada, ejercicio_catalogo_id")
        .in("sesion_id", allIds)
        .eq("completada", true);
      series = (data ?? []) as SerieRow[];
    }

    // ── Metrics ───────────────────────────────────────────────────────────
    const volumenKg = series.reduce(
      (sum, s) => sum + (s.peso && s.repeticiones ? s.peso * s.repeticiones : 0),
      0
    );
    setMetrics({ completadas: completedSes.length, total: allSesiones.length, volumenKg, durMedia });

    // ── Weekly bars ───────────────────────────────────────────────────────
    const weeks       = getLast8Weeks();
    const sesionWeek  = new Map(allSesiones.map((s) => [s.id, isoWeek(s.fecha)]));
    const weekVol     = new Map<string, number>(weeks.map((w) => [w, 0]));
    for (const s of series) {
      const wk = sesionWeek.get(s.sesion_id);
      if (wk && weekVol.has(wk) && s.peso && s.repeticiones) {
        weekVol.set(wk, (weekVol.get(wk) ?? 0) + s.peso * s.repeticiones);
      }
    }
    setSemanas(weeks.map((w) => ({ key: w, label: mondayLabel(w), vol: weekVol.get(w) ?? 0 })));

    // ── PRs ───────────────────────────────────────────────────────────────
    const prsRows = (prsRes.data ?? []) as unknown as PRRow[];
    if (prsRows.length > 0) {
      setPrs(
        prsRows
          .filter((p) => p.ejercicios)
          .map((p) => ({ nombre: p.ejercicios!.nombre, grupo: p.ejercicios!.grupo_muscular, pesoMax: p.peso_max, reps: p.repeticiones }))
          .sort((a, b) => b.pesoMax - a.pesoMax)
          .slice(0, 8)
      );
    } else {
      // Real-time calc from series
      const ejMax = new Map<string, { peso: number; reps: number }>();
      for (const s of series) {
        if (!s.ejercicio_catalogo_id || !s.peso) continue;
        const cur = ejMax.get(s.ejercicio_catalogo_id);
        if (!cur || s.peso > cur.peso) ejMax.set(s.ejercicio_catalogo_id, { peso: s.peso, reps: s.repeticiones ?? 0 });
      }
      if (ejMax.size > 0) {
        const { data: ejData } = await supabase
          .from("ejercicios").select("id, nombre, grupo_muscular").in("id", [...ejMax.keys()]);
        const ejs = (ejData ?? []) as { id: string; nombre: string; grupo_muscular: string }[];
        setPrs(
          ejs
            .map((ej) => { const m = ejMax.get(ej.id)!; return { nombre: ej.nombre, grupo: ej.grupo_muscular, pesoMax: m.peso, reps: m.reps }; })
            .sort((a, b) => b.pesoMax - a.pesoMax)
            .slice(0, 8)
        );
      }
    }

    // ── Seguimiento / Progresión ──────────────────────────────────────────
    const segRow = ((segRes.data ?? [])[0]) as unknown as SeguidoRow | undefined;
    if (segRow?.ejercicios) {
      const ej = segRow.ejercicios;
      const sesionPeso = new Map<string, number>();
      for (const s of series) {
        if (s.ejercicio_catalogo_id !== ej.id || !s.peso) continue;
        if ((sesionPeso.get(s.sesion_id) ?? 0) < s.peso) sesionPeso.set(s.sesion_id, s.peso);
      }
      const historial = allSesiones
        .filter((s) => sesionPeso.has(s.id))
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
        .map((s) => ({ fecha: s.fecha, peso: sesionPeso.get(s.id)! }));
      setSeguido({ nombre: ej.nombre, grupo: ej.grupo_muscular, historial });
    } else {
      setSeguido(null);
    }
    setSeguidoReady(true);

    // ── Días del mes ──────────────────────────────────────────────────────
    const now   = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dMap = new Map<number, "done" | "partial">();
    for (const s of allSesiones) {
      const d = new Date(s.fecha + "T00:00:00");
      if (d.getFullYear() !== year || d.getMonth() !== month) continue;
      const day = d.getDate();
      if (s.completada) dMap.set(day, "done");
      else if (!dMap.has(day)) dMap.set(day, "partial");
    }
    setDiasMes(
      Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, status: dMap.get(i + 1) ?? "none" }))
    );

    // ── Volumen por grupo muscular ─────────────────────────────────────────
    const catIds = [...new Set(series.filter((s) => s.ejercicio_catalogo_id).map((s) => s.ejercicio_catalogo_id as string))];
    if (catIds.length > 0) {
      const { data: ejData } = await supabase.from("ejercicios").select("id, grupo_muscular").in("id", catIds);
      const ejMap = new Map((ejData ?? []).map((e: any) => [e.id as string, e.grupo_muscular as string]));
      const gVol = new Map<string, number>();
      for (const s of series) {
        if (!s.ejercicio_catalogo_id || !s.peso || !s.repeticiones) continue;
        const g = ejMap.get(s.ejercicio_catalogo_id);
        if (!g) continue;
        gVol.set(g, (gVol.get(g) ?? 0) + s.peso * s.repeticiones);
      }
      setGrupos([...gVol.entries()].sort((a, b) => b[1] - a[1]).map(([grupo, vol]) => ({ grupo, vol })));
    }

    setLoading(false);
  }

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="px-4 pb-10 space-y-6">
        <div>
          <Skeleton className="w-24 h-3 mb-3" />
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[72px]" />)}
          </div>
        </div>
        <div>
          <Skeleton className="w-32 h-3 mb-3" />
          <Skeleton className="h-[100px]" />
        </div>
        <div>
          <Skeleton className="w-20 h-3 mb-3" />
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}
          </div>
        </div>
        <div>
          <Skeleton className="w-36 h-3 mb-3" />
          <Skeleton className="h-[100px]" />
        </div>
      </div>
    );
  }

  const adherencia = metrics && metrics.total > 0
    ? Math.round((metrics.completadas / metrics.total) * 100)
    : 0;

  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const now = new Date();

  return (
    <div className="px-4 pb-10 space-y-7">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 pt-2">
        <div className="h-px flex-1 bg-[#1a1a1a]" />
        <p className="text-[9px] tracking-[0.25em] uppercase" style={{ color: "#2abfbf" }}>Mi Progreso</p>
        <div className="h-px flex-1 bg-[#1a1a1a]" />
      </div>

      {/* ── 1. Métricas 2×2 ── */}
      <div>
        <SectionLabel>Resumen</SectionLabel>
        {metrics && metrics.total === 0 ? (
          <Card>
            <p className="text-[#444] text-xs text-center py-2">Completa tu primer entrenamiento para ver métricas</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Card>
              <MetricCell
                value={String(metrics?.completadas ?? 0)}
                label="Entrenamientos"
              />
            </Card>
            <Card>
              <MetricCell
                value={fmtVol(metrics?.volumenKg ?? 0)}
                label="Volumen total"
              />
            </Card>
            <Card>
              <MetricCell
                value={`${adherencia}%`}
                label="Adherencia"
              />
            </Card>
            <Card>
              <MetricCell
                value={metrics?.durMedia != null ? `${metrics.durMedia} min` : "—"}
                label="Duración media"
              />
            </Card>
          </div>
        )}
      </div>

      {/* ── 2. Volumen semanal ── */}
      <div>
        <SectionLabel>Volumen semanal — últimas 8 semanas</SectionLabel>
        <Card>
          {semanas.every((s) => s.vol === 0) ? (
            <p className="text-[#444] text-xs text-center py-2">Sin datos de volumen aún</p>
          ) : (
            <BarChart bars={semanas} />
          )}
        </Card>
      </div>

      {/* ── 3. Mis PRs ── */}
      <div>
        <SectionLabel>Mejores marcas</SectionLabel>
        {prs.length === 0 ? (
          <Card>
            <p className="text-[#444] text-xs text-center py-2">Registra series con peso para ver tus PRs</p>
          </Card>
        ) : (
          <div className="space-y-1.5">
            {prs.map((pr) => (
              <Card key={pr.nombre} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-[#f0f0f0] text-xs font-light truncate">{pr.nombre}</p>
                  <p className="text-[#444] text-[10px] mt-0.5">{pr.grupo}</p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-0.5">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-md"
                    style={{ background: "rgba(42,191,191,0.12)", color: "#2abfbf", border: "0.5px solid rgba(42,191,191,0.25)" }}
                  >
                    {pr.pesoMax} kg
                  </span>
                  <span className="text-[9px] text-[#333]">×{pr.reps} reps</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── 4. Progresión de ejercicio seguido ── */}
      <div>
        <SectionLabel>
          Progresión{seguido ? ` — ${seguido.nombre}` : ""}
        </SectionLabel>
        <Card>
          {!seguidoReady ? (
            <Skeleton className="h-20 w-full" />
          ) : !seguido ? (
            <p className="text-[#444] text-xs text-center py-2">
              Añade ejercicios a tu seguimiento para ver tu progresión
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-[9px] tracking-wider uppercase px-2 py-0.5 rounded"
                  style={{ background: "rgba(42,191,191,0.08)", color: "#2abfbf", border: "0.5px solid rgba(42,191,191,0.2)" }}
                >
                  {seguido.grupo}
                </span>
              </div>
              <LineChart data={seguido.historial} />
            </>
          )}
        </Card>
      </div>

      {/* ── 5. Frecuencia del mes ── */}
      <div>
        <SectionLabel>Frecuencia — {MESES[now.getMonth()]} {now.getFullYear()}</SectionLabel>
        <Card>
          {diasMes.length === 0 ? (
            <p className="text-[#444] text-xs text-center py-2">Sin sesiones este mes</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5">
                {diasMes.map(({ day, status }) => (
                  <div
                    key={day}
                    title={`Día ${day}`}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-mono transition-colors"
                    style={{
                      background:
                        status === "done"    ? "rgba(42,191,191,0.2)"  :
                        status === "partial" ? "rgba(42,191,191,0.06)" :
                        "#161616",
                      border:
                        status === "done"    ? "1px solid rgba(42,191,191,0.5)" :
                        status === "partial" ? "1px solid rgba(42,191,191,0.15)" :
                        "1px solid #1e1e1e",
                      color:
                        status === "done"    ? "#2abfbf" :
                        status === "partial" ? "rgba(42,191,191,0.4)" :
                        "#2a2a2a",
                    }}
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4">
                {[
                  { color: "rgba(42,191,191,0.5)", label: "Completado" },
                  { color: "rgba(42,191,191,0.15)", label: "Iniciado" },
                  { color: "#1e1e1e", label: "Sin sesión" },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                    <span className="text-[9px] text-[#444]">{label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ── 6. Volumen por grupo muscular ── */}
      <div>
        <SectionLabel>Volumen por grupo muscular</SectionLabel>
        <Card>
          {grupos.length === 0 ? (
            <p className="text-[#444] text-xs text-center py-2">
              El historial de grupos se construirá con tus próximas sesiones
            </p>
          ) : (
            <HBars bars={grupos} />
          )}
        </Card>
      </div>
    </div>
  );
}
