"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import GlassCard from "@/components/design/GlassCard";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAY_INITIALS = ["D", "L", "M", "X", "J", "V", "S"];

function mondayISO(d: Date): string {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x.toISOString().split("T")[0];
}

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;
  const t = 0.18;
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const cp1x = p1.x + (p2.x - p0.x) * t;
    const cp1y = p1.y + (p2.y - p0.y) * t;
    const cp2x = p2.x - (p3.x - p1.x) * t;
    const cp2y = p2.y - (p3.y - p1.y) * t;
    d += ` C${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

// Build one cubic bezier segment between two adjacent points (same smoothing math as buildSmoothPath)
function buildSegmentPath(points: { x: number; y: number }[], i: number): string {
  const p0 = points[Math.max(i - 1, 0)];
  const p1 = points[i];
  const p2 = points[i + 1];
  const p3 = points[Math.min(i + 2, points.length - 1)];
  const t = 0.18;
  const cp1x = p1.x + (p2.x - p0.x) * t;
  const cp1y = p1.y + (p2.y - p0.y) * t;
  const cp2x = p2.x - (p3.x - p1.x) * t;
  const cp2y = p2.y - (p3.y - p1.y) * t;
  return `M${p1.x.toFixed(2)},${p1.y.toFixed(2)} C${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
}

function zoneColor(v: number): string {
  if (v < 0.8) return "rgba(148,163,184,0.6)";
  if (v <= 1.3) return "#2abfbf";
  if (v <= 1.5) return "#ffb040";
  return "#ff6040";
}

type WeekPoint = { mondayISO: string; carga: number };
type DayPoint = { fecha: string; carga: number; label: string; isToday: boolean };

type Zone = { label: string; color: string; bg: string; border: string };

function acwrZone(acwr: number | null): Zone {
  if (acwr === null) {
    return { label: "Acumulando datos", color: "rgba(255,255,255,0.5)", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.12)" };
  }
  if (acwr < 0.8) {
    return { label: "Subcarga", color: "rgba(255,255,255,0.55)", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.15)" };
  }
  if (acwr <= 1.3) {
    return { label: "Zona segura", color: "#2abfbf", bg: "rgba(42,191,191,0.1)", border: "rgba(42,191,191,0.35)" };
  }
  if (acwr <= 1.5) {
    return { label: "Precaución", color: "#ffb040", bg: "rgba(255,176,64,0.1)", border: "rgba(255,176,64,0.35)" };
  }
  return { label: "Riesgo alto", color: "#ff6b6b", bg: "rgba(255,107,107,0.1)", border: "rgba(255,107,107,0.35)" };
}

const EYEBROW: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.25em",
  textTransform: "uppercase",
  color: "rgba(42,191,191,0.7)",
  fontFamily: "Barlow Condensed, sans-serif",
};

const BADGE_BASE: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  padding: "4px 10px",
  borderRadius: 999,
  fontFamily: "Barlow Condensed, sans-serif",
  fontWeight: 500,
};

