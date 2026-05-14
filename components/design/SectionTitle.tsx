"use client";

/**
 * Bloque "eyebrow + título grande + subtítulo" reutilizable. Es la
 * cabecera estándar de cada pantalla/sección tras el rediseño.
 *
 *   <SectionTitle
 *     eyebrow="Paso 3 de 3"
 *     title="¿Con qué frecuencia entrenarás?"
 *     subtitle="Define tu objetivo semanal..."
 *   />
 *
 * Mantiene jerarquía clara: eyebrow turquesa pequeño → título 28-32
 * weight 800 blanco puro → subtítulo 15-16 weight 500 gris medio.
 */

import type { CSSProperties, ReactNode } from "react";

interface Props {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Variante "hero" usa 32-34px (pantalla principal), "section"
   *  usa 22-24 (cabecera dentro de scroll). Default "hero". */
  variant?: "hero" | "section";
  className?: string;
  style?: CSSProperties;
}

export default function SectionTitle({ eyebrow, title, subtitle, variant = "hero", className, style }: Props) {
  const titleFs = variant === "hero" ? 30 : 22;
  const titleLh = variant === "hero" ? 1.1 : 1.15;
  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", gap: 8, ...style }}>
      {eyebrow != null && (
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--accent)",
            fontFamily: "var(--font-ui)",
          }}
        >
          {eyebrow}
        </span>
      )}
      <h1
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: titleFs,
          fontWeight: 800,
          letterSpacing: "-0.005em",
          lineHeight: titleLh,
          color: "#ffffff",
          margin: 0,
        }}
      >
        {title}
      </h1>
      {subtitle != null && (
        <p
          style={{
            fontSize: 15,
            fontWeight: 500,
            lineHeight: 1.5,
            color: "rgba(255,255,255,0.65)",
            fontFamily: "var(--font-ui)",
            margin: 0,
            marginTop: 4,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
