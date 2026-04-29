"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "0.5px solid rgba(255,255,255,0.08)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)",
};

const FONT_TEXT = "Barlow Condensed, sans-serif";
const FONT_TITLE = "Cormorant Garamond, serif";

type WellnessRow = {
  fecha: string;
  sueno: number;
  fatiga: number;
  estres: number;
  animo: number;
  dolor: number;
  puntuacion_total: number;
};

const METRICS = [
  { key: "puntuacion_total" as const, label: "Total", color: "#2abfbf", max: 25, normalize: (v: number) => v / 2.5, headline: true },
  { key: "sueno" as const, label: "Sueño", color: "#7b8cff", max: 5, normalize: (v: number) => v * 2, headline: false },
  { key: "fatiga" as const, label: "Fatiga", color: "#ffb040", max: 5, normalize: (v: number) => v * 2, headline: false },
  { key: "estres" as const, label: "Estrés", color: "#ff8080", max: 5, normalize: (v: number) => v * 2, headline: false },
  { key: "animo" as const, label: "Ánimo", color: "#a8e6a8", max: 5, normalize: (v: number) => v * 2, headline: false },
  { key: "dolor" as const, label: "Dolor", color: "#c89bff", max: 5, normalize: (v: number) => v * 2, headline: false },
];

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

function formatShortDate(s: string): string {
  const d = new Date(s + "T12:00:00");
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export default function WellnessChart({ userId: userIdProp }: { userId?: string } = {}) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<WellnessRow[]>([]);

  useEffect(() => {
    (async () => {
      const supabase = getSupabase();
      let uid = userIdProp;
      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        uid = user?.id;
      }
      if (!uid) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("wellness_entries")
        .select("fecha, sueno, fatiga, estres, animo, dolor, puntuacion_total")
        .eq("user_id", uid)
        .eq("omitido", false)
        .order("fecha", { ascending: false })
        .limit(14);
      const arr = (data ?? []) as WellnessRow[];
      // Reverse to show chronological (oldest left, newest right)
      setRows([...arr].reverse());
      setLoading(false);
    })();
  }, [userIdProp]);

  if (loading) {
    return (
      <div className="rounded-2xl px-4 py-8 flex items-center justify-center" style={GLASS}>
        <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl px-5 py-10 text-center space-y-3" style={GLASS}>
        <div className="flex justify-center">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              background: "rgba(42,191,191,0.08)",
              border: "0.5px solid rgba(42,191,191,0.25)",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 12h3l3-7 4 14 3-7h5"
                stroke="rgba(42,191,191,0.85)"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <p
          style={{
            fontFamily: FONT_TITLE,
            fontSize: "1.1rem",
            fontWeight: 300,
            color: "rgba(255,255,255,0.9)",
          }}
        >
          Aún no hay registros de wellness
        </p>
        <p
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.45)",
            fontFamily: FONT_TEXT,
            lineHeight: 1.6,
            letterSpacing: "0.02em",
            maxWidth: 280,
            margin: "0 auto",
          }}
        >
          Registra tu wellness antes de entrenar para ver la evolución
          de sueño, fatiga, estrés, ánimo y dolor.
        </p>
      </div>
    );
  }

  const W = 320;
  const H = 180;
  const PAD_L = 24;
  const PAD_R = 12;
  const PAD_T = 12;
  const PAD_B = 24;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  function xFor(i: number): number {
    if (rows.length === 1) return PAD_L + innerW / 2;
    return PAD_L + (i / (rows.length - 1)) * innerW;
  }
  function yFor(value0to10: number): number {
    // 0 → bottom, 10 → top
    return PAD_T + innerH - (value0to10 / 10) * innerH;
  }

  const last = rows[rows.length - 1];

  return (
    <div className="rounded-2xl px-4 py-4 space-y-4" style={GLASS}>
      <div className="flex items-baseline justify-between">
        <p
          style={{
            fontSize: 10,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(42,191,191,0.7)",
            fontFamily: FONT_TEXT,
          }}
        >
          Wellness · últimos {rows.length}
        </p>
        <p
          style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: FONT_TEXT, letterSpacing: "0.02em" }}
        >
          {formatShortDate(rows[0].fecha)} – {formatShortDate(last.fecha)}
        </p>
      </div>

      {/* Chart */}
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: 180, display: "block" }}>
          {/* Y grid lines at 2,4,6,8,10 */}
          {[2, 4, 6, 8, 10].map((v) => (
            <g key={v}>
              <line
                x1={PAD_L}
                x2={W - PAD_R}
                y1={yFor(v)}
                y2={yFor(v)}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="0.5"
              />
              <text
                x={PAD_L - 6}
                y={yFor(v) + 3}
                textAnchor="end"
                style={{ fontSize: 8, fill: "rgba(255,255,255,0.25)", fontFamily: FONT_TEXT, letterSpacing: "0.04em" }}
              >
                {v}
              </text>
            </g>
          ))}

          {/* Lines */}
          {METRICS.map((m) => {
            const points = rows.map((r, i) => ({ x: xFor(i), y: yFor(m.normalize(r[m.key])) }));
            const d = buildSmoothPath(points);
            return (
              <g key={m.key}>
                <path
                  d={d}
                  fill="none"
                  stroke={m.color}
                  strokeWidth={m.headline ? 2 : 1.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={m.headline ? 1 : 0.7}
                />
                {m.headline && points.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={m.color} />
                ))}
              </g>
            );
          })}

          {/* X labels — first, middle, last */}
          {rows.length >= 1 && (
            <text
              x={xFor(0)}
              y={H - 6}
              textAnchor="start"
              style={{ fontSize: 8, fill: "rgba(255,255,255,0.3)", fontFamily: FONT_TEXT, letterSpacing: "0.04em" }}
            >
              {formatShortDate(rows[0].fecha)}
            </text>
          )}
          {rows.length >= 3 && (
            <text
              x={xFor(Math.floor((rows.length - 1) / 2))}
              y={H - 6}
              textAnchor="middle"
              style={{ fontSize: 8, fill: "rgba(255,255,255,0.3)", fontFamily: FONT_TEXT, letterSpacing: "0.04em" }}
            >
              {formatShortDate(rows[Math.floor((rows.length - 1) / 2)].fecha)}
            </text>
          )}
          {rows.length >= 2 && (
            <text
              x={xFor(rows.length - 1)}
              y={H - 6}
              textAnchor="end"
              style={{ fontSize: 8, fill: "rgba(255,255,255,0.3)", fontFamily: FONT_TEXT, letterSpacing: "0.04em" }}
            >
              {formatShortDate(last.fecha)}
            </text>
          )}
        </svg>
      </div>

      {/* Legend / latest values */}
      <div className="grid grid-cols-3 gap-2">
        {METRICS.map((m) => {
          const v = last[m.key];
          return (
            <div
              key={m.key}
              className="rounded-xl px-2.5 py-2"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: `0.5px solid ${m.color}33`,
              }}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: m.color,
                    boxShadow: m.headline ? `0 0 6px ${m.color}80` : "none",
                  }}
                />
                <span
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.5)",
                    fontFamily: FONT_TEXT,
                  }}
                >
                  {m.label}
                </span>
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.95)",
                  fontFamily: FONT_TEXT,
                  letterSpacing: "0.02em",
                }}
              >
                <span style={{ color: m.color }}>{v}</span>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginLeft: 2 }}>
                  /{m.max}
                </span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