export default function WorkloadChart({ userId: userIdProp }: { userId?: string } = {}) {
  const [loading, setLoading] = useState(true);
  const [weeks, setWeeks] = useState<WeekPoint[]>([]);
  const [dayPoints, setDayPoints] = useState<DayPoint[]>([]);
  const [acwr, setAcwr] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = getSupabase();
      let uid = userIdProp;
      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        uid = user?.id;
      }
      if (!uid) { setLoading(false); return; }

      const today = new Date();
      const from = new Date(today);
      from.setDate(today.getDate() - 42);
      const fromISO = from.toISOString().split("T")[0];

      const [sesionesRes, acwrRes] = await Promise.all([
        supabase
          .from("sesiones")
          .select("fecha, carga_dia")
          .eq("user_id", uid)
          .eq("completada", true)
          .not("carga_dia", "is", null)
          .gte("fecha", fromISO),
        supabase.rpc("get_acwr", { p_user_id: uid }),
      ]);

      const sesiones = (sesionesRes.data ?? []) as { fecha: string; carga_dia: number }[];

      // Build last 6 weeks (oldest → newest) keyed by Monday ISO
      const bucketMondays: string[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i * 7);
        bucketMondays.push(mondayISO(d));
      }
      const weekMap = new Map<string, number>(bucketMondays.map((m) => [m, 0]));
      for (const s of sesiones) {
        const m = mondayISO(new Date(s.fecha + "T12:00:00"));
        if (weekMap.has(m)) {
          weekMap.set(m, (weekMap.get(m) ?? 0) + (Number(s.carga_dia) || 0));
        }
      }
      const buckets: WeekPoint[] = bucketMondays.map((m) => ({ mondayISO: m, carga: weekMap.get(m) ?? 0 }));

      // Day-mode: current-week sesiones aggregated per fecha
      const thisMonday = mondayISO(today);
      const todayISO = today.toISOString().split("T")[0];
      const perDay = new Map<string, number>();
      for (const s of sesiones) {
        if (s.fecha >= thisMonday && s.fecha <= todayISO) {
          perDay.set(s.fecha, (perDay.get(s.fecha) ?? 0) + (Number(s.carga_dia) || 0));
        }
      }
      const days: DayPoint[] = [...perDay.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([fecha, carga]) => {
          const d = new Date(fecha + "T12:00:00");
          return {
            fecha,
            carga,
            label: `${DAY_INITIALS[d.getDay()]} ${d.getDate()}`,
            isToday: fecha === todayISO,
          };
        });

      let acwrValue: number | null = null;
      const raw = acwrRes.data as unknown;
      if (typeof raw === "number") acwrValue = raw;
      else if (raw && typeof raw === "object" && "acwr" in (raw as Record<string, unknown>)) {
        const v = (raw as Record<string, unknown>).acwr;
        if (typeof v === "number") acwrValue = v;
      }

      setWeeks(buckets);
      setDayPoints(days);
      setAcwr(acwrValue);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <GlassCard variant="light" style={{ padding: "16px 20px" }}>
        <div style={{ height: 180 }} />
      </GlassCard>
    );
  }

  const nonZeroWeeks = weeks.filter((w) => w.carga > 0).length;
  const mode: "weeks" | "days" | "empty" =
    nonZeroWeeks >= 2 ? "weeks" :
    dayPoints.length >= 1 ? "days" :
    "empty";

  if (mode === "empty") {
    return (
      <GlassCard variant="light" style={{ padding: "20px 20px" }}>
        <p style={{ ...EYEBROW, marginBottom: 10 }}>Carga de entrenamiento</p>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", fontFamily: "Barlow Condensed, sans-serif", letterSpacing: "0.02em", lineHeight: 1.5 }}>
          Registra tus entrenos con RPE para ver tu carga
        </p>
      </GlassCard>
    );
  }

  if (mode === "days") {
    const N = dayPoints.length;
    const xFor = (i: number) => N === 1 ? 190 : 30 + (320 * i) / (N - 1);
    const maxCarga = Math.max(...dayPoints.map((d) => d.carga), 1);
    const yFor = (v: number) => 95 - (v / maxCarga) * 80;
    const svgPoints = dayPoints.map((d, i) => ({ x: xFor(i), y: yFor(d.carga), isToday: d.isToday }));
    const smoothPath = buildSmoothPath(svgPoints);
    const areaPath = svgPoints.length > 1
      ? `${smoothPath} L${svgPoints[svgPoints.length - 1].x.toFixed(2)},95 L${svgPoints[0].x.toFixed(2)},95 Z`
      : "";
    const lastIdx = svgPoints.length - 1;
    const last = svgPoints[lastIdx];
    const zone = acwrZone(null);

    // Per-day relative load (carga_dia / mean) mapped to zone colors
    const mean = dayPoints.reduce((s, d) => s + d.carga, 0) / Math.max(dayPoints.length, 1);
    const relative = dayPoints.map((d) => (mean > 0 ? d.carga / mean : 1));
    const pointColors = relative.map(zoneColor);

    return (
      <GlassCard variant="light" style={{ padding: "16px 18px" }}>
        <p style={{ ...EYEBROW, marginBottom: 4 }}>Carga de entrenamiento</p>

        <div className="flex items-center justify-between mb-3">
          <h3 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 22, fontWeight: 300, color: "rgba(255,255,255,0.95)", lineHeight: 1.1 }}>
            Esta semana
          </h3>
          <span style={{ ...BADGE_BASE, background: zone.bg, border: `0.5px solid ${zone.border}`, color: zone.color }}>
            {zone.label}
          </span>
        </div>

        <svg viewBox="0 0 380 110" width="100%" style={{ height: 110, overflow: "visible" }}>
          <defs>
            <linearGradient id="wlAreaDays" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2abfbf" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#2abfbf" stopOpacity="0" />
            </linearGradient>
          </defs>

          {areaPath && <path d={areaPath} fill="url(#wlAreaDays)" />}

          {/* Per-segment colored line */}
          {svgPoints.length > 1 && svgPoints.slice(0, -1).map((_, i) => (
            <path
              key={`seg-${i}`}
              d={buildSegmentPath(svgPoints, i)}
              fill="none"
              stroke={pointColors[i]}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />
          ))}

          {svgPoints.slice(0, -1).map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#080808" stroke={pointColors[i]} strokeOpacity="0.7" strokeWidth="1" />
          ))}

          {last && (
            <>
              <line x1={last.x} y1={last.y + 5} x2={last.x} y2={100} stroke={pointColors[lastIdx]} strokeOpacity="0.4" strokeWidth="0.8" strokeDasharray="2 3" />
              <circle cx={last.x} cy={last.y} r="9" fill="none" stroke={pointColors[lastIdx]} strokeOpacity="0.25" strokeWidth="1" />
              <circle cx={last.x} cy={last.y} r="5" fill={pointColors[lastIdx]} stroke="#080808" strokeWidth="2" />
            </>
          )}
        </svg>

        <div className="flex mt-1" style={{ marginLeft: 12, marginRight: 12 }}>
          {dayPoints.map((d, i) => {
            const widthPct = `${100 / dayPoints.length}%`;
            return (
              <div key={i} style={{ width: widthPct, textAlign: "center" }}>
                <div style={{
                  fontSize: 10,
                  fontFamily: "Barlow Condensed, sans-serif",
                  letterSpacing: "0.05em",
                  color: d.isToday ? "#2abfbf" : "rgba(255,255,255,0.25)",
                  fontWeight: d.isToday ? 500 : 400,
                }}>
                  {d.label}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    );
  }

  // mode === "weeks"
  const N = weeks.length;
  const xFor = (i: number) => N === 1 ? 190 : 30 + (320 * i) / (N - 1);
  const maxCarga = Math.max(...weeks.map((w) => w.carga), 1);
  const yFor = (v: number) => 95 - (v / maxCarga) * 80;
  const points = weeks.map((w, i) => ({ x: xFor(i), y: yFor(w.carga) }));
  const smoothPath = buildSmoothPath(points);
  const areaPath = points.length > 1
    ? `${smoothPath} L${points[points.length - 1].x.toFixed(2)},95 L${points[0].x.toFixed(2)},95 Z`
    : "";

  const zone = acwrZone(acwr);
  const today = new Date();
  const todayLabel = `${DAY_NAMES[today.getDay()]} ${today.getDate()}`;

  const weekLabels = weeks.map((_, i) => {
    const offset = N - 1 - i;
    return offset === 0 ? "Esta sem" : `S-${offset}`;
  });

  const last = points[points.length - 1];
  const lastIdx = points.length - 1;

  // Per-week ratio: each week's carga vs 4-week mean prior to it (falls back to overall mean)
  const weekRatios = weeks.map((_, i) => {
    const windowStart = Math.max(0, i - 4);
    const window = weeks.slice(windowStart, i);
    const windowMean = window.length > 0
      ? window.reduce((s, w) => s + w.carga, 0) / window.length
      : 0;
    if (windowMean > 0) return weeks[i].carga / windowMean;
    const overallMean = weeks.reduce((s, w) => s + w.carga, 0) / Math.max(weeks.length, 1);
    return overallMean > 0 ? weeks[i].carga / overallMean : 1;
  });
  const weekColors = weekRatios.map(zoneColor);

  return (
    <GlassCard variant="light" style={{ padding: "16px 18px" }}>
      <p style={{ ...EYEBROW, marginBottom: 10 }}>Carga de entrenamiento</p>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 28, fontWeight: 300, color: "#2abfbf", lineHeight: 1, fontFeatureSettings: "'tnum'" }}>
            {acwr !== null ? acwr.toFixed(2) : "—"}
          </span>
          <span style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", fontFamily: "Barlow Condensed, sans-serif" }}>ACWR</span>
          <button
            type="button"
            onClick={() => setShowInfo((v) => !v)}
            aria-label="Información sobre ACWR"
            style={{
              fontSize: 12,
              color: showInfo ? "rgba(42,191,191,0.8)" : "rgba(255,255,255,0.3)",
              fontFamily: "Barlow Condensed, sans-serif",
              background: "transparent",
              border: "none",
              padding: 0,
              lineHeight: 1,
              cursor: "pointer",
            }}
          >
            ⓘ
          </button>
        </div>
        <span style={{ ...BADGE_BASE, background: zone.bg, border: `0.5px solid ${zone.border}`, color: zone.color }}>
          {zone.label}
        </span>
      </div>

      {showInfo && (
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "0.5px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <p style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, letterSpacing: "0.02em" }}>
            El ACWR (ratio de carga aguda/crónica) compara tu entrenamiento de esta semana con tu media de las 4 semanas anteriores. Entre 0.8 y 1.3 es la zona óptima: suficiente estímulo sin riesgo de lesión.
          </p>
        </div>
      )}

      <svg viewBox="0 0 380 110" width="100%" style={{ height: 110, overflow: "visible" }}>
        <defs>
          <linearGradient id="wlArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2abfbf" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#2abfbf" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect x="30" y="28" width="320" height={64 - 28} fill="rgba(42,191,191,0.05)" />
        <line x1="30" y1="28" x2="350" y2="28" stroke="rgba(42,191,191,0.15)" strokeWidth="0.8" strokeDasharray="3 3" />
        <line x1="30" y1="64" x2="350" y2="64" stroke="rgba(42,191,191,0.15)" strokeWidth="0.8" strokeDasharray="3 3" />
        <text x="356" y="30.5" fontSize="8" fill="rgba(42,191,191,0.5)" fontFamily="Barlow Condensed, sans-serif" dominantBaseline="middle">1.3</text>
        <text x="356" y="66.5" fontSize="8" fill="rgba(42,191,191,0.5)" fontFamily="Barlow Condensed, sans-serif" dominantBaseline="middle">0.8</text>

        {areaPath && <path d={areaPath} fill="url(#wlArea)" />}

        {/* Per-segment colored line */}
        {points.length > 1 && points.slice(0, -1).map((_, i) => (
          <path
            key={`seg-${i}`}
            d={buildSegmentPath(points, i)}
            fill="none"
            stroke={weekColors[i]}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.85"
          />
        ))}

        {points.slice(0, -1).map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#080808" stroke={weekColors[i]} strokeOpacity="0.7" strokeWidth="1" />
        ))}

        {last && (
          <>
            <line x1={last.x} y1={last.y + 5} x2={last.x} y2={100} stroke={weekColors[lastIdx]} strokeOpacity="0.4" strokeWidth="0.8" strokeDasharray="2 3" />
            <circle cx={last.x} cy={last.y} r="9" fill="none" stroke={weekColors[lastIdx]} strokeOpacity="0.25" strokeWidth="1" />
            <circle cx={last.x} cy={last.y} r="5" fill={weekColors[lastIdx]} stroke="#080808" strokeWidth="2" />
          </>
        )}
      </svg>

      <div className="flex mt-1" style={{ marginLeft: 12, marginRight: 12 }}>
        {weekLabels.map((label, i) => {
          const isLast = i === weekLabels.length - 1;
          const widthPct = `${100 / weekLabels.length}%`;
          return (
            <div key={i} style={{ width: widthPct, textAlign: "center" }}>
              <div style={{ fontSize: 10, fontFamily: "Barlow Condensed, sans-serif", letterSpacing: "0.05em", color: isLast ? "#2abfbf" : "rgba(255,255,255,0.25)" }}>
                {label}
              </div>
              {isLast && (
                <div style={{ fontSize: 9, fontFamily: "Barlow Condensed, sans-serif", color: "rgba(42,191,191,0.55)", marginTop: 1 }}>
                  {todayLabel}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
