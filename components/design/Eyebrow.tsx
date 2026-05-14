import type { CSSProperties, ReactNode } from "react";

interface Props {
  children: ReactNode;
  color?: string;
  className?: string;
  style?: CSSProperties;
}

export default function Eyebrow({ children, color, className, style }: Props) {
  return (
    <div
      className={className}
      style={{
        fontSize: 12,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        fontWeight: 700,
        color: color || "var(--accent)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
