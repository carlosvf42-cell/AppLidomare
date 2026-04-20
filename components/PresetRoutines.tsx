"use client";

import { useState } from "react";
import {
  PRESET_ROUTINES,
  tieneFases,
  type Dia,
  type Ejercicio,
  type TipoMaterial,
  type NivelData,
  type FaseData,
} from "@/data/presetRoutines";

/* ── Pill colours per material type ─────────────────────────── */
const PILL: Record<TipoMaterial, { bg: string; color: string; label: string }> = {
  maquina: { bg: "#E1F5EE", color: "#0F6E56", label: "Maquina" },
  polea:   { bg: "#EEEDFE", color: "#534AB7", label: "Polea" },
  libre:   { bg: "#FAEEDA", color: "#854F0B", label: "Peso libre" },
};

/* ── Tab colour per level ───────────────────────────────────── */
const LEVEL_COLOR: Record<string, string> = {
  principiante: "#34d399",
  intermedio:   "#fbbf24",
  avanzado:     "#f87171",
};

const LEVELS = Object.keys(PRESET_ROUTINES) as (keyof typeof PRESET_ROUTINES)[];
const LEVEL_LABELS: Record<string, string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

/* ── Glass tokens (same as rutinas page) ────────────────────── */
const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.07)",
  backdropFilter: "blur(24px) saturate(180%)",
  WebkitBackdropFilter: "blur(24px) saturate(180%)",
  border: "0.5px solid rgba(255,255,255,0.13)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 4px 24px rgba(0,0,0,0.4)",
};

const GLASS_SM: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  border: "0.5px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
};

/* ── Exercise row ───────────────────────────────────────────── */
function ExerciseRow({ ej }: { ej: Ejercicio }) {
  const pill = PILL[ej.tipo];
  return (
    <div className="flex items-center gap-2 py-1.5">
      <p className="flex-1 min-w-0 text-[13px] font-light truncate" style={{ color: "rgba(255,255,255,0.8)" }}>
        {ej.nombre}
      </p>
      <span
        className="shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded-md"
        style={{ background: pill.bg, color: pill.color }}
      >
        {pill.label}
      </span>
      <span className="shrink-0 text-[11px] font-mono tabular-nums w-12 text-right" style={{ color: "rgba(255,255,255,0.45)" }}>
        {ej.series}
      </span>
    </div>
  );
}

