"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import WellnessCheckIn from "@/components/health/WellnessCheckIn";
import RPECapture from "@/components/health/RPECapture";
import { type Block, type CardioBlock, type FuncionalBlock, type FuerzaBlock, fromApiBlocks, tipoResumen } from "./types";

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "0.5px solid rgba(255,255,255,0.08)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)",
};

const FONT_TEXT = "Barlow Condensed, sans-serif";
const FONT_TITLE = "Cormorant Garamond, serif";

const EYEBROW: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.25em",
  textTransform: "uppercase",
  color: "rgba(42,191,191,0.7)",
  fontFamily: FONT_TEXT,
};

const LABEL: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.4)",
  fontFamily: FONT_TEXT,
};

const BLOCK_META: Record<Block["kind"], { label: string; color: string; bg: string; border: string }> = {
  fuerza: { label: "Fuerza", color: "#ff8060", bg: "rgba(255,128,96,0.1)", border: "rgba(255,128,96,0.35)" },
  cardio: { label: "Cardio", color: "#ffb040", bg: "rgba(255,176,64,0.1)", border: "rgba(255,176,64,0.35)" },
  funcional: { label: "Funcional", color: "#2abfbf", bg: "rgba(42,191,191,0.12)", border: "rgba(42,191,191,0.4)" },
};

type Phase = "loading" | "wellness" | "training" | "finalize";

type FuerzaSerie = { numero_serie: number; repeticiones: number | null; peso: number | null; completada: boolean };
type CardioRonda = {
  numero_ronda: number;
  watts: number | null;
  calorias_real: number | null;
  distancia_metros_real: number | null;
  calorias_total_real: number | null;
  completada: boolean;
};
type FuncionalReg = { kg: number | null; reps_real: number | null; calorias_real: number | null; metros_real: number | null };

interface Props {
  userId: string;
  token: string;
  entrenoId: string;
  nombre: string | null;
  blocks: Block[];
}

