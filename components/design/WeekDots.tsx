"use client";

/**
 * Visualización de la semana como 7 círculos grandes (L M X J V S D)
 * con label debajo siempre visible. Soporta 3 estados por día:
 *   - done     → círculo lleno en acento
 *   - active   → círculo con borde 2px en acento (típicamente hoy)
 *   - empty    → círculo vacío con borde sutil
 *
 * Tamaño táctil grande (40px por círculo) e iconografía clara.
 */

import type { CSSProperties } from "react";

export type DotState = "done" | "active" | "empty";

export interface WeekDot {
  /** Etiqueta visible bajo el círculo (1 letra). */
  label: string;
  state: DotState;
  /** Número opcional dentro del círculo (día del mes). */
  num?: number;
}

interface Props {
  days: ReadonlyArray<WeekDot>;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export default function WeekDots({ days, size = 40, className, style }: Props) {
  return (
    <div className={className} style={{ display: "flex", justifyContent: "space-between", ...style }}>
      {days.map((d, i) => {
        const isDone = d.state === "done";
        const isActive = d.state === "active";
        return (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: size,
                height: size,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: isDone
                  ? "var(--accent)"
                  : isActive
                  ? "rgba(42,191,191,0.10)"
                  : "rgba(255,255,255,0.04)",
                border: isDone
                  ? "none"
                  : isActive
                  ? "2px solid var(--accent)"
                  : "1px solid rgba(255,255,255,0.12)",
                color: isDone
                  ? "#001a1a"
                  : isActive
                  ? "var(--accent)"
                  : "rgba(255,255,255,0.55)",
                fontSize: d.num != null ? 14 : 0,
                fontWeight: 700,
                fontFeatureSettings: "'tnum'",
                transition: "all 0.2s ease",
              }}
            >
              {d.num != null ? d.num : null}
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.05em",
                color: isDone
                  ? "var(--accent)"
                  : isActive
                  ? "var(--accent)"
                  : "rgba(255,255,255,0.55)",
              }}
            >
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