/* ── Day card ───────────────────────────────────────────────── */
function DayCard({ dia }: { dia: Dia }) {
  const exercises = dia.secciones
    ? dia.secciones.flatMap((s) => s.ejercicios)
    : dia.ejercicios ?? [];

  return (
    <div className="rounded-2xl px-4 py-4" style={GLASS}>
      {/* Day header */}
      <div className="flex items-center gap-2 mb-3">
        <h4 className="text-sm font-light" style={{ color: "rgba(255,255,255,0.9)" }}>
          {dia.nombre}
        </h4>
        <span
          className="text-[9px] px-2 py-0.5 rounded-full"
          style={{
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.4)",
            border: "0.5px solid rgba(255,255,255,0.1)",
          }}
        >
          {dia.tag}
        </span>
      </div>

      {/* Sections or flat exercises */}
      {dia.secciones ? (
        <div className="space-y-3">
          {dia.secciones.map((sec) => (
            <div key={sec.titulo}>
              <p className="text-[9px] tracking-[0.15em] uppercase mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                {sec.titulo}
              </p>
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                {sec.ejercicios.map((ej, i) => (
                  <ExerciseRow key={i} ej={ej} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : exercises.length > 0 ? (
        <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          {exercises.map((ej, i) => (
            <ExerciseRow key={i} ej={ej} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ── Stats bar ──────────────────────────────────────────────── */
function StatsBar({ stats }: { stats: { dias: number; duracion: string; intensidad: string } }) {
  return (
    <div className="flex gap-3 flex-wrap mb-4">
      {[
        { label: "Dias/sem", value: String(stats.dias) },
        { label: "Duracion", value: stats.duracion },
        { label: "Intensidad", value: stats.intensidad },
      ].map((s) => (
        <div key={s.label} className="px-3 py-2 rounded-xl" style={GLASS_SM}>
          <p className="text-[8px] tracking-[0.15em] uppercase mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
            {s.label}
          </p>
          <p className="text-xs font-light" style={{ color: "rgba(255,255,255,0.7)" }}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Phase content (shared between principiante / intermedio) ─ */
function PhaseContent({ fase }: { fase: FaseData }) {
  if (fase.notaSemana && !fase.dias) {
    return (
      <div>
        <StatsBar stats={fase.stats} />
        <div className="rounded-2xl px-4 py-5 text-center" style={GLASS}>
          <p className="text-[13px] font-light" style={{ color: "rgba(255,255,255,0.6)" }}>
            {fase.notaSemana}
          </p>
          <p className="text-[11px] mt-2" style={{ color: "rgba(255,255,255,0.3)" }}>
            Mismos dias que la fase A, repartidos en 4 sesiones semanales.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <StatsBar stats={fase.stats} />
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {(fase.dias ?? []).map((dia) => (
          <DayCard key={dia.nombre} dia={dia} />
        ))}
      </div>
    </div>
  );
}

/* ── Level content (handles fases vs flat) ──────────────────── */
function LevelContent({ nivel, color }: { nivel: NivelData; color: string }) {
  const [fase, setFase] = useState("A");

  if (tieneFases(nivel)) {
    const faseKeys = Object.keys(nivel.fases);
    const currentFase = nivel.fases[fase] ?? nivel.fases[faseKeys[0]];

    return (
      <div>
        {/* Phase selector */}
        <div className="flex gap-2 mb-4">
          {faseKeys.map((k) => {
            const active = fase === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setFase(k)}
                aria-selected={active}
                className="px-3 py-1.5 rounded-xl text-[10px] tracking-[0.1em] uppercase transition-all"
                style={{
                  background: active ? `${color}18` : "rgba(255,255,255,0.03)",
                  border: `0.5px solid ${active ? `${color}40` : "rgba(255,255,255,0.08)"}`,
                  color: active ? color : "rgba(255,255,255,0.4)",
                }}
              >
                {nivel.fases[k].titulo}
              </button>
            );
          })}
        </div>
        <PhaseContent fase={currentFase} />
      </div>
    );
  }

  // Flat level (avanzado)
  return (
    <div>
      <StatsBar stats={nivel.stats} />
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {nivel.dias.map((dia) => (
          <DayCard key={dia.nombre} dia={dia} />
        ))}
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export default function PresetRoutines() {
  const [activeLevel, setActiveLevel] = useState<string>(LEVELS[0]);
  const color = LEVEL_COLOR[activeLevel];

  return (
    <section>
      <p className="text-[10px] tracking-[0.2em] uppercase mb-3 px-1" style={{ color: "rgba(255,255,255,0.3)" }}>
        Rutinas preestablecidas
      </p>

      <div className="rounded-3xl px-4 py-4 space-y-4" style={GLASS}>
        {/* Level tabs */}
        <div className="flex gap-2">
          {LEVELS.map((lvl) => {
            const active = activeLevel === lvl;
            const c = LEVEL_COLOR[lvl];
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setActiveLevel(lvl)}
                aria-selected={active}
                className="flex-1 py-2.5 rounded-2xl text-[10px] font-medium tracking-[0.15em] uppercase transition-all active:scale-[0.97]"
                style={{
                  background: active ? `${c}18` : "rgba(255,255,255,0.03)",
                  border: `0.5px solid ${active ? `${c}40` : "rgba(255,255,255,0.08)"}`,
                  color: active ? c : "rgba(255,255,255,0.35)",
                }}
              >
                {LEVEL_LABELS[lvl]}
              </button>
            );
          })}
        </div>

        {/* Level content */}
        <LevelContent
          key={activeLevel}
          nivel={PRESET_ROUTINES[activeLevel]}
          color={color}
        />
      </div>
    </section>
  );
}
