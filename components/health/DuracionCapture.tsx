"use client";

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "0.5px solid rgba(255,255,255,0.08)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
};

interface DuracionCaptureProps {
  duracion: string;
  onDuracionChange: (v: string) => void;
}

export default function DuracionCapture({ duracion, onDuracionChange }: DuracionCaptureProps) {
  return (
    <div className="rounded-2xl px-4 py-4" style={GLASS}>
      <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(42,191,191,0.6)", fontFamily: "var(--font-ui)", textAlign: "center" }}>
        Duración
      </p>
      <div className="flex flex-col items-center">
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={240}
          value={duracion}
          onChange={(e) => onDuracionChange(e.target.value)}
          placeholder="45"
          className="text-center outline-none"
          style={{
            background: "transparent",
            border: "none",
            fontFamily: "var(--font-serif)",
            fontSize: "2.25rem",
            fontWeight: 600,
            lineHeight: 1.1,
            color: "rgba(255,255,255,0.95)",
            width: "100%",
            padding: 0,
            marginTop: 2,
          }}
        />
        <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-ui)", marginTop: 4 }}>
          min
        </p>
      </div>
    </div>
  );
}
