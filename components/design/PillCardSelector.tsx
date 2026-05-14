"use client";

/**
 * Selector tipo "pill-card": fila scrolleable de tarjetas cuadradas
 * grandes con número/valor enorme + label pequeño debajo.
 * Inspirado en la pantalla de onboarding "¿Con qué frecuencia entrenarás?"
 * de apps de fitness modernas.
 *
 * Selección única. Estado seleccionado: borde 2px en acento + fondo
 * teñido + texto en acento. Tamaño grande para usabilidad táctil.
 */

import type { CSSProperties, ReactNode } from "react";

export type PillOption<T extends string | number> = {
  value: T;
  label: ReactNode;   // valor grande (ej: "3")
  subtitle?: string;  // texto pequeño debajo (ej: "días")
};

interface Props<T extends string | number> {
  options: ReadonlyArray<PillOption<T>>;
  value: T | null;
  onChange: (v: T) => void;
  /** Si true, las pills se reparten al 100% del ancho disponible.
   *  Si false (default), scroll horizontal (útil para 6+ opciones). */
  fill?: boolean;
  size?: "md" | "lg";
  className?: string;
  style?: CSSProperties;
}

export default function PillCardSelector<T extends string | number>({
  options,
  value,
  onChange,
  fill = false,
  size = "md",
  className,
  style,
}: Props<T>) {
  const cardSize = size === "lg" ? 96 : 80;
  const labelFs = size === "lg" ? 32 : 26;

  return (
    <div
      className={className}
      style={{
        display: "flex",
        gap: 10,
        overflowX: fill ? "visible" : "auto",
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
        paddingBottom: fill ? 0 : 4,
        ...style,
      }}
    >
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className="no-min-h"
            style={{
              flex: fill ? "1 1 0" : "0 0 auto",
              minWidth: fill ? 0 : cardSize,
              height: cardSize,
              borderRadius: 18,
              border: selected
                ? "2px solid var(--accent)"
                : "1px solid rgba(255,255,255,0.10)",
              background: selected ? "rgba(42,191,191,0.12)" : "rgba(255,255,255,0.04)",
              color: selected ? "var(--accent)" : "#ffffff",
              cursor: "pointer",
              transition: "all 0.15s ease",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              padding: 8,
              fontFamily: "var(--font-ui)",
            }}
          >
            <span
              style={{
                fontSize: labelFs,
                fontWeight: 800,
                lineHeight: 1,
                fontFeatureSettings: "'tnum'",
              }}
            >
              {opt.label}
            </span>
            {opt.subtitle && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: selected ? "var(--accent)" : "rgba(255,255,255,0.55)",
                  letterSpacing: "0.02em",
                }}
              >
                {opt.subtitle}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