export default function EntrenoLive({ userId, token, entrenoId, nombre }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [sesionId, setSesionId] = useState<string | null>(null);
  const [wellnessEntryId, setWellnessEntryId] = useState<string | null>(null);
  const wellnessIdRef = useRef<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [seriesByBlock, setSeriesByBlock] = useState<Record<string, FuerzaSerie[]>>({});
  const [rondasByBlock, setRondasByBlock] = useState<Record<string, CardioRonda[]>>({});
  const [registrosByBlock, setRegistrosByBlock] = useState<Record<string, Record<string, FuncionalReg>>>({});

  const [rpe, setRpe] = useState<number | null>(null);
  const [comentario, setComentario] = useState("");
  const [duracionOverride, setDuracionOverride] = useState<number | null>(null);
  const [finalizing, setFinalizing] = useState(false);

  // Load entreno (with DB block ids) and initialize live state
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/admin/antifragil/${userId}/entrenos/${entrenoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (cancelled) return;
      if (!res.ok) {
        setError(json.error ?? "No se pudo cargar el entreno");
        return;
      }
      const loaded = fromApiBlocks(json.bloques ?? []);
      setBlocks(loaded);

      const sb: Record<string, FuerzaSerie[]> = {};
      const rb: Record<string, CardioRonda[]> = {};
      const fb: Record<string, Record<string, FuncionalReg>> = {};
      for (const b of loaded) {
        if (!b.id) continue;
        if (b.kind === "fuerza") {
          sb[b.id] = Array.from({ length: Math.max(1, b.series_objetivo) }, (_, i) => ({
            numero_serie: i + 1,
            repeticiones: null,
            peso: null,
            completada: false,
          }));
        }
        if (b.kind === "cardio") {
          const isInterval = b.modo === "intervalos_tiempo" || b.modo === "intervalos_calorias";
          const n = isInterval ? Math.max(1, b.rondas ?? 1) : 1;
          rb[b.id] = Array.from({ length: n }, (_, i) => ({
            numero_ronda: i + 1,
            watts: null,
            calorias_real: null,
            distancia_metros_real: null,
            calorias_total_real: null,
            completada: false,
          }));
        }
        if (b.kind === "funcional") {
          const map: Record<string, FuncionalReg> = {};
          for (const ej of b.ejercicios) {
            if (!ej.id) continue;
            map[ej.id] = { kg: null, reps_real: null, calorias_real: null, metros_real: null };
          }
          fb[b.id] = map;
        }
      }
      setSeriesByBlock(sb);
      setRondasByBlock(rb);
      setRegistrosByBlock(fb);
      setPhase("wellness");
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, token, entrenoId]);

  async function startSession(wellnessId: string | null) {
    const res = await fetch(`/api/admin/antifragil/${userId}/sesiones`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ entreno_id: entrenoId, wellness_entry_id: wellnessId }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "No se pudo iniciar la sesión");
      return;
    }
    setSesionId(json.id);
    setStartedAt(Date.now());
    setPhase("training");
  }

  async function submitWellness(answers: { sueno: number; fatiga: number; estres: number; animo: number; dolor: number; omitido: boolean }) {
    const res = await fetch(`/api/admin/antifragil/${userId}/wellness`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(answers),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error ?? "Error" };
    wellnessIdRef.current = json.id;
    setWellnessEntryId(json.id);
    return { ok: true };
  }

  async function handleWellnessComplete() {
    await startSession(wellnessIdRef.current);
  }
  async function handleWellnessSkip() {
    await startSession(wellnessIdRef.current);
  }

  const computedDuracion = useMemo(() => {
    if (duracionOverride != null) return duracionOverride;
    if (startedAt == null) return 0;
    return Math.max(1, Math.round((Date.now() - startedAt) / 60000));
  }, [duracionOverride, startedAt, phase]);

  async function handleFinalize() {
    if (!sesionId) return;
    setFinalizing(true);
    setError(null);

    const seriesFuerza = Object.entries(seriesByBlock).flatMap(([bloqueId, arr]) =>
      arr.map((s) => ({
        bloque_id: bloqueId,
        numero_serie: s.numero_serie,
        repeticiones: s.repeticiones,
        peso: s.peso,
        completada: s.completada,
      }))
    );
    const seriesCardio = Object.entries(rondasByBlock).flatMap(([bloqueId, arr]) =>
      arr.map((r) => ({
        bloque_id: bloqueId,
        numero_ronda: r.numero_ronda,
        watts: r.watts,
        calorias_real: r.calorias_real,
        distancia_metros_real: r.distancia_metros_real,
        calorias_total_real: r.calorias_total_real,
        completada: r.completada,
      }))
    );
    const registrosFuncional = Object.entries(registrosByBlock).flatMap(([_, ejMap]) =>
      Object.entries(ejMap).map(([ejId, r]) => ({
        ejercicio_funcional_id: ejId,
        kg: r.kg,
        reps_real: r.reps_real,
        calorias_real: r.calorias_real,
        metros_real: r.metros_real,
      }))
    );

    const res = await fetch(`/api/admin/antifragil/${userId}/sesiones/${sesionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        rpe,
        comentario: comentario.trim() || null,
        duracion_minutos: computedDuracion,
        tipo_resumen: tipoResumen(blocks),
        wellness_entry_id: wellnessEntryId,
        series_fuerza: seriesFuerza,
        series_cardio: seriesCardio,
        registros_funcional: registrosFuncional,
      }),
    });
    const json = await res.json();
    setFinalizing(false);
    if (!res.ok) {
      setError(json.error ?? "No se pudo guardar la sesión");
      return;
    }
    router.push(`/admin/antifragil/${userId}`);
  }

  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080808" }}>
        <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (phase === "wellness") {
    return (
      <WellnessCheckIn
        onComplete={handleWellnessComplete}
        onSkip={handleWellnessSkip}
        ctaLabel="Continuar"
        onSubmit={submitWellness}
      />
    );
  }

  if (phase === "training") {
    return (
      <div className="min-h-screen pb-32" style={{ background: "#080808" }}>
        <div className="px-5 pt-14 pb-6">
          <p style={EYEBROW}>Entrenando ahora</p>
          <h1
            className="mt-0.5 truncate"
            style={{ fontFamily: FONT_TITLE, fontSize: "1.75rem", fontWeight: 300, lineHeight: 1.1, color: "rgba(255,255,255,0.95)" }}
          >
            {nombre || "Sin nombre"}
          </h1>
        </div>

        <div className="px-4 space-y-3">
          {blocks.map((b, idx) => (
            <BlockTrainer
              key={b.uid}
              block={b}
              index={idx}
              fuerzaSeries={b.kind === "fuerza" && b.id ? seriesByBlock[b.id] : undefined}
              cardioRondas={b.kind === "cardio" && b.id ? rondasByBlock[b.id] : undefined}
              funcionalRegs={b.kind === "funcional" && b.id ? registrosByBlock[b.id] : undefined}
              onFuerzaUpdate={(i, patch) => {
                if (!b.id) return;
                setSeriesByBlock((prev) => {
                  const arr = [...(prev[b.id!] ?? [])];
                  arr[i] = { ...arr[i], ...patch };
                  return { ...prev, [b.id!]: arr };
                });
              }}
              onCardioUpdate={(i, patch) => {
                if (!b.id) return;
                setRondasByBlock((prev) => {
                  const arr = [...(prev[b.id!] ?? [])];
                  arr[i] = { ...arr[i], ...patch };
                  return { ...prev, [b.id!]: arr };
                });
              }}
              onFuncionalUpdate={(ejId, patch) => {
                if (!b.id) return;
                setRegistrosByBlock((prev) => {
                  const blockRegs = { ...(prev[b.id!] ?? {}) };
                  blockRegs[ejId] = { ...(blockRegs[ejId] ?? { kg: null, reps_real: null, calorias_real: null, metros_real: null }), ...patch };
                  return { ...prev, [b.id!]: blockRegs };
                });
              }}
            />
          ))}
        </div>

        {error && (
          <p className="px-4 mt-4 text-xs text-center" style={{ color: "#ff8080", fontFamily: FONT_TEXT }}>
            {error}
          </p>
        )}

        <div
          className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div
            className="w-full max-w-[430px] mx-auto px-4 pt-3 pb-3 pointer-events-auto"
            style={{ background: "linear-gradient(to top, rgba(8,8,8,0.95) 60%, rgba(8,8,8,0))" }}
          >
            <button
              type="button"
              onClick={() => setPhase("finalize")}
              className="w-full py-4 rounded-2xl text-sm font-semibold tracking-widest uppercase active:scale-[0.98]"
              style={{
                background: "#2abfbf",
                color: "#000",
                fontFamily: FONT_TEXT,
                boxShadow: "0 4px 24px rgba(42,191,191,0.4), inset 0 1px 0 rgba(255,255,255,0.25)",
              }}
            >
              Finalizar entrenamiento
            </button>
          </div>
        </div>
      </div>
    );
  }

  // finalize
  return (
    <div className="min-h-screen pb-32" style={{ background: "#080808" }}>
      <div className="px-5 pt-14 pb-6">
        <p style={EYEBROW}>Finalizar</p>
        <h1
          className="mt-0.5"
          style={{ fontFamily: FONT_TITLE, fontSize: "1.75rem", fontWeight: 300, lineHeight: 1.1, color: "rgba(255,255,255,0.95)" }}
        >
          ¿Cómo ha ido?
        </h1>
      </div>

      <div className="px-4 space-y-4">
        <RPECapture rpe={rpe} onRpeChange={setRpe} />

        <div className="rounded-2xl px-4 py-4 space-y-3" style={GLASS}>
          <p style={LABEL}>Duración (minutos)</p>
          <input
            type="number"
            min={1}
            value={duracionOverride ?? computedDuracion}
            onChange={(e) => setDuracionOverride(e.target.value === "" ? null : Number(e.target.value))}
            className="w-full bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] text-sm outline-none focus:border-[#2abfbf]"
          />
        </div>

        <div className="rounded-2xl px-4 py-4 space-y-2" style={GLASS}>
          <p style={LABEL}>Comentario (opcional)</p>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={3}
            placeholder="Cómo se ha sentido el cliente, observaciones…"
            className="w-full bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] placeholder-[#333] text-xs outline-none focus:border-[#2abfbf] resize-none"
          />
        </div>

        {error && (
          <p className="text-xs text-center" style={{ color: "#ff8080", fontFamily: FONT_TEXT }}>
            {error}
          </p>
        )}
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div
          className="w-full max-w-[430px] mx-auto px-4 pt-3 pb-3 pointer-events-auto"
          style={{ background: "linear-gradient(to top, rgba(8,8,8,0.95) 60%, rgba(8,8,8,0))" }}
        >
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPhase("training")}
              className="flex-1 py-3.5 rounded-2xl text-[11px] font-semibold tracking-widest uppercase active:scale-[0.98]"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "0.5px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.85)",
                fontFamily: FONT_TEXT,
              }}
            >
              Volver
            </button>
            <button
              type="button"
              onClick={handleFinalize}
              disabled={finalizing}
              className="flex-1 py-3.5 rounded-2xl text-[11px] font-semibold tracking-widest uppercase active:scale-[0.98] disabled:opacity-40"
              style={{
                background: "#2abfbf",
                color: "#000",
                fontFamily: FONT_TEXT,
                boxShadow: "0 4px 24px rgba(42,191,191,0.4)",
              }}
            >
              {finalizing ? "Guardando…" : "Guardar sesión"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotaAdminBlock({ nota }: { nota: string | null }) {
  if (!nota) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 flex items-start gap-2"
      style={{
        background: "rgba(255,200,80,0.06)",
        border: "0.5px solid rgba(255,200,80,0.2)",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
        <path d="M12 17v-6m0-3.5v-.01M12 22a10 10 0 110-20 10 10 0 010 20z" stroke="#ffc850" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <div className="flex-1">
        <p style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,200,80,0.7)", fontFamily: FONT_TEXT, marginBottom: 2 }}>
          Nota interna · admin
        </p>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: FONT_TEXT, lineHeight: 1.4, whiteSpace: "pre-wrap" }}>{nota}</p>
      </div>
    </div>
  );
}

function BlockTrainer({
  block,
  index,
  fuerzaSeries,
  cardioRondas,
  funcionalRegs,
  onFuerzaUpdate,
  onCardioUpdate,
  onFuncionalUpdate,
}: {
  block: Block;
  index: number;
  fuerzaSeries?: FuerzaSerie[];
  cardioRondas?: CardioRonda[];
  funcionalRegs?: Record<string, FuncionalReg>;
  onFuerzaUpdate: (i: number, patch: Partial<FuerzaSerie>) => void;
  onCardioUpdate: (i: number, patch: Partial<CardioRonda>) => void;
  onFuncionalUpdate: (ejId: string, patch: Partial<FuncionalReg>) => void;
}) {
  const meta = BLOCK_META[block.kind];
  return (
    <div className="rounded-2xl px-4 py-4 space-y-3" style={GLASS}>
      <div className="flex items-center justify-between">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-[9px] tracking-[0.2em] uppercase font-semibold"
          style={{ background: meta.bg, border: `0.5px solid ${meta.border}`, color: meta.color, fontFamily: FONT_TEXT }}
        >
          {index + 1}. {meta.label}
        </span>
        {block.nombre && (
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.7)", fontFamily: FONT_TEXT }}>
            {block.nombre}
          </span>
        )}
      </div>

      <NotaAdminBlock nota={block.nota_admin} />

      {block.kind === "fuerza" && (
        <FuerzaTrainer block={block as FuerzaBlock} series={fuerzaSeries ?? []} onUpdate={onFuerzaUpdate} />
      )}
      {block.kind === "cardio" && (
        <CardioTrainer block={block as CardioBlock} rondas={cardioRondas ?? []} onUpdate={onCardioUpdate} />
      )}
      {block.kind === "funcional" && (
        <FuncionalTrainer block={block as FuncionalBlock} regs={funcionalRegs ?? {}} onUpdate={onFuncionalUpdate} />
      )}
    </div>
  );
}

function FuerzaTrainer({
  block,
  series,
  onUpdate,
}: {
  block: FuerzaBlock;
  series: FuerzaSerie[];
  onUpdate: (i: number, patch: Partial<FuerzaSerie>) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.85)", fontFamily: FONT_TEXT }}>
        {block.nombre_ejercicio || "—"}
        <span style={{ color: "rgba(255,255,255,0.4)" }}>
          {"  ·  "}
          {block.series_objetivo} × {block.reps_objetivo}
        </span>
      </p>
      <div className="space-y-1.5">
        {series.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-6 text-[10px] tracking-wider" style={{ color: "rgba(255,255,255,0.35)", fontFamily: FONT_TEXT }}>
              {s.numero_serie}.
            </span>
            <input
              type="number"
              placeholder={`${block.reps_objetivo} reps`}
              value={s.repeticiones ?? ""}
              onChange={(e) => onUpdate(i, { repeticiones: e.target.value === "" ? null : Number(e.target.value) })}
              className="flex-1 min-w-0 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] text-sm outline-none focus:border-[#2abfbf]"
            />
            <input
              type="number"
              step="0.5"
              placeholder="kg"
              value={s.peso ?? ""}
              onChange={(e) => onUpdate(i, { peso: e.target.value === "" ? null : Number(e.target.value) })}
              className="w-20 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] text-sm outline-none focus:border-[#2abfbf]"
            />
            <button
              type="button"
              onClick={() => onUpdate(i, { completada: !s.completada })}
              aria-label="Marcar completada"
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{
                background: s.completada ? "rgba(42,191,191,0.18)" : "rgba(255,255,255,0.04)",
                border: `0.5px solid ${s.completada ? "rgba(42,191,191,0.5)" : "rgba(255,255,255,0.1)"}`,
                color: s.completada ? "#2abfbf" : "rgba(255,255,255,0.4)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l5 5L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardioTrainer({
  block,
  rondas,
  onUpdate,
}: {
  block: CardioBlock;
  rondas: CardioRonda[];
  onUpdate: (i: number, patch: Partial<CardioRonda>) => void;
}) {
  const isInterval = block.modo === "intervalos_tiempo" || block.modo === "intervalos_calorias";

  return (
    <div className="space-y-2">
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.85)", fontFamily: FONT_TEXT }}>
        {capital(block.maquina)} · {modoLabel(block.modo)}
      </p>
      <CardioObjetivo block={block} />

      {!isInterval && (
        <div className="flex items-center gap-2">
          {(block.modo === "distancia" || block.modo === "distancia_total") && (
            <input
              type="number"
              placeholder="distancia real (m)"
              value={rondas[0]?.distancia_metros_real ?? ""}
              onChange={(e) => onUpdate(0, { distancia_metros_real: e.target.value === "" ? null : Number(e.target.value), completada: true })}
              className="flex-1 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] text-sm outline-none focus:border-[#2abfbf]"
            />
          )}
          {block.modo === "calorias_total" && (
            <input
              type="number"
              placeholder="calorías reales"
              value={rondas[0]?.calorias_total_real ?? ""}
              onChange={(e) => onUpdate(0, { calorias_total_real: e.target.value === "" ? null : Number(e.target.value), completada: true })}
              className="flex-1 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] text-sm outline-none focus:border-[#2abfbf]"
            />
          )}
          <input
            type="number"
            placeholder="W"
            value={rondas[0]?.watts ?? ""}
            onChange={(e) => onUpdate(0, { watts: e.target.value === "" ? null : Number(e.target.value) })}
            className="w-20 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] text-sm outline-none focus:border-[#2abfbf]"
          />
        </div>
      )}

      {isInterval &&
        rondas.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-8 text-[10px] tracking-wider" style={{ color: "rgba(255,255,255,0.35)", fontFamily: FONT_TEXT }}>
              R{r.numero_ronda}
            </span>
            <input
              type="number"
              placeholder="cal"
              value={r.calorias_real ?? ""}
              onChange={(e) => onUpdate(i, { calorias_real: e.target.value === "" ? null : Number(e.target.value) })}
              className="flex-1 min-w-0 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] text-sm outline-none focus:border-[#2abfbf]"
            />
            <input
              type="number"
              placeholder="W"
              value={r.watts ?? ""}
              onChange={(e) => onUpdate(i, { watts: e.target.value === "" ? null : Number(e.target.value) })}
              className="w-20 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] text-sm outline-none focus:border-[#2abfbf]"
            />
            <button
              type="button"
              onClick={() => onUpdate(i, { completada: !r.completada })}
              aria-label="Marcar completada"
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{
                background: r.completada ? "rgba(42,191,191,0.18)" : "rgba(255,255,255,0.04)",
                border: `0.5px solid ${r.completada ? "rgba(42,191,191,0.5)" : "rgba(255,255,255,0.1)"}`,
                color: r.completada ? "#2abfbf" : "rgba(255,255,255,0.4)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l5 5L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        ))}
    </div>
  );
}

function CardioObjetivo({ block }: { block: CardioBlock }) {
  const parts: string[] = [];
  if (block.modo === "distancia" || block.modo === "distancia_total") {
    if (block.distancia_metros) parts.push(`${block.distancia_metros}m`);
  }
  if (block.modo === "calorias_total" && block.calorias_total) parts.push(`${block.calorias_total} cal`);
  if (block.rondas) parts.push(`${block.rondas} rondas`);
  if (block.duracion_accion_seg) parts.push(`${formatSec(block.duracion_accion_seg)} acción`);
  if (block.duracion_descanso_seg) parts.push(`${formatSec(block.duracion_descanso_seg)} descanso`);
  if (block.calorias_por_ronda) parts.push(`${block.calorias_por_ronda} cal/ronda`);
  if (block.watts_objetivo) parts.push(`${block.watts_objetivo}W`);
  if (parts.length === 0) return null;
  return (
    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: FONT_TEXT, letterSpacing: "0.02em" }}>
      Objetivo: {parts.join(" · ")}
    </p>
  );
}

function FuncionalTrainer({
  block,
  regs,
  onUpdate,
}: {
  block: FuncionalBlock;
  regs: Record<string, FuncionalReg>;
  onUpdate: (ejId: string, patch: Partial<FuncionalReg>) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.85)", fontFamily: FONT_TEXT }}>
        {formatoLabel(block.formato)} · {block.tiempo_minutos} min
        {block.formato === "tabata" && block.duracion_accion_seg != null && block.duracion_descanso_seg != null && (
          <span style={{ color: "rgba(255,255,255,0.4)" }}>
            {"  ·  "}
            {block.duracion_accion_seg}s / {block.duracion_descanso_seg}s
          </span>
        )}
      </p>
      <div className="space-y-2">
        {block.ejercicios.map((ej, i) => {
          const reg = (ej.id && regs[ej.id]) || { kg: null, reps_real: null, calorias_real: null, metros_real: null };
          return (
            <div
              key={ej.uid}
              className="rounded-lg px-3 py-2.5 space-y-2"
              style={{ background: "rgba(255,255,255,0.025)", border: "0.5px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] tracking-wider" style={{ color: "rgba(255,255,255,0.5)", fontFamily: FONT_TEXT }}>
                  {i + 1}. {ej.tipo === "fuerza" ? ej.nombre_ejercicio || "—" : `${capital(ej.maquina ?? "")}`}
                </span>
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)", fontFamily: FONT_TEXT }}>
                  {ej.tipo === "fuerza"
                    ? ej.reps_objetivo
                      ? `${ej.reps_objetivo} reps`
                      : ""
                    : ej.calorias_objetivo
                    ? `${ej.calorias_objetivo} cal`
                    : ej.metros_objetivo
                    ? `${ej.metros_objetivo}m`
                    : ""}
                </span>
              </div>
              {ej.id && (
                <div className="flex items-center gap-2">
                  {ej.tipo === "fuerza" ? (
                    <>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="kg"
                        value={reg.kg ?? ""}
                        onChange={(e) => onUpdate(ej.id!, { kg: e.target.value === "" ? null : Number(e.target.value) })}
                        className="w-20 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] text-sm outline-none focus:border-[#2abfbf]"
                      />
                      <input
                        type="number"
                        placeholder="reps real"
                        value={reg.reps_real ?? ""}
                        onChange={(e) => onUpdate(ej.id!, { reps_real: e.target.value === "" ? null : Number(e.target.value) })}
                        className="flex-1 min-w-0 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] text-sm outline-none focus:border-[#2abfbf]"
                      />
                    </>
                  ) : (
                    <>
                      <input
                        type="number"
                        placeholder="cal real"
                        value={reg.calorias_real ?? ""}
                        onChange={(e) => onUpdate(ej.id!, { calorias_real: e.target.value === "" ? null : Number(e.target.value) })}
                        className="flex-1 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] text-sm outline-none focus:border-[#2abfbf]"
                      />
                      <input
                        type="number"
                        placeholder="m real"
                        value={reg.metros_real ?? ""}
                        onChange={(e) => onUpdate(ej.id!, { metros_real: e.target.value === "" ? null : Number(e.target.value) })}
                        className="flex-1 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] text-sm outline-none focus:border-[#2abfbf]"
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function capital(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function modoLabel(m: CardioBlock["modo"]): string {
  switch (m) {
    case "distancia":
      return "Distancia";
    case "distancia_total":
      return "Distancia total";
    case "calorias_total":
      return "Calorías totales";
    case "intervalos_tiempo":
      return "Intervalos por tiempo";
    case "intervalos_calorias":
      return "Intervalos por calorías";
  }
}

function formatoLabel(f: FuncionalBlock["formato"]): string {
  switch (f) {
    case "for_time":
      return "For time";
    case "amrap":
      return "AMRAP";
    case "emom":
      return "EMOM";
    case "tabata":
      return "Tabata";
  }
}

function formatSec(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m === 0) return `${sec}s`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}
