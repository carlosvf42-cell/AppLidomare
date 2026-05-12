"use client";

/**
 * CTA primario gigante full-width. Reemplaza a PrimaryBtn en pantallas
 * donde el botón es el elemento principal (onboarding, home, entrenar).
 *
 * - 64-72px alto · radius 18 · acento sólido · texto 17-18px weight 800
 * - Variantes: primary (acento turquesa) | ghost (borde sutil)
 * - Icono opcional a la derecha (flecha por defecto).
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style"> {
  children: ReactNode;
  variant?: "primary" | "ghost";
  trailingIcon?: ReactNode | "arrow" | "none";
  leadingIcon?: ReactNode;
  className?: string;
}

function ArrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function BigCTA({
  children,
  variant = "primary",
  trailingIcon = "arrow",
  leadingIcon,
  className,
  ...rest
}: Props) {
  const isPrimary = variant === "primary";
  const arrow = trailingIcon === "arrow" ? <ArrowIcon /> : trailingIcon === "none" ? null : trailingIcon;

  return (
    <button
      className={className}
      style={{
        width: "100%",
        minHeight: 64,
        padding: "20px 24px",
        border: isPrimary ? "none" : "1px solid rgba(255,255,255,0.18)",
        borderRadius: 18,
        background: isPrimary
          ? "linear-gradient(180deg, #2abfbf 0%, #1f9e9e 100%)"
          : "rgba(255,255,255,0.04)",
        color: isPrimary ? "#001a1a" : "#ffffff",
        fontFamily: "var(--font-ui)",
        fontSize: 17,
        fontWeight: 800,
        letterSpacing: "0.01em",
        boxShadow: isPrimary
          ? "0 8px 32px rgba(42,191,191,0.32), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.15)"
          : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        cursor: "pointer",
        transition: "transform 0.1s ease",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      {...rest}
    >
      {leadingIcon}
      <span>{children}</span>
      {arrow}
    </button>
  );
}
