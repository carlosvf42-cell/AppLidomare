"use client";

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "0.5px solid rgba(255,255,255,0.08)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
};

const RPE_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Ligero", color: "#2abfbf" },
  2: { label: "Ligero", color: "#2abfbf" },
  3: { label: "Ligero", color: "#2abfbf" },
  4: { label: "Moderado", color: "#a8e6a8" },
  5: { label: "Moderado", color: "#a8e6a8" },
  6: { label: "Moderado", color: "#a8e6a8" },
  7: { label: "Intenso", color: "#ffb040" },
  8: { label: "Intenso", color: "#ffb040" },
  9: { label: "Máximo", color: "#ff4040" },
  10: { label: "Máximo", color: "#ff4040" },
};

interface RPECaptureProps {
  rpe: number | null;
  onRpeChange: (v: number) => void;
}

export default function RPECapture({ rpe, onRpeChange }: RPECaptureProps) {
  const info = rpe ? RPE_LABELS[rpe] : null;
  return (
    <div className="rounded-2xl px-4 py-4 space-y-4" style={GLASS}>
      <div>
        <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "rgba(42,191,191,0.6)", fontFamily: "var(--font-condensed)" }}>Carga del entreno</p>
        {info && <p className="text-xs mt-0.5" style={{ color: info.color, fontFamily: "var(--font-condensed)" }}>{info.label}</p>}
      </div>
      <div>
        <div className="flex items-end justify-between mb-2">
          <span className="text-[9px] tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-condensed)" }}>Esfuerzo percibido (RPE)</span>
          {rpe && <span className="text-sm font-semibold" style={{ color: info?.color, fontFamily: "var(--font-condensed)" }}>{rpe}/10</span>}
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => {
            const selected = rpe === v;
            const active = rpe !== null && v <= rpe;
            const barColor = RPE_LABELS[v].color;
            return (
              <button key={v} type="button" onClick={() => onRpeChange(v)} className="flex-1 flex flex-col items-center gap-1 transition-all" style={{ padding: 0, background: "none", border: "none", cursor: "pointer" }}>
                <div className="w-full rounded-sm transition-all duration-200" style={{ height: selected ? 28 : active ? 22 : 14, background: active ? barColor : "rgba(255,255,255,0.08)", boxShadow: selected ? `0 0 8px ${barColor}80` : "none", opacity: active ? 1 : 0.5 }} />
                <span className="text-[9px]" style={{ color: selected ? barColor : "rgba(255,255,255,0.2)", fontFamily: "var(--font-condensed)", fontWeight: selected ? 700 : 400 }}>{v}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
