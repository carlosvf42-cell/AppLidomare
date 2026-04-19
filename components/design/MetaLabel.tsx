import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export default function MetaLabel({ children, className }: Props) {
  return (
    <div
      className={className}
      style={{
        fontSize: 10,
        letterSpacing: "0.25em",
        textTransform: "uppercase",
        fontWeight: 500,
        color: "rgba(255,255,255,0.35)",
      }}
    >
      {children}
    </div>
  );
}
