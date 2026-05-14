"use client";

/**
 * Editor de bloques (Cardio + Funcional) para usuarios normales en
 * /rutinas/[nueva|editar] y /rutinas/entrenar (día libre).
 * El admin tiene su propio EntrenoBuilder en components/antifragil/.
 * Este componente NO se mete con la persistencia: solo edita el estado.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import EjercicioSelector from "@/components/EjercicioSelector";
import {
  type Block,
  type CardioBlock,
  type CardioModo,
  type FuerzaBlock,
  type FuerzaEjercicio,
  type FuncionalBlock,
  type FuncionalEjercicio,
  type FuncionalFormato,
  type Maquina,
  makeCardio,
  makeFuerza,
  makeFuerzaEjercicio,
  makeFuncional,
  makeFuncionalEjercicio,
} from "@/components/antifragil/types";

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "0.5px solid rgba(255,255,255,0.08)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)",
};

const EYEBROW: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.25em",
  textTransform: "uppercase",
  color: "rgba(42,191,191,0.7)",
  fontFamily: "var(--font-ui)",
};

const LABEL: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.4)",
  fontFamily: "var(--font-ui)",
};

const FONT_TEXT = "var(--font-ui)";
const FONT_TITLE = "var(--font-serif)";

const META_CARDIO = { label: "Cardio", color: "#ffb040", bg: "rgba(255,176,64,0.1)", border: "rgba(255,176,64,0.35)" };
const META_FUNCIONAL = { label: "Funcional", color: "#2abfbf", bg: "rgba(42,191,191,0.12)", border: "rgba(42,191,191,0.4)" };
const META_FUERZA = { label: "Fuerza", color: "#ff8060", bg: "rgba(255,128,96,0.1)", border: "rgba(255,128,96,0.35)" };

const MAQUINAS: { key: Maquina; label: string }[] = [
  { key: "carrera", label: "Carrera" },
  { key: "bici", label: "Bici" },
  { key: "ski", label: "Ski" },
  { key: "remo", label: "Remo" },
];

const FORMATOS: { key: FuncionalFormato; label: string }[] = [
  { key: "for_time", label: "For time" },
  { key: "amrap", label: "AMRAP" },
  { key: "emom", label: "EMOM" },
  { key: "tabata", label: "Tabata" },
];

/* Portal helper: monta children en document.body para escapar del
   stacking context del <main>. Sin esto, el BottomNav (z-50, fuera
   de main) gana siempre a cualquier z-index dentro de main. */
function PortalToBody({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted || typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

/* ─────────────────────── BlockEditor ─────────────────────── */

interface Props {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  /** Tipos permitidos al añadir un bloque nuevo. Por defecto solo
   *  cardio + funcional (el creador de rutinas gestiona la fuerza
   *  como rutina_ejercicios planos). En la pantalla de entrenar
   *  se pasa también "fuerza" para permitir bloques ad-hoc. */
  allowKinds?: Array<"fuerza" | "cardio" | "funcional">;
  /** Notifica al padre cuando el bottom sheet de "Añadir bloque" se
   *  abre o cierra, para que pueda ocultar otros elementos fijos
   *  (ej: footer "Finalizar entrenamiento") y evitar superposiciones. */
  onAddSheetOpenChange?: (open: boolean) => void;
}

export default function BlockEditor({ blocks, onChange, allowKinds = ["cardio", "funcional"], onAddSheetOpenChange }: Props) {
  const [showAdd, _setShowAdd] = useState(false);
  const setShowAdd = (v: boolean) => {
    _setShowAdd(v);
    onAddSheetOpenChange?.(v);
  };

  function addBlock(kind: "fuerza" | "cardio" | "funcional") {
    const orden = blocks.length;
    const newBlock: Block =
      kind === "cardio" ? makeCardio(orden) :
      kind === "funcional" ? makeFuncional(orden) :
      makeFuerza(orden);
    onChange([...blocks, newBlock]);
    setShowAdd(false);
  }

  function updateBlock(uid: string, patch: any) {
    onChange(blocks.map((b) => (b.uid === uid ? { ...b, ...patch } : b)));
  }

  function removeBlock(uid: string) {
    onChange(blocks.filter((b) => b.uid !== uid).map((b, i) => ({ ...b, orden: i })));
  }

  function moveBlock(uid: string, dir: -1 | 1) {
    const idx = blocks.findIndex((b) => b.uid === uid);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= blocks.length) return;
    const arr = blocks.slice();
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    onChange(arr.map((b, i) => ({ ...b, orden: i })));
  }

  const filtered = blocks.filter((b) => allowKinds.includes(b.kind));

  return (
    <div className="space-y-3">
      {filtered.map((block, idx) => (
        <BlockCard
          key={block.uid}
          block={block}
          index={idx}
          total={filtered.length}
          onChange={(patch) => updateBlock(block.uid, patch)}
          onRemove={() => removeBlock(block.uid)}
          onMove={(dir) => moveBlock(block.uid, dir)}
        />
      ))}

      <button
        type="button"
        onClick={() => setShowAdd(true)}
        className="w-full py-3 rounded-2xl text-[10px] tracking-[0.2em] uppercase font-semibold transition-all active:scale-[0.99]"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "0.5px dashed rgba(255,255,255,0.18)",
          color: "rgba(255,255,255,0.55)",
          fontFamily: FONT_TEXT,
        }}
      >
        + Añadir bloque
      </button>

      {showAdd && (
        <PortalToBody>
          <AddBlockSheet
            onPick={(k) => addBlock(k)}
            onClose={() => setShowAdd(false)}
            allowKinds={allowKinds}
          />
        </PortalToBody>
      )}
    </div>
  );
}

