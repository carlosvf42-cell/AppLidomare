"use client";

import type { ReactNode, ButtonHTMLAttributes } from "react";

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style"> {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export default function PrimaryBtn({ children, icon, className, ...rest }: Props) {
  return (
    <button
      className={className}
      style={{
        background: "linear-gradient(180deg, #2abfbf 0%, #1f9e9e 100%)",
        color: "#001a1a",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        padding: 16,
        border: "none",
        borderRadius: 16,
        width: "100%",
        boxShadow: "0 8px 32px rgba(42,191,191,0.32), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        cursor: "pointer",
        transition: "transform 0.1s ease",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
