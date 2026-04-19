import type { CSSProperties, ReactNode } from "react";
import LensSheen from "./LensSheen";

type Variant = "heavy" | "light" | "lens";

interface Props {
  variant?: Variant;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const styles: Record<Variant, CSSProperties> = {
  heavy: {
    background: "rgba(255,255,255,0.07)",
    backdropFilter: "blur(24px) saturate(180%)",
    WebkitBackdropFilter: "blur(24px) saturate(180%)",
    border: "0.5px solid rgba(255,255,255,0.13)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 4px 24px rgba(0,0,0,0.4)",
  },
  light: {
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(12px) saturate(140%)",
    WebkitBackdropFilter: "blur(12px) saturate(140%)",
    border: "0.5px solid rgba(255,255,255,0.08)",
  },
  lens: {
    background: "rgba(255,255,255,0.045)",
    backdropFilter: "blur(30px) saturate(200%)",
    WebkitBackdropFilter: "blur(30px) saturate(200%)",
    border: "0.5px solid rgba(255,255,255,0.14)",
    boxShadow: [
      "inset 0 1px 0 rgba(255,255,255,0.18)",
      "inset 0 -1px 0 rgba(0,0,0,0.25)",
      "inset 1px 0 0 rgba(42,191,191,0.05)",
      "inset -1px 0 0 rgba(123,140,255,0.05)",
      "0 10px 40px rgba(0,0,0,0.55)",
    ].join(", "),
  },
};

export default function GlassCard({ variant = "heavy", children, className, style }: Props) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        borderRadius: 28,
        overflow: "hidden",
        ...styles[variant],
        ...style,
      }}
    >
      {variant === "lens" && <LensSheen />}
      {children}
    </div>
  );
}