/* ─────────────────────── AddBlockSheet ─────────────────────── */

function AddBlockSheet({
  onPick,
  onClose,
  allowKinds,
}: {
  onPick: (k: "fuerza" | "cardio" | "funcional") => void;
  onClose: () => void;
  allowKinds: Array<"fuerza" | "cardio" | "funcional">;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[430px] rounded-t-3xl px-5 pt-6 pb-[calc(40px+env(safe-area-inset-bottom))] space-y-3"
        style={{
          background: "#0e0e0e",
          borderTop: "0.5px solid rgba(255,255,255,0.1)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <p style={EYEBROW}>Añadir bloque</p>
        <h3
          style={{
            fontFamily: FONT_TITLE,
            fontSize: "1.5rem",
            fontWeight: 600,
            color: "rgba(255,255,255,0.95)",
            marginBottom: 12,
          }}
        >
          Tipo de bloque
        </h3>
        {allowKinds.includes("fuerza") && (
          <button
            type="button"
            onClick={() => onPick("fuerza")}
            className="w-full px-5 py-4 rounded-2xl flex items-center justify-between active:scale-[0.99]"
            style={{
              background: META_FUERZA.bg,
              border: `0.5px solid ${META_FUERZA.border}`,
              color: META_FUERZA.color,
              fontFamily: FONT_TEXT,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <span>{META_FUERZA.label}</span>
            <span style={{ fontSize: 16 }}>→</span>
          </button>
        )}
        {allowKinds.includes("cardio") && (
          <button
            type="button"
            onClick={() => onPick("cardio")}
            className="w-full px-5 py-4 rounded-2xl flex items-center justify-between active:scale-[0.99]"
            style={{
              background: META_CARDIO.bg,
              border: `0.5px solid ${META_CARDIO.border}`,
              color: META_CARDIO.color,
              fontFamily: FONT_TEXT,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <span>{META_CARDIO.label}</span>
            <span style={{ fontSize: 16 }}>→</span>
          </button>
        )}
        {allowKinds.includes("funcional") && (
          <button
            type="button"
            onClick={() => onPick("funcional")}
            className="w-full px-5 py-4 rounded-2xl flex items-center justify-between active:scale-[0.99]"
            style={{
              background: META_FUNCIONAL.bg,
              border: `0.5px solid ${META_FUNCIONAL.border}`,
              color: META_FUNCIONAL.color,
              fontFamily: FONT_TEXT,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <span>{META_FUNCIONAL.label}</span>
            <span style={{ fontSize: 16 }}>→</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────── BlockCard ─────────────────────── */

function BlockCard({
  block,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  block: Block;
  index: number;
  total: number;
  onChange: (patch: any) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const meta = block.kind === "cardio" ? META_CARDIO : block.kind === "funcional" ? META_FUNCIONAL : META_FUERZA;
  return (
    <div className="rounded-2xl px-4 py-4 space-y-4" style={GLASS}>
      <div className="flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] tracking-[0.2em] uppercase font-semibold"
          style={{ background: meta.bg, border: `0.5px solid ${meta.border}`, color: meta.color, fontFamily: FONT_TEXT }}
        >
          {index + 1}. {meta.label}
        </span>
        <div className="flex items-center gap-1">
          <IconBtn disabled={index === 0} onClick={() => onMove(-1)} label="Subir">
            <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </IconBtn>
          <IconBtn disabled={index === total - 1} onClick={() => onMove(1)} label="Bajar">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </IconBtn>
          <IconBtn onClick={onRemove} label="Eliminar" danger>
            <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </IconBtn>
        </div>
      </div>

      <NombreField value={block.nombre ?? ""} onChange={(v) => onChange({ nombre: v || null })} placeholder="Nombre del bloque (opcional)" />

      {block.kind === "fuerza" && <FuerzaForm block={block} onChange={onChange} />}
      {block.kind === "cardio" && <CardioForm block={block} onChange={onChange} />}
      {block.kind === "funcional" && <FuncionalForm block={block} onChange={onChange} />}
    </div>
  );
}

/* ─────────────────────── FUERZA ─────────────────────── */

function FuerzaForm({ block, onChange }: { block: FuerzaBlock; onChange: (patch: Partial<FuerzaBlock>) => void }) {
  function addEj() {
    onChange({ ejercicios: [...block.ejercicios, makeFuerzaEjercicio(block.ejercicios.length)] });
  }
  function updateEj(uid: string, patch: Partial<FuerzaEjercicio>) {
    onChange({ ejercicios: block.ejercicios.map((e) => (e.uid === uid ? { ...e, ...patch } : e)) });
  }
  function removeEj(uid: string) {
    onChange({
      ejercicios: block.ejercicios.filter((e) => e.uid !== uid).map((e, i) => ({ ...e, orden: i })),
    });
  }
  function moveEj(uid: string, dir: -1 | 1) {
    const idx = block.ejercicios.findIndex((e) => e.uid === uid);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= block.ejercicios.length) return;
    const arr = block.ejercicios.slice();
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    onChange({ ejercicios: arr.map((e, i) => ({ ...e, orden: i })) });
  }

  return (
    <div className="space-y-3">
      <div>
        <p style={{ ...LABEL, marginBottom: 6 }}>Ejercicios del bloque</p>
        <div className="space-y-2">
          {block.ejercicios.map((ej, idx) => (
            <div
              key={ej.uid}
              className="rounded-xl px-3 py-3 space-y-2"
              style={{ background: "rgba(255,255,255,0.025)", border: "0.5px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] tracking-[0.18em] uppercase font-semibold" style={{ color: "rgba(255,128,96,0.85)", fontFamily: FONT_TEXT }}>
                  Ejercicio {idx + 1}
                </span>
                <div className="flex items-center gap-1">
                  <IconBtn disabled={idx === 0} onClick={() => moveEj(ej.uid, -1)} label="Subir">
                    <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </IconBtn>
                  <IconBtn disabled={idx === block.ejercicios.length - 1} onClick={() => moveEj(ej.uid, 1)} label="Bajar">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </IconBtn>
                  <IconBtn
                    onClick={() => removeEj(ej.uid)}
                    label="Eliminar"
                    danger
                    disabled={block.ejercicios.length <= 1}
                  >
                    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </IconBtn>
                </div>
              </div>
              <div className="flex">
                <EjercicioSelector
                  value={ej.nombre_ejercicio}
                  ejercicioId={ej.ejercicio_id}
                  onChange={(nombre, ejercicioId) =>
                    updateEj(ej.uid, { nombre_ejercicio: nombre, ejercicio_id: ejercicioId })
                  }
                />
              </div>
              <div className="flex gap-2">
                <NumField label="Series" value={ej.series_objetivo} onChange={(v) => updateEj(ej.uid, { series_objetivo: v ?? 0 })} />
                <NumField label="Reps" value={ej.reps_objetivo} onChange={(v) => updateEj(ej.uid, { reps_objetivo: v ?? 0 })} />
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addEj}
          className="w-full mt-2 py-2 rounded-lg text-[10px] tracking-[0.15em] uppercase font-semibold no-min-h"
          style={{
            background: "rgba(255,128,96,0.06)",
            border: "0.5px dashed rgba(255,128,96,0.3)",
            color: "rgba(255,128,96,0.85)",
            fontFamily: FONT_TEXT,
          }}
        >
          + Añadir ejercicio
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────── helpers UI ─────────────────────── */

function IconBtn({
  children,
  onClick,
  disabled,
  label,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-25 active:scale-95 no-min-h"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "0.5px solid rgba(255,255,255,0.1)",
        color: danger ? "#ff8080" : "rgba(255,255,255,0.6)",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        {children}
      </svg>
    </button>
  );
}

function NombreField({
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
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] placeholder-[#333] text-xs outline-none focus:border-[#2abfbf] transition-colors"
    />
  );
}

function NumField({
  label,
  value,
  onChange,
  step = 1,
  suffix,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className="flex-1">
      <p style={{ ...LABEL, marginBottom: 4 }}>{label}</p>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          step={step}
          value={value ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === "" ? null : Number(v));
          }}
          className="flex-1 min-w-0 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] text-sm outline-none focus:border-[#2abfbf] transition-colors"
        />
        {suffix && <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)", fontFamily: FONT_TEXT }}>{suffix}</span>}
      </div>
    </div>
  );
}

function DuracionField({
  label,
  seconds,
  onChange,
}: {
  label: string;
  seconds: number | null;
  onChange: (v: number | null) => void;
}) {
  const initialUnit: "min" | "seg" = seconds != null && seconds > 0 && seconds < 60 ? "seg" : "min";
  const [unit, setUnit] = useState<"min" | "seg">(initialUnit);
  const [mmStr, setMmStr] = useState<string>(seconds == null ? "" : String(Math.floor(seconds / 60)));
  const [ssStr, setSsStr] = useState<string>(seconds == null ? "" : String(seconds % 60));
  const [secStr, setSecStr] = useState<string>(seconds == null ? "" : String(seconds));

  function emitMin(nextMm: string, nextSs: string) {
    if (nextMm === "" && nextSs === "") {
      onChange(null);
      return;
    }
    const m = nextMm === "" ? 0 : Number(nextMm);
    const s = nextSs === "" ? 0 : Number(nextSs);
    onChange(m * 60 + s);
  }

  function emitSec(next: string) {
    if (next === "") onChange(null);
    else onChange(Number(next));
  }

  return (
    <div>
      <p style={{ ...LABEL, marginBottom: 6 }}>{label}</p>
      <div className="flex gap-1.5 mb-2">
        {(["min", "seg"] as const).map((u) => {
          const sel = unit === u;
          return (
            <button
              key={u}
              type="button"
              onClick={() => setUnit(u)}
              className="px-3 py-1.5 rounded-md text-[10px] tracking-[0.15em] uppercase font-semibold no-min-h"
              style={{
                background: sel ? "rgba(42,191,191,0.15)" : "rgba(255,255,255,0.04)",
                border: `0.5px solid ${sel ? "rgba(42,191,191,0.4)" : "rgba(255,255,255,0.08)"}`,
                color: sel ? "#2abfbf" : "rgba(255,255,255,0.5)",
                fontFamily: FONT_TEXT,
              }}
            >
              {u === "min" ? "Minutos" : "Segundos"}
            </button>
          );
        })}
      </div>
      {unit === "min" ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={99}
            value={mmStr}
            onChange={(e) => {
              const v = e.target.value;
              if (v !== "" && (Number(v) < 0 || Number(v) > 99)) return;
              setMmStr(v);
              emitMin(v, ssStr);
            }}
            placeholder="mm"
            className="w-20 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] text-sm outline-none focus:border-[#2abfbf]"
          />
          <span style={{ color: "rgba(255,255,255,0.35)" }}>:</span>
          <input
            type="number"
            min={0}
            max={59}
            value={ssStr}
            onChange={(e) => {
              const v = e.target.value;
              if (v !== "" && (Number(v) < 0 || Number(v) > 59)) return;
              setSsStr(v);
              emitMin(mmStr, v);
            }}
            placeholder="ss"
            className="w-20 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] text-sm outline-none focus:border-[#2abfbf]"
          />
        </div>
      ) : (
        <input
          type="number"
          min={0}
          value={secStr}
          onChange={(e) => {
            const v = e.target.value;
            if (v !== "" && Number(v) < 0) return;
            setSecStr(v);
            emitSec(v);
          }}
          placeholder="ss"
          className="w-24 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] text-sm outline-none focus:border-[#2abfbf]"
        />
      )}
    </div>
  );
}

/* ─────────────────────── CARDIO ─────────────────────── */

function modosFor(maquina: Maquina): { key: CardioModo; label: string }[] {
  if (maquina === "carrera") {
    return [
      { key: "distancia", label: "Distancia" },
      { key: "intervalos_tiempo", label: "Intervalos por tiempo" },
    ];
  }
  return [
    { key: "calorias_total", label: "Calorías totales" },
    { key: "distancia_total", label: "Distancia total" },
    { key: "intervalos_tiempo", label: "Intervalos por tiempo" },
    { key: "intervalos_calorias", label: "Intervalos por calorías" },
  ];
}

function CardioForm({ block, onChange }: { block: CardioBlock; onChange: (patch: Partial<CardioBlock>) => void }) {
  const modos = modosFor(block.maquina);
  const isCarrera = block.maquina === "carrera";
  return (
    <div className="space-y-3">
      <div>
        <p style={{ ...LABEL, marginBottom: 6 }}>Máquina</p>
        <div className="grid grid-cols-4 gap-1.5">
          {MAQUINAS.map((m) => {
            const sel = block.maquina === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => {
                  const validModos = modosFor(m.key).map((x) => x.key);
                  const newModo = validModos.includes(block.modo) ? block.modo : validModos[0];
                  onChange({ maquina: m.key, modo: newModo });
                }}
                className="py-2 rounded-lg text-[10px] tracking-[0.15em] uppercase font-semibold no-min-h"
                style={{
                  background: sel ? "rgba(42,191,191,0.15)" : "rgba(255,255,255,0.04)",
                  border: `0.5px solid ${sel ? "rgba(42,191,191,0.4)" : "rgba(255,255,255,0.08)"}`,
                  color: sel ? "#2abfbf" : "rgba(255,255,255,0.5)",
                  fontFamily: FONT_TEXT,
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p style={{ ...LABEL, marginBottom: 6 }}>Modo</p>
        <div className="flex flex-wrap gap-1.5">
          {modos.map((m) => {
            const sel = block.modo === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => onChange({ modo: m.key })}
                className="px-3 py-2 rounded-lg text-[10px] tracking-[0.12em] uppercase font-semibold no-min-h"
                style={{
                  background: sel ? "rgba(42,191,191,0.15)" : "rgba(255,255,255,0.04)",
                  border: `0.5px solid ${sel ? "rgba(42,191,191,0.4)" : "rgba(255,255,255,0.08)"}`,
                  color: sel ? "#2abfbf" : "rgba(255,255,255,0.5)",
                  fontFamily: FONT_TEXT,
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {block.modo === "distancia" && (
        <NumField label="Distancia (metros)" value={block.distancia_metros} onChange={(v) => onChange({ distancia_metros: v })} suffix="m" />
      )}
      {block.modo === "distancia_total" && (
        <div className="flex gap-3">
          <NumField label="Distancia (metros)" value={block.distancia_metros} onChange={(v) => onChange({ distancia_metros: v })} suffix="m" />
          {!isCarrera && (
            <NumField label="Watts (opc.)" value={block.watts_objetivo} onChange={(v) => onChange({ watts_objetivo: v })} suffix="W" />
          )}
        </div>
      )}
      {block.modo === "calorias_total" && (
        <div className="flex gap-3">
          <NumField label="Calorías" value={block.calorias_total} onChange={(v) => onChange({ calorias_total: v })} suffix="cal" />
          <NumField label="Watts (opc.)" value={block.watts_objetivo} onChange={(v) => onChange({ watts_objetivo: v })} suffix="W" />
        </div>
      )}
      {block.modo === "intervalos_tiempo" && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <NumField label="Rondas" value={block.rondas} onChange={(v) => onChange({ rondas: v })} />
            {!isCarrera && (
              <NumField label="Watts (opc.)" value={block.watts_objetivo} onChange={(v) => onChange({ watts_objetivo: v })} suffix="W" />
            )}
          </div>
          <DuracionField label="Acción" seconds={block.duracion_accion_seg} onChange={(v) => onChange({ duracion_accion_seg: v })} />
          <DuracionField label="Descanso" seconds={block.duracion_descanso_seg} onChange={(v) => onChange({ duracion_descanso_seg: v })} />
        </div>
      )}
      {block.modo === "intervalos_calorias" && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <NumField label="Rondas" value={block.rondas} onChange={(v) => onChange({ rondas: v })} />
            <NumField label="Cal/ronda" value={block.calorias_por_ronda} onChange={(v) => onChange({ calorias_por_ronda: v })} suffix="cal" />
          </div>
          <NumField label="Watts (opc.)" value={block.watts_objetivo} onChange={(v) => onChange({ watts_objetivo: v })} suffix="W" />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── FUNCIONAL ─────────────────────── */

function FuncionalForm({
  block,
  onChange,
}: {
  block: FuncionalBlock;
  onChange: (patch: Partial<FuncionalBlock>) => void;
}) {
  const [showAddEj, setShowAddEj] = useState(false);

  function addEj(tipo: "fuerza" | "cardio") {
    const orden = block.ejercicios.length;
    onChange({ ejercicios: [...block.ejercicios, makeFuncionalEjercicio(orden, tipo)] });
    setShowAddEj(false);
  }

  function updateEj(uid: string, patch: Partial<FuncionalEjercicio>) {
    onChange({ ejercicios: block.ejercicios.map((e) => (e.uid === uid ? { ...e, ...patch } : e)) });
  }

  function removeEj(uid: string) {
    onChange({
      ejercicios: block.ejercicios.filter((e) => e.uid !== uid).map((e, i) => ({ ...e, orden: i })),
    });
  }

  function moveEj(uid: string, dir: -1 | 1) {
    const idx = block.ejercicios.findIndex((e) => e.uid === uid);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= block.ejercicios.length) return;
    const arr = block.ejercicios.slice();
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    onChange({ ejercicios: arr.map((e, i) => ({ ...e, orden: i })) });
  }

  return (
    <div className="space-y-3">
      <div>
        <p style={{ ...LABEL, marginBottom: 6 }}>Formato</p>
        <div className="grid grid-cols-4 gap-1.5">
          {FORMATOS.map((f) => {
            const sel = block.formato === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => onChange({ formato: f.key })}
                className="py-2 rounded-lg text-[10px] tracking-[0.15em] uppercase font-semibold no-min-h"
                style={{
                  background: sel ? "rgba(42,191,191,0.15)" : "rgba(255,255,255,0.04)",
                  border: `0.5px solid ${sel ? "rgba(42,191,191,0.4)" : "rgba(255,255,255,0.08)"}`,
                  color: sel ? "#2abfbf" : "rgba(255,255,255,0.5)",
                  fontFamily: FONT_TEXT,
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <NumField label="Tiempo total (min)" value={block.tiempo_minutos} onChange={(v) => onChange({ tiempo_minutos: v ?? 0 })} suffix="min" />
      </div>

      {block.formato === "tabata" && (
        <div className="flex gap-3">
          <NumField label="Acción (seg)" value={block.duracion_accion_seg} onChange={(v) => onChange({ duracion_accion_seg: v })} suffix="s" />
          <NumField label="Descanso (seg)" value={block.duracion_descanso_seg} onChange={(v) => onChange({ duracion_descanso_seg: v })} suffix="s" />
        </div>
      )}

      <div>
        <p style={{ ...LABEL, marginBottom: 6 }}>Ejercicios del bloque</p>
        <div className="space-y-2">
          {block.ejercicios.length === 0 && (
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: FONT_TEXT }}>
              Sin ejercicios. Pulsa abajo para añadir.
            </p>
          )}
          {block.ejercicios.map((ej, idx) => (
            <FuncionalEjercicioCard
              key={ej.uid}
              ejercicio={ej}
              index={idx}
              total={block.ejercicios.length}
              onChange={(patch) => updateEj(ej.uid, patch)}
              onRemove={() => removeEj(ej.uid)}
              onMove={(dir) => moveEj(ej.uid, dir)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowAddEj(true)}
          className="w-full mt-2 py-2 rounded-lg text-[10px] tracking-[0.15em] uppercase font-semibold no-min-h"
          style={{
            background: "rgba(42,191,191,0.06)",
            border: "0.5px dashed rgba(42,191,191,0.3)",
            color: "rgba(42,191,191,0.85)",
            fontFamily: FONT_TEXT,
          }}
        >
          + Añadir ejercicio
        </button>
      </div>

      {showAddEj && (
        <PortalToBody>
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddEj(false);
          }}
        >
          <div
            className="w-full max-w-[430px] rounded-t-3xl px-5 pt-6 pb-[calc(40px+env(safe-area-inset-bottom))] space-y-3"
            style={{
              background: "#0e0e0e",
              borderTop: "0.5px solid rgba(255,255,255,0.1)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <p style={EYEBROW}>Añadir ejercicio</p>
            <h3
              style={{
                fontFamily: FONT_TITLE,
                fontSize: "1.4rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.95)",
                marginBottom: 12,
              }}
            >
              Tipo de ejercicio
            </h3>
            <button
              type="button"
              onClick={() => addEj("fuerza")}
              className="w-full px-5 py-4 rounded-2xl flex items-center justify-between"
              style={{
                background: META_FUERZA.bg,
                border: `0.5px solid ${META_FUERZA.border}`,
                color: META_FUERZA.color,
                fontFamily: FONT_TEXT,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <span>Fuerza</span>
              <span>→</span>
            </button>
            <button
              type="button"
              onClick={() => addEj("cardio")}
              className="w-full px-5 py-4 rounded-2xl flex items-center justify-between"
              style={{
                background: META_CARDIO.bg,
                border: `0.5px solid ${META_CARDIO.border}`,
                color: META_CARDIO.color,
                fontFamily: FONT_TEXT,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <span>Cardio</span>
              <span>→</span>
            </button>
          </div>
        </div>
        </PortalToBody>
      )}
    </div>
  );
}

function FuncionalEjercicioCard({
  ejercicio,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  ejercicio: FuncionalEjercicio;
  index: number;
  total: number;
  onChange: (patch: Partial<FuncionalEjercicio>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const meta = ejercicio.tipo === "fuerza" ? META_FUERZA : META_CARDIO;
  return (
    <div
      className="rounded-xl px-3 py-3 space-y-2"
      style={{ background: "rgba(255,255,255,0.025)", border: "0.5px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-[9px] tracking-[0.2em] uppercase font-semibold"
          style={{ background: meta.bg, border: `0.5px solid ${meta.border}`, color: meta.color, fontFamily: FONT_TEXT }}
        >
          {index + 1}. {meta.label}
        </span>
        <div className="flex items-center gap-1">
          <IconBtn disabled={index === 0} onClick={() => onMove(-1)} label="Subir">
            <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </IconBtn>
          <IconBtn disabled={index === total - 1} onClick={() => onMove(1)} label="Bajar">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </IconBtn>
          <IconBtn onClick={onRemove} label="Eliminar" danger>
            <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </IconBtn>
        </div>
      </div>

      {ejercicio.tipo === "fuerza" ? (
        <div className="space-y-2">
          <EjercicioSelector
            value={ejercicio.nombre_ejercicio}
            ejercicioId={ejercicio.ejercicio_id}
            onChange={(nombre, ejercicioId) => onChange({ nombre_ejercicio: nombre, ejercicio_id: ejercicioId })}
          />
          <NumField label="Reps objetivo" value={ejercicio.reps_objetivo} onChange={(v) => onChange({ reps_objetivo: v })} />
        </div>
      ) : (
        <div className="space-y-2">
          <div>
            <p style={{ ...LABEL, marginBottom: 4 }}>Máquina</p>
            <div className="grid grid-cols-4 gap-1.5">
              {MAQUINAS.map((m) => {
                const sel = ejercicio.maquina === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => onChange({ maquina: m.key })}
                    className="py-1.5 rounded-md text-[9px] tracking-[0.15em] uppercase font-semibold no-min-h"
                    style={{
                      background: sel ? "rgba(42,191,191,0.15)" : "rgba(255,255,255,0.04)",
                      border: `0.5px solid ${sel ? "rgba(42,191,191,0.4)" : "rgba(255,255,255,0.08)"}`,
                      color: sel ? "#2abfbf" : "rgba(255,255,255,0.5)",
                      fontFamily: FONT_TEXT,
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2">
            <NumField label="Calorías" value={ejercicio.calorias_objetivo} onChange={(v) => onChange({ calorias_objetivo: v })} suffix="cal" />
            <NumField label="Metros" value={ejercicio.metros_objetivo} onChange={(v) => onChange({ metros_objetivo: v })} suffix="m" />
          </div>
        </div>
      )}
    </div>
  );
}
