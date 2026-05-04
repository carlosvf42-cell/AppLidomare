"use client";

/**
 * Trainers de bloques (Cardio + Funcional) para la pantalla de entrenar
 * del usuario. Pure UI: reciben el bloque y el estado de inputs, llaman
 * onChange. La persistencia (registros_cardio / registros_funcional_user)
 * la hace la pantalla de entrenar al finalizar.
 */

import type { CardioBlock, FuncionalBlock, FuncionalEjercicio, Maquina } from "@/components/antifragil/types";

const FONT_TEXT = "var(--font-ui)";

const META_CARDIO = { color: "#ffb040", bg: "rgba(255,176,64,0.1)", border: "rgba(255,176,64,0.35)" };
const META_FUNCIONAL = { color: "#2abfbf", bg: "rgba(42,191,191,0.12)", border: "rgba(42,191,191,0.4)" };
const META_FUERZA = { color: "#ff8060", bg: "rgba(255,128,96,0.1)", border: "rgba(255,128,96,0.35)" };

const MAQUINA_LABELS: Record<Maquina, string> = {
  carrera: "Carrera",
  bici: "Bici",
  ski: "Ski",
  remo: "Remo",
};

const MODO_LABELS: Record<string, string> = {
  distancia: "Distancia",
  intervalos_tiempo: "Intervalos por tiempo",
  calorias_total: "Calorías totales",
  distancia_total: "Distancia total",
  intervalos_calorias: "Intervalos por calorías",
};

const FORMATO_LABELS: Record<string, string> = {
  for_time: "For time",
  amrap: "AMRAP",
  emom: "EMOM",
  tabata: "Tabata",
};

/* ─────────────────────── Cardio ─────────────────────── */

export type CardioRondaInput = {
  watts: string;
  calorias: string;
  distancia: string;
  duracion_seg: string;
  completada: boolean;
};

export function makeCardioRondaInput(): CardioRondaInput {
  return { watts: "", calorias: "", distancia: "", duracion_seg: "", completada: false };
}

