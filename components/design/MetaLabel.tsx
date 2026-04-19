import type { CSSProperties, ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export default function MetaLabel({ children, className, style }: Props) {
  return (
    <div
      className={className}
      style={{
        fontSize: 10,
        letterSpacing: "0.25em",
        textTransform: "uppercase",
        fontWeight: 500,
        color: "rgba(255,255,255,0.35)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
