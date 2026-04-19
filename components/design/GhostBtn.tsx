"use client";

import type { ReactNode, ButtonHTMLAttributes } from "react";

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style"> {
  children: ReactNode;
  className?: string;
}

export default function GhostBtn({ children, className, ...rest }: Props) {
  return (
    <button
      className={className}
      style={{
        background: "rgba(255,255,255,0.04)",
        color: "rgba(255,255,255,0.85)",
        fontSize: 10,
        letterSpacing: "0.25em",
        textTransform: "uppercase",
        padding: 16,
        border: "0.5px solid rgba(255,255,255,0.18)",
        borderRadius: 14,
        width: "100%",
        cursor: "pointer",
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