export function CardioBlockTrainer({
  block,
  rondas,
  onChange,
}: {
  block: CardioBlock;
  rondas: CardioRondaInput[];
  onChange: (rondas: CardioRondaInput[]) => void;
}) {
  function update(idx: number, patch: Partial<CardioRondaInput>) {
    onChange(rondas.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }
  function addRonda() {
    onChange([...rondas, makeCardioRondaInput()]);
  }
  function removeRonda(idx: number) {
    if (rondas.length <= 1) return;
    onChange(rondas.filter((_, i) => i !== idx));
  }

  const objetivoLabel = formatCardioObjetivo(block);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "0.5px solid rgba(255,255,255,0.13)" }}
    >
      <div className="px-4 py-3" style={{ background: "rgba(255,176,64,0.05)" }}>
        <div className="flex items-center justify-between gap-2">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-[9px] tracking-[0.2em] uppercase font-semibold"
            style={{ background: META_CARDIO.bg, border: `0.5px solid ${META_CARDIO.border}`, color: META_CARDIO.color, fontFamily: FONT_TEXT }}
          >
            Cardio · {MAQUINA_LABELS[block.maquina]}
          </span>
        </div>
        {block.nombre && (
          <p className="mt-1.5" style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", fontFamily: FONT_TEXT }}>
            {block.nombre}
          </p>
        )}
        <p className="mt-1" style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: FONT_TEXT }}>
          {MODO_LABELS[block.modo] ?? block.modo}{objetivoLabel ? ` · ${objetivoLabel}` : ""}
        </p>
      </div>

      <div style={{ background: "rgba(0,0,0,0.25)" }}>
        <div className="px-4 py-1.5 grid grid-cols-[24px_1fr_1fr_1fr_28px] gap-2 items-center">
          <span className="text-[8px] tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.2)" }}>r</span>
          <span className="text-[8px] tracking-wider uppercase text-center" style={{ color: "rgba(255,255,255,0.2)" }}>cal</span>
          <span className="text-[8px] tracking-wider uppercase text-center" style={{ color: "rgba(255,255,255,0.2)" }}>m</span>
          <span className="text-[8px] tracking-wider uppercase text-center" style={{ color: "rgba(255,255,255,0.2)" }}>seg</span>
          <span />
        </div>

        {rondas.map((r, idx) => (
          <div
            key={idx}
            className="px-4 py-2 grid grid-cols-[24px_1fr_1fr_1fr_28px] gap-2 items-center"
            style={{
              background: r.completada ? "rgba(42,191,191,0.06)" : undefined,
              borderTop: "0.5px solid rgba(255,255,255,0.05)",
            }}
          >
            <span className="text-[10px] font-mono" style={{ color: r.completada ? "#2abfbf" : "rgba(255,255,255,0.3)" }}>
              {String(idx + 1).padStart(2, "0")}
            </span>
            <NumberInput
              value={r.calorias}
              onChange={(v) => update(idx, { calorias: v })}
              placeholder="—"
            />
            <NumberInput
              value={r.distancia}
              onChange={(v) => update(idx, { distancia: v })}
              placeholder="—"
            />
            <NumberInput
              value={r.duracion_seg}
              onChange={(v) => update(idx, { duracion_seg: v })}
              placeholder="—"
            />
            <button
              type="button"
              onClick={() => update(idx, { completada: !r.completada })}
              className="no-min-h"
              style={{
                width: 28, height: 28, borderRadius: 8,
                border: `1.5px solid ${r.completada ? "#2abfbf" : "rgba(255,255,255,0.1)"}`,
                background: r.completada ? "rgba(42,191,191,0.15)" : "rgba(255,255,255,0.03)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
              aria-label="Marcar ronda completada"
            >
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                <path
                  d="M3.5 9L7.5 13L14.5 5"
                  stroke={r.completada ? "#2abfbf" : "rgba(255,255,255,0.2)"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        ))}

        <div className="px-4 py-2 flex gap-2" style={{ borderTop: "0.5px solid rgba(255,255,255,0.05)" }}>
          <button
            type="button"
            onClick={addRonda}
            className="flex-1 py-1.5 rounded-lg text-[10px] tracking-[0.15em] uppercase no-min-h"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "0.5px dashed rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.5)",
              fontFamily: FONT_TEXT,
            }}
          >
            + Ronda
          </button>
          {rondas.length > 1 && (
            <button
              type="button"
              onClick={() => removeRonda(rondas.length - 1)}
              className="px-3 py-1.5 rounded-lg text-[10px] tracking-[0.15em] uppercase no-min-h"
              style={{
                background: "rgba(255,80,80,0.06)",
                border: "0.5px solid rgba(255,80,80,0.15)",
                color: "rgba(255,100,100,0.7)",
                fontFamily: FONT_TEXT,
              }}
            >
              − Última
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatCardioObjetivo(block: CardioBlock): string {
  switch (block.modo) {
    case "distancia":
    case "distancia_total":
      return block.distancia_metros != null ? `${block.distancia_metros} m` : "";
    case "calorias_total":
      return block.calorias_total != null ? `${block.calorias_total} cal` : "";
    case "intervalos_tiempo":
      return [
        block.rondas != null ? `${block.rondas} rondas` : null,
        block.duracion_accion_seg != null ? `${block.duracion_accion_seg}s acción` : null,
        block.duracion_descanso_seg != null ? `${block.duracion_descanso_seg}s descanso` : null,
      ]
        .filter(Boolean)
        .join(" · ");
    case "intervalos_calorias":
      return [
        block.rondas != null ? `${block.rondas} rondas` : null,
        block.calorias_por_ronda != null ? `${block.calorias_por_ronda} cal/ronda` : null,
      ]
        .filter(Boolean)
        .join(" · ");
  }
  return "";
}

/* ─────────────────────── Funcional ─────────────────────── */

export type FuncionalEjercicioInput = {
  kg: string;
  reps: string;
  calorias: string;
  metros: string;
  completada: boolean;
};

export function makeFuncionalEjercicioInput(): FuncionalEjercicioInput {
  return { kg: "", reps: "", calorias: "", metros: "", completada: false };
}

export function FuncionalBlockTrainer({
  block,
  inputs,
  onChange,
}: {
  block: FuncionalBlock;
  inputs: Record<string, FuncionalEjercicioInput>;
  onChange: (inputs: Record<string, FuncionalEjercicioInput>) => void;
}) {
  function update(uid: string, patch: Partial<FuncionalEjercicioInput>) {
    onChange({ ...inputs, [uid]: { ...(inputs[uid] ?? makeFuncionalEjercicioInput()), ...patch } });
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "0.5px solid rgba(255,255,255,0.13)" }}
    >
      <div className="px-4 py-3" style={{ background: "rgba(42,191,191,0.04)" }}>
        <div className="flex items-center justify-between gap-2">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-[9px] tracking-[0.2em] uppercase font-semibold"
            style={{ background: META_FUNCIONAL.bg, border: `0.5px solid ${META_FUNCIONAL.border}`, color: META_FUNCIONAL.color, fontFamily: FONT_TEXT }}
          >
            Funcional · {FORMATO_LABELS[block.formato] ?? block.formato}
          </span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: FONT_TEXT }}>
            {block.tiempo_minutos} min
          </span>
        </div>
        {block.nombre && (
          <p className="mt-1.5" style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", fontFamily: FONT_TEXT }}>
            {block.nombre}
          </p>
        )}
        {block.formato === "tabata" && (
          <p className="mt-1" style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: FONT_TEXT }}>
            {block.duracion_accion_seg ?? "—"}s acción · {block.duracion_descanso_seg ?? "—"}s descanso
          </p>
        )}
      </div>

      <div style={{ background: "rgba(0,0,0,0.25)" }}>
        {block.ejercicios.length === 0 && (
          <p className="px-4 py-4 text-center" style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: FONT_TEXT }}>
            Sin ejercicios definidos
          </p>
        )}
        {block.ejercicios.map((ej) => (
          <FuncionalEjercicioRow
            key={ej.uid}
            ejercicio={ej}
            input={inputs[ej.uid] ?? makeFuncionalEjercicioInput()}
            onChange={(patch) => update(ej.uid, patch)}
          />
        ))}
      </div>
    </div>
  );
}

