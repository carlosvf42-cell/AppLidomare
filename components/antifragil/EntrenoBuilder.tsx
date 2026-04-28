"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import EjercicioSelector from "@/components/EjercicioSelector";
import {
  type Block,
  type CardioBlock,
  type CardioModo,
  type FuerzaBlock,
  type FuncionalBlock,
  type FuncionalEjercicio,
  type FuncionalFormato,
  type Maquina,
  makeCardio,
  makeFuerza,
  makeFuncional,
  makeFuncionalEjercicio,
  toApiBlocks,
} from "./types";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

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
  fontFamily: "Barlow Condensed, sans-serif",
};

const LABEL: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.4)",
  fontFamily: "Barlow Condensed, sans-serif",
};

const FONT_TEXT = "Barlow Condensed, sans-serif";
const FONT_TITLE = "Cormorant Garamond, serif";

const BLOCK_META: Record<Block["kind"], { label: string; color: string; bg: string; border: string }> = {
  fuerza: { label: "Fuerza", color: "#ff8060", bg: "rgba(255,128,96,0.1)", border: "rgba(255,128,96,0.35)" },
  cardio: { label: "Cardio", color: "#ffb040", bg: "rgba(255,176,64,0.1)", border: "rgba(255,176,64,0.35)" },
  funcional: { label: "Funcional", color: "#2abfbf", bg: "rgba(42,191,191,0.12)", border: "rgba(42,191,191,0.4)" },
};

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

interface Props {
  userId: string;
  entrenoId?: string;
  initialNombre?: string | null;
  initialBlocks?: Block[];
  onTrainNow: (entrenoId: string, nombre: string | null, blocks: Block[]) => void;
}

