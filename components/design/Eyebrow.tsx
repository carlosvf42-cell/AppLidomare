import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  color?: string;
  className?: string;
}

export default function Eyebrow({ children, color, className }: Props) {
  return (
    <div
      className={className}
      style={{
        fontSize: 9,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        fontWeight: 500,
        color: color || "var(--accent)",
      }}
    >
      {children}
    </div>
  );
}