function FuncionalEjercicioRow({
  ejercicio,
  input,
  onChange,
}: {
  ejercicio: FuncionalEjercicio;
  input: FuncionalEjercicioInput;
  onChange: (patch: Partial<FuncionalEjercicioInput>) => void;
}) {
  const meta = ejercicio.tipo === "fuerza" ? META_FUERZA : META_CARDIO;
  return (
    <div
      className="px-4 py-3 space-y-2"
      style={{
        borderTop: "0.5px solid rgba(255,255,255,0.05)",
        background: input.completada ? "rgba(42,191,191,0.04)" : undefined,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[8px] tracking-[0.2em] uppercase font-semibold"
            style={{ background: meta.bg, border: `0.5px solid ${meta.border}`, color: meta.color, fontFamily: FONT_TEXT }}
          >
            {ejercicio.tipo}
          </span>
          <p className="truncate" style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontFamily: FONT_TEXT }}>
            {ejercicio.nombre_ejercicio || "Ejercicio"}
            {ejercicio.tipo === "fuerza" && ejercicio.reps_objetivo
              ? ` · ${ejercicio.reps_objetivo} reps`
              : ejercicio.tipo === "cardio" && ejercicio.maquina
              ? ` · ${MAQUINA_LABELS[ejercicio.maquina]}`
              : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange({ completada: !input.completada })}
          className="no-min-h shrink-0"
          style={{
            width: 28, height: 28, borderRadius: 8,
            border: `1.5px solid ${input.completada ? "#2abfbf" : "rgba(255,255,255,0.1)"}`,
            background: input.completada ? "rgba(42,191,191,0.15)" : "rgba(255,255,255,0.03)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
          aria-label="Marcar completado"
        >
          <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
            <path
              d="M3.5 9L7.5 13L14.5 5"
              stroke={input.completada ? "#2abfbf" : "rgba(255,255,255,0.2)"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {ejercicio.tipo === "fuerza" ? (
        <div className="grid grid-cols-2 gap-2">
          <FieldInput label="Kg" value={input.kg} onChange={(v) => onChange({ kg: v })} />
          <FieldInput label="Reps" value={input.reps} onChange={(v) => onChange({ reps: v })} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <FieldInput label="Cal" value={input.calorias} onChange={(v) => onChange({ calorias: v })} />
          <FieldInput label="Metros" value={input.metros} onChange={(v) => onChange({ metros: v })} />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── inputs reutilizables ─────────────────────── */

function NumberInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step="0.5"
      min={0}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => e.target.select()}
      placeholder={placeholder}
      className="w-full rounded-lg px-1 py-2 text-xs text-center outline-none"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "0.5px solid rgba(255,255,255,0.1)",
        color: "rgba(255,255,255,0.9)",
        fontFamily: FONT_TEXT,
      }}
    />
  );
}

function FieldInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-[9px] tracking-wider uppercase mb-1" style={{ color: "rgba(255,255,255,0.25)", fontFamily: FONT_TEXT }}>
        {label}
      </p>
      <input
        type="number"
        inputMode="decimal"
        step="0.5"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => e.target.select()}
        placeholder="—"
        className="w-full rounded-lg px-2 py-1.5 text-xs text-center outline-none"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "0.5px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.9)",
          fontFamily: FONT_TEXT,
        }}
      />
    </div>
  );
}