export default function EntrenoBuilder({ userId, entrenoId, initialNombre, initialBlocks, onTrainNow }: Props) {
  const router = useRouter();
  const [nombre, setNombre] = useState<string>(initialNombre ?? "");
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks ?? []);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState<null | "siguiente" | "ahora">(null);
  const [error, setError] = useState<string | null>(null);

  function addBlock(kind: Block["kind"]) {
    const orden = blocks.length;
    if (kind === "fuerza") setBlocks([...blocks, makeFuerza(orden)]);
    if (kind === "cardio") setBlocks([...blocks, makeCardio(orden)]);
    if (kind === "funcional") setBlocks([...blocks, makeFuncional(orden)]);
    setShowAdd(false);
  }

  function updateBlock(uid: string, patch: Partial<Block>) {
    setBlocks((prev) => prev.map((b) => (b.uid === uid ? ({ ...b, ...patch } as Block) : b)));
  }

  function removeBlock(uid: string) {
    setBlocks((prev) => prev.filter((b) => b.uid !== uid).map((b, i) => ({ ...b, orden: i })));
  }

  function moveBlock(uid: string, dir: -1 | 1) {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.uid === uid);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= prev.length) return prev;
      const next = prev.slice();
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((b, i) => ({ ...b, orden: i }));
    });
  }

  async function persist(estado: "programado"): Promise<string | null> {
    setError(null);
    const { data: { session } } = await getSupabase().auth.getSession();
    if (!session) {
      setError("Sesión expirada");
      return null;
    }

    const payload = {
      nombre: nombre.trim() || null,
      estado,
      bloques: toApiBlocks(blocks),
    };
    const url = entrenoId
      ? `/api/admin/antifragil/${userId}/entrenos/${entrenoId}`
      : `/api/admin/antifragil/${userId}/entrenos`;
    const method = entrenoId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Error al guardar");
      return null;
    }
    return json.id ?? entrenoId ?? null;
  }

  async function handleGuardar() {
    if (blocks.length === 0) {
      setError("Añade al menos un bloque");
      return;
    }
    setSaving("siguiente");
    const id = await persist("programado");
    setSaving(null);
    if (id) router.push(`/admin/antifragil/${userId}`);
  }

  async function handleEntrenarAhora() {
    if (blocks.length === 0) {
      setError("Añade al menos un bloque");
      return;
    }
    setSaving("ahora");
    const id = await persist("programado");
    setSaving(null);
    if (id) onTrainNow(id, nombre.trim() || null, blocks);
  }

  return (
    <div className="min-h-screen pb-44" style={{ background: "#080808" }}>
      <div className="px-5 pt-14 pb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="shrink-0"
          style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <p style={EYEBROW}>{entrenoId ? "Editar entreno" : "Nuevo entreno"}</p>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del entrenamiento (opcional)"
            className="w-full bg-transparent border-none outline-none mt-0.5 truncate"
            style={{
              fontFamily: FONT_TITLE,
              fontSize: "1.75rem",
              fontWeight: 300,
              lineHeight: 1.1,
              color: "rgba(255,255,255,0.95)",
            }}
          />
        </div>
      </div>

      <div className="px-4 space-y-3">
        {blocks.length === 0 ? (
          <div className="rounded-2xl px-5 py-10 text-center" style={GLASS}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: FONT_TEXT, lineHeight: 1.5 }}>
              Sin bloques todavía
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: FONT_TEXT, marginTop: 6 }}>
              Pulsa "Añadir bloque" para empezar
            </p>
          </div>
        ) : (
          blocks.map((b, idx) => (
            <BlockCard
              key={b.uid}
              block={b}
              index={idx}
              total={blocks.length}
              onChange={(patch) => updateBlock(b.uid, patch)}
              onRemove={() => removeBlock(b.uid)}
              onMove={(dir) => moveBlock(b.uid, dir)}
            />
          ))
        )}

        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="w-full py-4 rounded-2xl text-xs font-semibold tracking-widest uppercase active:scale-[0.98]"
          style={{
            background: "rgba(42,191,191,0.08)",
            border: "0.5px dashed rgba(42,191,191,0.4)",
            color: "#2abfbf",
            fontFamily: FONT_TEXT,
          }}
        >
          + Añadir bloque
        </button>
      </div>

      {error && (
        <p className="px-4 mt-4 text-xs text-center" style={{ color: "#ff8080", fontFamily: FONT_TEXT }}>
          {error}
        </p>
      )}

      {/* Bottom actions */}
      <div
        className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div
          className="w-full max-w-[430px] mx-auto px-4 pt-3 pb-3 pointer-events-auto"
          style={{
            background: "linear-gradient(to top, rgba(8,8,8,0.95) 60%, rgba(8,8,8,0))",
          }}
        >
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleGuardar}
              disabled={saving !== null}
              className="flex-1 py-3.5 rounded-2xl text-[11px] font-semibold tracking-widest uppercase active:scale-[0.98] disabled:opacity-40"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "0.5px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.85)",
                fontFamily: FONT_TEXT,
              }}
            >
              {saving === "siguiente" ? "Guardando…" : "Guardar como siguiente"}
            </button>
            <button
              type="button"
              onClick={handleEntrenarAhora}
              disabled={saving !== null}
              className="flex-1 py-3.5 rounded-2xl text-[11px] font-semibold tracking-widest uppercase active:scale-[0.98] disabled:opacity-40"
              style={{
                background: "#2abfbf",
                color: "#000",
                fontFamily: FONT_TEXT,
                boxShadow: "0 4px 24px rgba(42,191,191,0.4), inset 0 1px 0 rgba(255,255,255,0.25)",
              }}
            >
              {saving === "ahora" ? "Iniciando…" : "Entrenar ahora"}
            </button>
          </div>
        </div>
      </div>

      {showAdd && <AddBlockSheet onPick={addBlock} onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function AddBlockSheet({ onPick, onClose }: { onPick: (k: Block["kind"]) => void; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[430px] rounded-t-3xl px-5 pt-6 pb-10 space-y-3"
        style={{ background: "#0e0e0e", borderTop: "0.5px solid rgba(255,255,255,0.1)" }}
      >
        <p style={EYEBROW}>Añadir bloque</p>
        <h3
          style={{
            fontFamily: FONT_TITLE,
            fontSize: "1.5rem",
            fontWeight: 300,
            color: "rgba(255,255,255,0.95)",
            marginBottom: 12,
          }}
        >
          Tipo de bloque
        </h3>
        {(Object.keys(BLOCK_META) as Block["kind"][]).map((k) => {
          const meta = BLOCK_META[k];
          return (
            <button
              key={k}
              type="button"
              onClick={() => onPick(k)}
              className="w-full px-5 py-4 rounded-2xl flex items-center justify-between active:scale-[0.99]"
              style={{
                background: meta.bg,
                border: `0.5px solid ${meta.border}`,
                color: meta.color,
                fontFamily: FONT_TEXT,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <span>{meta.label}</span>
              <span style={{ fontSize: 16 }}>→</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
  const meta = BLOCK_META[block.kind];
  return (
    <div className="rounded-2xl px-4 py-4 space-y-4" style={GLASS}>
      <div className="flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] tracking-[0.2em] uppercase font-semibold"
          style={{
            background: meta.bg,
            border: `0.5px solid ${meta.border}`,
            color: meta.color,
            fontFamily: FONT_TEXT,
          }}
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

      <NotaAdminField value={block.nota_admin ?? ""} onChange={(v) => onChange({ nota_admin: v || null })} />
    </div>
  );
}

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
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-25 active:scale-95"
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

function NotaAdminField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p style={{ ...LABEL, marginBottom: 6 }}>Nota interna — no visible para el cliente</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder="Apuntes para ti…"
        className="w-full bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] placeholder-[#333] text-xs outline-none focus:border-[#2abfbf] transition-colors resize-none"
      />
    </div>
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

/* ============ FUERZA ============ */

function FuerzaForm({ block, onChange }: { block: FuerzaBlock; onChange: (patch: Partial<FuerzaBlock>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <p style={{ ...LABEL, marginBottom: 4 }}>Ejercicio</p>
        <div className="flex">
          <EjercicioSelector
            value={block.nombre_ejercicio}
            ejercicioId={block.ejercicio_id}
            onChange={(nombre, ejercicioId) =>
              onChange({ nombre_ejercicio: nombre, ejercicio_id: ejercicioId })
            }
          />
        </div>
      </div>
      <div className="flex gap-3">
        <NumField label="Series" value={block.series_objetivo} onChange={(v) => onChange({ series_objetivo: v ?? 0 })} />
        <NumField label="Reps" value={block.reps_objetivo} onChange={(v) => onChange({ reps_objetivo: v ?? 0 })} />
      </div>
    </div>
  );
}

/* ============ CARDIO ============ */

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
                className="py-2 rounded-lg text-[10px] tracking-[0.15em] uppercase font-semibold"
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
                className="px-3 py-2 rounded-lg text-[10px] tracking-[0.12em] uppercase font-semibold"
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
            <NumField label="Watts objetivo (opcional)" value={block.watts_objetivo} onChange={(v) => onChange({ watts_objetivo: v })} suffix="W" />
          )}
        </div>
      )}
      {block.modo === "calorias_total" && (
        <div className="flex gap-3">
          <NumField label="Calorías totales" value={block.calorias_total} onChange={(v) => onChange({ calorias_total: v })} suffix="cal" />
          <NumField label="Watts objetivo (opcional)" value={block.watts_objetivo} onChange={(v) => onChange({ watts_objetivo: v })} suffix="W" />
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
          <MinSegField
            label="Acción"
            seconds={block.duracion_accion_seg}
            onChange={(v) => onChange({ duracion_accion_seg: v })}
          />
          <MinSegField
            label="Descanso"
            seconds={block.duracion_descanso_seg}
            onChange={(v) => onChange({ duracion_descanso_seg: v })}
          />
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

function MinSegField({
  label,
  seconds,
  onChange,
}: {
  label: string;
  seconds: number | null;
  onChange: (v: number | null) => void;
}) {
  const min = seconds == null ? "" : Math.floor(seconds / 60);
  const sec = seconds == null ? "" : seconds % 60;
  function update(m: string | number, s: string | number) {
    const mNum = m === "" ? 0 : Number(m);
    const sNum = s === "" ? 0 : Number(s);
    if (m === "" && s === "") onChange(null);
    else onChange(mNum * 60 + sNum);
  }
  return (
    <div>
      <p style={{ ...LABEL, marginBottom: 4 }}>{label} (min:seg)</p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={min}
          onChange={(e) => update(e.target.value, sec)}
          placeholder="min"
          className="w-20 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] text-sm outline-none focus:border-[#2abfbf]"
        />
        <span style={{ color: "rgba(255,255,255,0.35)" }}>:</span>
        <input
          type="number"
          min={0}
          max={59}
          value={sec}
          onChange={(e) => update(min, e.target.value)}
          placeholder="seg"
          className="w-20 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] text-sm outline-none focus:border-[#2abfbf]"
        />
      </div>
    </div>
  );
}

/* ============ FUNCIONAL ============ */

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
                className="py-2 rounded-lg text-[10px] tracking-[0.15em] uppercase font-semibold"
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
          className="w-full mt-2 py-2 rounded-lg text-[10px] tracking-[0.15em] uppercase font-semibold"
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
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddEj(false);
          }}
        >
          <div
            className="w-full max-w-[430px] rounded-t-3xl px-5 pt-6 pb-10 space-y-3"
            style={{ background: "#0e0e0e", borderTop: "0.5px solid rgba(255,255,255,0.1)" }}
          >
            <p style={EYEBROW}>Añadir ejercicio</p>
            <h3
              style={{
                fontFamily: FONT_TITLE,
                fontSize: "1.4rem",
                fontWeight: 300,
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
                background: "rgba(255,128,96,0.1)",
                border: "0.5px solid rgba(255,128,96,0.35)",
                color: "#ff8060",
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
                background: "rgba(255,176,64,0.1)",
                border: "0.5px solid rgba(255,176,64,0.35)",
                color: "#ffb040",
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
  const meta = ejercicio.tipo === "fuerza" ? BLOCK_META.fuerza : BLOCK_META.cardio;
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
            onChange={(nombre, ejercicioId) =>
              onChange({ nombre_ejercicio: nombre, ejercicio_id: ejercicioId })
            }
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
                    className="py-1.5 rounded-md text-[9px] tracking-[0.15em] uppercase font-semibold"
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
