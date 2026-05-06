"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import WellnessCheckIn from "@/components/health/WellnessCheckIn";
import RPECapture from "@/components/health/RPECapture";
import EjercicioSelector from "@/components/EjercicioSelector";
import { type Block, type CardioBlock, type FuncionalBlock, type FuerzaBlock, fromApiBlocks, makeCardio, makeFuerza, makeFuncional, tipoResumen, toApiBlocks } from "./types";
import { AddBlockSheet } from "./EntrenoBuilder";

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "0.5px solid rgba(255,255,255,0.08)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)",
};

const FONT_TEXT = "var(--font-ui)";
const FONT_TITLE = "var(--font-serif)";

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

type Phase = "loading" | "wellness-gate" | "wellness-form" | "training" | "finalize";

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

export default function EntrenoLive({ userId, token, entrenoId, nombre: nombreProp }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [nombre, setNombre] = useState<string | null>(nombreProp);
  const [sesionId, setSesionId] = useState<string | null>(null);
  const [wellnessEntryId, setWellnessEntryId] = useState<string | null>(null);
  const wellnessIdRef = useRef<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cliente Supabase estable para refrescar el access_token en cada
  // request — el `token` que llega como prop se captura UNA vez al montar
  // y caduca a la hora; sin esto, los fetches a las APIs admin empiezan
  // a devolver 403 "No autorizado" mientras la pantalla sigue abierta.
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );
  const getToken = useCallback(async (): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? token;
  }, [supabase, token]);

  const [seriesByEjercicio, setSeriesByEjercicio] = useState<Record<string, FuerzaSerie[]>>({});
  const [rondasByBlock, setRondasByBlock] = useState<Record<string, CardioRonda[]>>({});
  const [registrosByBlock, setRegistrosByBlock] = useState<Record<string, Record<string, FuncionalReg>>>({});
  // Histórico "Última vez" del cliente por ejercicio (catalog_id) —
  // combina series_realizadas (cliente solo) + series_fuerza_antifragil
  // (entrenos guiados) y se queda con el día más reciente.
  const [historico, setHistorico] = useState<Record<string, { serie: number; peso: number | null; reps: number | null }[]>>({});

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [draftBlock, setDraftBlock] = useState<Block | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);

  const [rpe, setRpe] = useState<number | null>(null);
  const [comentario, setComentario] = useState("");
  const [duracionStr, setDuracionStr] = useState<string>("");
  const [finalizing, setFinalizing] = useState(false);

  function applyLoadedBlocks(loaded: Block[]) {
    setBlocks(loaded);
    // Initialize empty arrays only for new ejercicios/blocks. Don't pre-fill —
    // user adds rows via "+ Serie" / "+ Ronda" as they train.
    setSeriesByEjercicio((prev) => {
      const next = { ...prev };
      for (const b of loaded) {
        if (b.kind !== "fuerza") continue;
        for (const ej of b.ejercicios) {
          if (!ej.id || next[ej.id]) continue;
          next[ej.id] = [];
        }
      }
      return next;
    });
    setRondasByBlock((prev) => {
      const next = { ...prev };
      for (const b of loaded) {
        if (b.kind !== "cardio" || !b.id || next[b.id]) continue;
        const isInterval = b.modo === "intervalos_tiempo" || b.modo === "intervalos_calorias";
        // Total modes: single fixed row. Interval modes: empty, user adds rondas.
        if (isInterval) {
          next[b.id] = [];
        } else {
          next[b.id] = [
            {
              numero_ronda: 1,
              watts: null,
              calorias_real: null,
              distancia_metros_real: null,
              calorias_total_real: null,
              completada: false,
            },
          ];
        }
      }
      return next;
    });
    setRegistrosByBlock((prev) => {
      const next = { ...prev };
      for (const b of loaded) {
        if (b.kind !== "funcional" || !b.id || next[b.id]) continue;
        const map: Record<string, FuncionalReg> = {};
        for (const ej of b.ejercicios) {
          if (!ej.id) continue;
          map[ej.id] = { kg: null, reps_real: null, calorias_real: null, metros_real: null };
        }
        next[b.id] = map;
      }
      return next;
    });
  }

  function addSerie(ejercicioId: string) {
    setSeriesByEjercicio((prev) => {
      const arr = prev[ejercicioId] ?? [];
      const next: FuerzaSerie = {
        numero_serie: arr.length + 1,
        repeticiones: null,
        peso: null,
        completada: true,
      };
      return { ...prev, [ejercicioId]: [...arr, next] };
    });
  }
  function removeSerie(ejercicioId: string, idx: number) {
    setSeriesByEjercicio((prev) => {
      const arr = (prev[ejercicioId] ?? []).filter((_, i) => i !== idx).map((s, i) => ({ ...s, numero_serie: i + 1 }));
      return { ...prev, [ejercicioId]: arr };
    });
  }
  function addRonda(bloqueId: string) {
    setRondasByBlock((prev) => {
      const arr = prev[bloqueId] ?? [];
      const next: CardioRonda = {
        numero_ronda: arr.length + 1,
        watts: null,
        calorias_real: null,
        distancia_metros_real: null,
        calorias_total_real: null,
        completada: true,
      };
      return { ...prev, [bloqueId]: [...arr, next] };
    });
  }
  function removeRonda(bloqueId: string, idx: number) {
    setRondasByBlock((prev) => {
      const arr = (prev[bloqueId] ?? []).filter((_, i) => i !== idx).map((r, i) => ({ ...r, numero_ronda: i + 1 }));
      return { ...prev, [bloqueId]: arr };
    });
  }

  async function addEjercicioFuerza(bloqueId: string, payload: { ejercicio_id: string | null; nombre_ejercicio: string; series_objetivo: number; reps_objetivo: number }) {
    const res = await fetch(
      `/api/admin/antifragil/${userId}/entrenos/${entrenoId}/bloques/${bloqueId}/ejercicios-fuerza`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getToken()}` },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "No se pudo añadir el ejercicio");
      return;
    }
    await reloadBlocks();
  }

  async function addEjercicioFuncional(
    bloqueId: string,
    payload: {
      tipo: "fuerza" | "cardio";
      ejercicio_id: string | null;
      nombre_ejercicio: string | null;
      reps_objetivo: number | null;
      maquina: "carrera" | "bici" | "ski" | "remo" | null;
      calorias_objetivo: number | null;
      metros_objetivo: number | null;
    }
  ) {
    const res = await fetch(
      `/api/admin/antifragil/${userId}/entrenos/${entrenoId}/bloques/${bloqueId}/ejercicios-funcional`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getToken()}` },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "No se pudo añadir el ejercicio");
      return;
    }
    await reloadBlocks();
  }

  async function reloadBlocks() {
    const res = await fetch(`/api/admin/antifragil/${userId}/entrenos/${entrenoId}`, {
      headers: { Authorization: `Bearer ${await getToken()}` },
    });
    const json = await res.json();
    if (res.ok) applyLoadedBlocks(fromApiBlocks(json.bloques ?? []));
  }

  async function persistBlock(block: Block): Promise<boolean> {
    const [apiBlock] = toApiBlocks([block]);
    const res = await fetch(`/api/admin/antifragil/${userId}/entrenos/${entrenoId}/bloques`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getToken()}` },
      body: JSON.stringify({ bloque: apiBlock }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      console.error("[Antifrágil] persistBlock failed", { status: res.status, body: j });
      setError(j.error ?? "No se pudo guardar el bloque");
      return false;
    }
    await reloadBlocks();
    return true;
  }

  async function startAddingBlock(kind: Block["kind"]) {
    setShowAddSheet(false);
    if (kind === "fuerza") {
      // Live mode: skip creator-style configurator. Persist empty fuerza block
      // (no ejercicios) so the registration UI shows just "+ Ejercicio" and
      // the admin picks ejercicios from the catalog one by one.
      setSavingDraft(true);
      const empty = { ...makeFuerza(blocks.length), ejercicios: [] };
      await persistBlock(empty);
      setSavingDraft(false);
      return;
    }
    // Cardio / funcional require structural fields (maquina+modo / formato+tiempo)
    // before the registration UI can render. Show a minimal inline editor.
    if (kind === "cardio") setDraftBlock(makeCardio(blocks.length));
    if (kind === "funcional") setDraftBlock(makeFuncional(blocks.length));
  }

  async function saveDraftBlock() {
    if (!draftBlock) return;
    setSavingDraft(true);
    const ok = await persistBlock(draftBlock);
    setSavingDraft(false);
    if (ok) setDraftBlock(null);
  }

  // Load entreno (with DB block ids) and initialize live state
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/antifragil/${userId}/entrenos/${entrenoId}`, {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          console.error("[Antifrágil] Load entreno failed", { status: res.status, body: json });
          setError(json.error ?? `No se pudo cargar el entreno (HTTP ${res.status})`);
          return;
        }
        const loaded = fromApiBlocks(json.bloques ?? []);
        applyLoadedBlocks(loaded);
        if (json.entreno?.nombre !== undefined) setNombre(json.entreno.nombre);
        setPhase("wellness-gate");
      } catch (err: any) {
        if (cancelled) return;
        console.error("[Antifrágil] Load entreno threw", err);
        setError(err?.message ?? "Error de red al cargar el entreno");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, token, entrenoId]);

  // Carga "Última vez" del cliente para los catalog_ids de los ejercicios
  // de fuerza visibles. Mira tanto series_realizadas (entrenos del cliente
  // solo) como series_fuerza_antifragil (entrenos guiados por admin),
  // se queda con la sesión más reciente por catálogo.
  useEffect(() => {
    const catalogIds = Array.from(
      new Set(
        blocks
          .filter((b): b is FuerzaBlock => b.kind === "fuerza")
          .flatMap((b) => b.ejercicios.map((e) => e.ejercicio_id))
          .filter((id): id is string => !!id && !(id in historico))
      )
    );
    if (catalogIds.length === 0) return;

    let cancelled = false;
    (async () => {
      const [srRes, sfaRes] = await Promise.all([
        supabase
          .from("series_realizadas")
          .select("numero_serie, peso, repeticiones, ejercicio_catalogo_id, sesion_id, sesiones!inner(user_id, fecha)")
          .eq("sesiones.user_id", userId)
          .in("ejercicio_catalogo_id", catalogIds)
          .limit(500),
        supabase
          .from("series_fuerza_antifragil")
          .select("numero_serie, peso, repeticiones, ejercicio_fuerza_id, sesion_id, sesiones_antifragil!inner(user_id, fecha), ejercicios_fuerza!inner(ejercicio_id)")
          .eq("sesiones_antifragil.user_id", userId)
          .in("ejercicios_fuerza.ejercicio_id", catalogIds)
          .limit(500),
      ]);
      if (cancelled) return;

      type Row = { catId: string; sesionKey: string; fecha: string; serie: number; peso: number | null; reps: number | null };
      const rows: Row[] = [];

      for (const r of (srRes.data ?? []) as any[]) {
        const ses = Array.isArray(r.sesiones) ? r.sesiones[0] : r.sesiones;
        if (!r.ejercicio_catalogo_id || !ses?.fecha) continue;
        rows.push({
          catId: r.ejercicio_catalogo_id,
          sesionKey: `r:${r.sesion_id}`,
          fecha: ses.fecha,
          serie: r.numero_serie,
          peso: r.peso,
          reps: r.repeticiones,
        });
      }
      for (const r of (sfaRes.data ?? []) as any[]) {
        const ses = Array.isArray(r.sesiones_antifragil) ? r.sesiones_antifragil[0] : r.sesiones_antifragil;
        const ef = Array.isArray(r.ejercicios_fuerza) ? r.ejercicios_fuerza[0] : r.ejercicios_fuerza;
        if (!ef?.ejercicio_id || !ses?.fecha) continue;
        rows.push({
          catId: ef.ejercicio_id,
          sesionKey: `a:${r.sesion_id}`,
          fecha: ses.fecha,
          serie: r.numero_serie,
          peso: r.peso,
          reps: r.repeticiones,
        });
      }

      const result: Record<string, { serie: number; peso: number | null; reps: number | null }[]> = {};
      for (const id of catalogIds) result[id] = [];
      const byCat = new Map<string, Row[]>();
      for (const r of rows) {
        if (!byCat.has(r.catId)) byCat.set(r.catId, []);
        byCat.get(r.catId)!.push(r);
      }
      for (const [catId, arr] of byCat) {
        arr.sort((a, b) => (a.fecha === b.fecha ? a.serie - b.serie : a.fecha < b.fecha ? 1 : -1));
        const latestKey = arr[0]?.sesionKey;
        if (!latestKey) continue;
        result[catId] = arr
          .filter((r) => r.sesionKey === latestKey)
          .map((r) => ({ serie: r.serie, peso: r.peso, reps: r.reps }))
          .sort((a, b) => a.serie - b.serie);
      }
      setHistorico((prev) => ({ ...prev, ...result }));
    })();

    return () => {
      cancelled = true;
    };
  }, [blocks, userId, supabase, historico]);

  async function startSession(wellnessId: string | null) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/antifragil/${userId}/sesiones`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getToken()}` },
        body: JSON.stringify({ entreno_id: entrenoId, wellness_entry_id: wellnessId }),
      });
      const json = await res.json();
      if (!res.ok) {
        console.error("[Antifrágil] startSession failed", { status: res.status, body: json });
        setError(json.error ?? `No se pudo iniciar la sesión (HTTP ${res.status})`);
        return;
      }
      setSesionId(json.id);
      setStartedAt(Date.now());
      setPhase("training");
    } catch (err: any) {
      console.error("[Antifrágil] startSession threw", err);
      setError(err?.message ?? "Error de red al iniciar la sesión");
    }
  }

  async function submitWellness(answers: { sueno: number; fatiga: number; estres: number; animo: number; dolor: number; omitido: boolean }) {
    const res = await fetch(`/api/admin/antifragil/${userId}/wellness`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getToken()}` },
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
    if (startedAt == null) return 0;
    return Math.max(1, Math.round((Date.now() - startedAt) / 60000));
  }, [startedAt, phase]);

  // Pre-fill duracionStr from auto-computed when entering finalize phase.
  useEffect(() => {
    if (phase === "finalize") {
      setDuracionStr(String(computedDuracion));
    }
  }, [phase]);

  async function handleFinalize() {
    if (!sesionId) {
      setError("La sesión no se inicializó. Vuelve atrás y reinicia el entreno.");
      return;
    }
    setFinalizing(true);
    setError(null);

    const ejercicioToBloque = new Map<string, string>();
    for (const b of blocks) {
      if (b.kind !== "fuerza" || !b.id) continue;
      for (const ej of b.ejercicios) {
        if (ej.id) ejercicioToBloque.set(ej.id, b.id);
      }
    }
    const seriesFuerza = Object.entries(seriesByEjercicio).flatMap(([ejercicioId, arr]) =>
      arr.map((s) => ({
        bloque_id: ejercicioToBloque.get(ejercicioId) ?? null,
        ejercicio_fuerza_id: ejercicioId,
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

    try {
      const duracionFinal = duracionStr.trim() === "" ? computedDuracion : Number(duracionStr);
      const res = await fetch(`/api/admin/antifragil/${userId}/sesiones/${sesionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getToken()}` },
        body: JSON.stringify({
          rpe,
          comentario: comentario.trim() || null,
          duracion_minutos: Number.isFinite(duracionFinal) && duracionFinal > 0 ? duracionFinal : null,
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
        console.error("[Antifrágil] handleFinalize failed", { status: res.status, body: json });
        setError(json.error ?? `No se pudo guardar la sesión (HTTP ${res.status})`);
        return;
      }
      router.push(`/admin/antifragil/${userId}`);
    } catch (err: any) {
      setFinalizing(false);
      console.error("[Antifrágil] handleFinalize threw", err);
      setError(err?.message ?? "Error de red al guardar la sesión");
    }
  }

  if (phase === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#080808" }}>
        {error ? (
          <div className="rounded-2xl px-5 py-6 max-w-sm text-center space-y-3" style={GLASS}>
            <p style={{ ...EYEBROW, color: "rgba(255,128,128,0.7)" }}>Error al cargar</p>
            <p className="text-xs" style={{ color: "rgba(255,128,128,0.85)", fontFamily: FONT_TEXT, lineHeight: 1.5 }}>
              {error}
            </p>
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full py-2 rounded-lg text-[10px] tracking-[0.15em] uppercase font-semibold"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "0.5px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.7)",
                fontFamily: FONT_TEXT,
              }}
            >
              Volver
            </button>
          </div>
        ) : (
          <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    );
  }

  if (phase === "wellness-gate") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#080808" }}>
        <div className="px-5 pt-14 pb-6">
          <p style={EYEBROW}>Antes de empezar</p>
          <h1 className="mt-0.5" style={{ fontFamily: FONT_TITLE, fontSize: "1.75rem", fontWeight: 300, lineHeight: 1.1, color: "rgba(255,255,255,0.95)" }}>
            ¿Registrar wellness?
          </h1>
          <p className="mt-3" style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: FONT_TEXT, lineHeight: 1.5, letterSpacing: "0.02em" }}>
            Captura sueño, fatiga, estrés, ánimo y dolor antes de la sesión. Es opcional.
          </p>
        </div>

        <div className="px-4 space-y-3 mt-2">
          <button
            type="button"
            onClick={() => setPhase("wellness-form")}
            className="w-full py-4 rounded-2xl text-sm font-semibold tracking-widest uppercase active:scale-[0.98]"
            style={{
              background: "#2abfbf",
              color: "#000",
              fontFamily: FONT_TEXT,
              boxShadow: "0 4px 24px rgba(42,191,191,0.4), inset 0 1px 0 rgba(255,255,255,0.25)",
            }}
          >
            Rellenar wellness
          </button>
          <button
            type="button"
            onClick={() => startSession(null)}
            className="w-full py-4 rounded-2xl text-sm font-semibold tracking-widest uppercase active:scale-[0.98]"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "0.5px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.85)",
              fontFamily: FONT_TEXT,
            }}
          >
            Saltar
          </button>
        </div>

        {error && (
          <p className="px-4 mt-4 text-xs text-center" style={{ color: "#ff8080", fontFamily: FONT_TEXT }}>
            {error}
          </p>
        )}
      </div>
    );
  }

  if (phase === "wellness-form") {
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
          {error && (
            <div
              className="rounded-2xl px-4 py-3 space-y-1"
              style={{
                background: "rgba(255,128,128,0.08)",
                border: "0.5px solid rgba(255,128,128,0.35)",
              }}
            >
              <p style={{ ...EYEBROW, color: "rgba(255,128,128,0.85)" }}>Error</p>
              <p className="text-xs" style={{ color: "rgba(255,200,200,0.95)", fontFamily: FONT_TEXT, lineHeight: 1.5 }}>
                {error}
              </p>
            </div>
          )}

          {blocks.map((b, idx) => (
            <BlockTrainer
              key={b.uid}
              block={b}
              index={idx}
              seriesByEjercicio={seriesByEjercicio}
              historico={historico}
              cardioRondas={b.kind === "cardio" && b.id ? rondasByBlock[b.id] : undefined}
              funcionalRegs={b.kind === "funcional" && b.id ? registrosByBlock[b.id] : undefined}
              onFuerzaUpdate={(ejId, i, patch) => {
                setSeriesByEjercicio((prev) => {
                  const arr = [...(prev[ejId] ?? [])];
                  arr[i] = { ...arr[i], ...patch };
                  return { ...prev, [ejId]: arr };
                });
              }}
              onAddSerie={addSerie}
              onRemoveSerie={removeSerie}
              onCardioUpdate={(i, patch) => {
                if (!b.id) return;
                setRondasByBlock((prev) => {
                  const arr = [...(prev[b.id!] ?? [])];
                  arr[i] = { ...arr[i], ...patch };
                  return { ...prev, [b.id!]: arr };
                });
              }}
              onAddRonda={addRonda}
              onRemoveRonda={removeRonda}
              onFuncionalUpdate={(ejId, patch) => {
                if (!b.id) return;
                setRegistrosByBlock((prev) => {
                  const blockRegs = { ...(prev[b.id!] ?? {}) };
                  blockRegs[ejId] = { ...(blockRegs[ejId] ?? { kg: null, reps_real: null, calorias_real: null, metros_real: null }), ...patch };
                  return { ...prev, [b.id!]: blockRegs };
                });
              }}
              onAddEjercicioFuerza={addEjercicioFuerza}
              onAddEjercicioFuncional={addEjercicioFuncional}
            />
          ))}

          {draftBlock && (
            <LiveBlockStructureEditor
              block={draftBlock}
              onChange={(patch) => setDraftBlock((prev) => (prev ? ({ ...prev, ...patch } as Block) : prev))}
              onCancel={() => setDraftBlock(null)}
              onSave={saveDraftBlock}
              saving={savingDraft}
            />
          )}

          {!draftBlock && (
            <button
              type="button"
              onClick={() => setShowAddSheet(true)}
              className="w-full py-3 rounded-2xl text-[11px] font-semibold tracking-widest uppercase active:scale-[0.98]"
              style={{
                background: "rgba(42,191,191,0.06)",
                border: "0.5px dashed rgba(42,191,191,0.3)",
                color: "rgba(42,191,191,0.85)",
                fontFamily: FONT_TEXT,
              }}
            >
              + Añadir bloque
            </button>
          )}
        </div>

        {showAddSheet && (
          <AddBlockSheet
            onPick={(k) => startAddingBlock(k)}
            onClose={() => setShowAddSheet(false)}
          />
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
        {error && (
          <div
            className="rounded-2xl px-4 py-3 space-y-1"
            style={{
              background: "rgba(255,128,128,0.08)",
              border: "0.5px solid rgba(255,128,128,0.35)",
            }}
          >
            <p style={{ ...EYEBROW, color: "rgba(255,128,128,0.85)" }}>Error al guardar</p>
            <p className="text-xs" style={{ color: "rgba(255,200,200,0.95)", fontFamily: FONT_TEXT, lineHeight: 1.5 }}>
              {error}
            </p>
          </div>
        )}

        <RPECapture rpe={rpe} onRpeChange={setRpe} />

        <div className="rounded-2xl px-4 py-4 space-y-3" style={GLASS}>
          <p style={LABEL}>Duración (minutos)</p>
          <input
            type="number"
            min={0}
            value={duracionStr}
            onChange={(e) => setDuracionStr(e.target.value)}
            placeholder="min"
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
  seriesByEjercicio,
  historico,
  cardioRondas,
  funcionalRegs,
  onFuerzaUpdate,
  onAddSerie,
  onRemoveSerie,
  onCardioUpdate,
  onAddRonda,
  onRemoveRonda,
  onFuncionalUpdate,
  onAddEjercicioFuerza,
  onAddEjercicioFuncional,
}: {
  block: Block;
  index: number;
  seriesByEjercicio: Record<string, FuerzaSerie[]>;
  historico: Record<string, { serie: number; peso: number | null; reps: number | null }[]>;
  cardioRondas?: CardioRonda[];
  funcionalRegs?: Record<string, FuncionalReg>;
  onFuerzaUpdate: (ejercicioId: string, i: number, patch: Partial<FuerzaSerie>) => void;
  onAddSerie: (ejercicioId: string) => void;
  onRemoveSerie: (ejercicioId: string, idx: number) => void;
  onCardioUpdate: (i: number, patch: Partial<CardioRonda>) => void;
  onAddRonda: (bloqueId: string) => void;
  onRemoveRonda: (bloqueId: string, idx: number) => void;
  onFuncionalUpdate: (ejId: string, patch: Partial<FuncionalReg>) => void;
  onAddEjercicioFuerza: (
    bloqueId: string,
    payload: { ejercicio_id: string | null; nombre_ejercicio: string; series_objetivo: number; reps_objetivo: number }
  ) => Promise<void>;
  onAddEjercicioFuncional: (
    bloqueId: string,
    payload: {
      tipo: "fuerza" | "cardio";
      ejercicio_id: string | null;
      nombre_ejercicio: string | null;
      reps_objetivo: number | null;
      maquina: "carrera" | "bici" | "ski" | "remo" | null;
      calorias_objetivo: number | null;
      metros_objetivo: number | null;
    }
  ) => Promise<void>;
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
        <FuerzaTrainer
          block={block as FuerzaBlock}
          seriesByEjercicio={seriesByEjercicio}
          historico={historico}
          onUpdate={onFuerzaUpdate}
          onAddSerie={onAddSerie}
          onRemoveSerie={onRemoveSerie}
          onAddEjercicio={onAddEjercicioFuerza}
        />
      )}
      {block.kind === "cardio" && (
        <CardioTrainer
          block={block as CardioBlock}
          rondas={cardioRondas ?? []}
          onUpdate={onCardioUpdate}
          onAddRonda={onAddRonda}
          onRemoveRonda={onRemoveRonda}
        />
      )}
      {block.kind === "funcional" && (
        <FuncionalTrainer
          block={block as FuncionalBlock}
          regs={funcionalRegs ?? {}}
          onUpdate={onFuncionalUpdate}
          onAddEjercicio={onAddEjercicioFuncional}
        />
      )}
    </div>
  );
}

function formatHistorialSerie(s: { serie: number; peso: number | null; reps: number | null }): string {
  const peso = s.peso != null ? `${s.peso}kg` : "";
  const reps = s.reps != null ? `×${s.reps}` : "";
  const partes = [peso, reps].filter(Boolean).join("");
  return `S${s.serie}${partes ? " " + partes : ""}`;
}

function FuerzaTrainer({
  block,
  seriesByEjercicio,
  historico,
  onUpdate,
  onAddSerie,
  onRemoveSerie,
  onAddEjercicio,
}: {
  block: FuerzaBlock;
  seriesByEjercicio: Record<string, FuerzaSerie[]>;
  historico: Record<string, { serie: number; peso: number | null; reps: number | null }[]>;
  onUpdate: (ejercicioId: string, i: number, patch: Partial<FuerzaSerie>) => void;
  onAddSerie: (ejercicioId: string) => void;
  onRemoveSerie: (ejercicioId: string, idx: number) => void;
  onAddEjercicio: (
    bloqueId: string,
    payload: { ejercicio_id: string | null; nombre_ejercicio: string; series_objetivo: number; reps_objetivo: number }
  ) => Promise<void>;
}) {
  const [showAddEj, setShowAddEj] = useState(false);
  return (
    <div className="space-y-3">
      {block.ejercicios.map((ej, ejIdx) => {
        const series = ej.id ? seriesByEjercicio[ej.id] ?? [] : [];
        return (
          <div
            key={ej.uid}
            className="rounded-xl px-3 py-3 space-y-2"
            style={{ background: "rgba(255,255,255,0.025)", border: "0.5px solid rgba(255,255,255,0.06)" }}
          >
            <div>
              <p className="text-sm truncate" style={{ color: "rgba(255,255,255,0.95)", fontFamily: FONT_TEXT, letterSpacing: "0.02em" }}>
                <span style={{ color: "rgba(255,128,96,0.7)", marginRight: 6 }}>{ejIdx + 1}.</span>
                {ej.nombre_ejercicio || "—"}
              </p>
              {(ej.series_objetivo > 0 || ej.reps_objetivo > 0) && (
                <p className="mt-0.5" style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: FONT_TEXT, letterSpacing: "0.04em" }}>
                  Objetivo: {ej.series_objetivo} × {ej.reps_objetivo}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              {series.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 text-[10px] tracking-wider shrink-0" style={{ color: "rgba(255,255,255,0.35)", fontFamily: FONT_TEXT }}>
                    {s.numero_serie}.
                  </span>
                  <div className="flex-1 grid grid-cols-2 gap-2 min-w-0">
                    <input
                      type="number"
                      placeholder="reps"
                      value={s.repeticiones ?? ""}
                      onChange={(e) => ej.id && onUpdate(ej.id, i, { repeticiones: e.target.value === "" ? null : Number(e.target.value) })}
                      className="w-full min-w-0 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] text-sm outline-none focus:border-[#2abfbf]"
                    />
                    <input
                      type="number"
                      step="0.5"
                      placeholder="kg"
                      value={s.peso ?? ""}
                      onChange={(e) => ej.id && onUpdate(ej.id, i, { peso: e.target.value === "" ? null : Number(e.target.value) })}
                      className="w-full min-w-0 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] text-sm outline-none focus:border-[#2abfbf]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => ej.id && onRemoveSerie(ej.id, i)}
                    aria-label="Eliminar serie"
                    className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "0.5px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,128,128,0.7)",
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => ej.id && onAddSerie(ej.id)}
              disabled={!ej.id}
              className="w-full py-1.5 rounded-lg text-[10px] tracking-[0.15em] uppercase font-semibold"
              style={{
                background: "rgba(255,128,96,0.08)",
                border: "0.5px dashed rgba(255,128,96,0.3)",
                color: "rgba(255,128,96,0.85)",
                fontFamily: FONT_TEXT,
              }}
            >
              + Serie
            </button>
            {ej.ejercicio_id && historico[ej.ejercicio_id]?.length ? (
              <div
                className="flex items-center gap-1.5"
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontFamily: FONT_TEXT,
                  fontSize: 11,
                  paddingTop: 2,
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>
                  Última vez:{" "}
                  {historico[ej.ejercicio_id].slice(0, 3).map(formatHistorialSerie).join(" · ")}
                  {historico[ej.ejercicio_id].length > 3 ? " …" : ""}
                </span>
              </div>
            ) : null}
          </div>
        );
      })}

      {showAddEj ? (
        <AddEjercicioInline
          onCancel={() => setShowAddEj(false)}
          onSave={async (payload) => {
            if (!block.id) return;
            await onAddEjercicio(block.id, payload);
            setShowAddEj(false);
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowAddEj(true)}
          disabled={!block.id}
          className="w-full py-2 rounded-lg text-[10px] tracking-[0.15em] uppercase font-semibold disabled:opacity-30"
          style={{
            background: "rgba(255,128,96,0.06)",
            border: "0.5px dashed rgba(255,128,96,0.3)",
            color: "rgba(255,128,96,0.85)",
            fontFamily: FONT_TEXT,
          }}
        >
          + Ejercicio
        </button>
      )}
    </div>
  );
}

function AddEjercicioInline({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (payload: { ejercicio_id: string | null; nombre_ejercicio: string; series_objetivo: number; reps_objetivo: number }) => Promise<void>;
}) {
  const [nombre, setNombre] = useState("");
  const [ejercicioId, setEjercicioId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <div
      className="rounded-xl px-3 py-3 space-y-2"
      style={{ background: "rgba(255,128,96,0.04)", border: "0.5px dashed rgba(255,128,96,0.3)" }}
    >
      <p className="text-[9px] tracking-[0.18em] uppercase font-semibold" style={{ color: "rgba(255,128,96,0.85)", fontFamily: FONT_TEXT }}>
        Nuevo ejercicio
      </p>
      <div className="flex">
        <EjercicioSelector
          value={nombre}
          ejercicioId={ejercicioId}
          onChange={(n, id) => {
            setNombre(n);
            setEjercicioId(id);
          }}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg text-[10px] tracking-[0.15em] uppercase font-semibold"
          style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", fontFamily: FONT_TEXT }}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={async () => {
            if (!nombre.trim()) return;
            setSaving(true);
            await onSave({ ejercicio_id: ejercicioId, nombre_ejercicio: nombre.trim(), series_objetivo: 0, reps_objetivo: 0 });
            setSaving(false);
          }}
          disabled={saving || !nombre.trim()}
          className="flex-1 py-2 rounded-lg text-[10px] tracking-[0.15em] uppercase font-semibold disabled:opacity-40"
          style={{ background: "#2abfbf", color: "#000", fontFamily: FONT_TEXT }}
        >
          {saving ? "Guardando…" : "Añadir"}
        </button>
      </div>
    </div>
  );
}

function CardioTrainer({
  block,
  rondas,
  onUpdate,
  onAddRonda,
  onRemoveRonda,
}: {
  block: CardioBlock;
  rondas: CardioRonda[];
  onUpdate: (i: number, patch: Partial<CardioRonda>) => void;
  onAddRonda: (bloqueId: string) => void;
  onRemoveRonda: (bloqueId: string, idx: number) => void;
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

      {isInterval && (
        <>
          {rondas.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-8 text-[10px] tracking-wider shrink-0" style={{ color: "rgba(255,255,255,0.35)", fontFamily: FONT_TEXT }}>
                R{r.numero_ronda}
              </span>
              <div className="flex-1 grid grid-cols-2 gap-2 min-w-0">
                <input
                  type="number"
                  placeholder="cal"
                  value={r.calorias_real ?? ""}
                  onChange={(e) => onUpdate(i, { calorias_real: e.target.value === "" ? null : Number(e.target.value) })}
                  className="w-full min-w-0 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] text-sm outline-none focus:border-[#2abfbf]"
                />
                <input
                  type="number"
                  placeholder="W"
                  value={r.watts ?? ""}
                  onChange={(e) => onUpdate(i, { watts: e.target.value === "" ? null : Number(e.target.value) })}
                  className="w-full min-w-0 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] text-sm outline-none focus:border-[#2abfbf]"
                />
              </div>
              <button
                type="button"
                onClick={() => block.id && onRemoveRonda(block.id, i)}
                aria-label="Eliminar ronda"
                className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "0.5px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,128,128,0.7)",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => block.id && onAddRonda(block.id)}
            disabled={!block.id}
            className="w-full py-1.5 rounded-lg text-[10px] tracking-[0.15em] uppercase font-semibold mt-1"
            style={{
              background: "rgba(255,176,64,0.08)",
              border: "0.5px dashed rgba(255,176,64,0.3)",
              color: "rgba(255,176,64,0.85)",
              fontFamily: FONT_TEXT,
            }}
          >
            + Ronda
          </button>
        </>
      )}
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
  onAddEjercicio,
}: {
  block: FuncionalBlock;
  regs: Record<string, FuncionalReg>;
  onUpdate: (ejId: string, patch: Partial<FuncionalReg>) => void;
  onAddEjercicio: (
    bloqueId: string,
    payload: {
      tipo: "fuerza" | "cardio";
      ejercicio_id: string | null;
      nombre_ejercicio: string | null;
      reps_objetivo: number | null;
      maquina: "carrera" | "bici" | "ski" | "remo" | null;
      calorias_objetivo: number | null;
      metros_objetivo: number | null;
    }
  ) => Promise<void>;
}) {
  const [showAddEj, setShowAddEj] = useState(false);
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
              <div>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.95)", fontFamily: FONT_TEXT, letterSpacing: "0.02em" }}>
                  <span style={{ color: "rgba(42,191,191,0.7)", marginRight: 6 }}>{i + 1}.</span>
                  {ej.tipo === "fuerza" ? ej.nombre_ejercicio || "—" : capital(ej.maquina ?? "")}
                </p>
                {(ej.reps_objetivo || ej.calorias_objetivo || ej.metros_objetivo) && (
                  <p className="mt-0.5" style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: FONT_TEXT, letterSpacing: "0.04em" }}>
                    Objetivo:{" "}
                    {ej.tipo === "fuerza"
                      ? `${ej.reps_objetivo} reps`
                      : ej.calorias_objetivo
                      ? `${ej.calorias_objetivo} cal`
                      : `${ej.metros_objetivo}m`}
                  </p>
                )}
              </div>
              {ej.id && (
                <div className="grid grid-cols-2 gap-2">
                  {ej.tipo === "fuerza" ? (
                    <>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="kg"
                        value={reg.kg ?? ""}
                        onChange={(e) => onUpdate(ej.id!, { kg: e.target.value === "" ? null : Number(e.target.value) })}
                        className="w-full min-w-0 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] text-sm outline-none focus:border-[#2abfbf]"
                      />
                      <input
                        type="number"
                        placeholder="reps"
                        value={reg.reps_real ?? ""}
                        onChange={(e) => onUpdate(ej.id!, { reps_real: e.target.value === "" ? null : Number(e.target.value) })}
                        className="w-full min-w-0 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] text-sm outline-none focus:border-[#2abfbf]"
                      />
                    </>
                  ) : (
                    <>
                      <input
                        type="number"
                        placeholder="cal"
                        value={reg.calorias_real ?? ""}
                        onChange={(e) => onUpdate(ej.id!, { calorias_real: e.target.value === "" ? null : Number(e.target.value) })}
                        className="w-full min-w-0 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] text-sm outline-none focus:border-[#2abfbf]"
                      />
                      <input
                        type="number"
                        placeholder="metros"
                        value={reg.metros_real ?? ""}
                        onChange={(e) => onUpdate(ej.id!, { metros_real: e.target.value === "" ? null : Number(e.target.value) })}
                        className="w-full min-w-0 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] text-sm outline-none focus:border-[#2abfbf]"
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showAddEj ? (
        <AddEjercicioFuncionalInline
          onCancel={() => setShowAddEj(false)}
          onSave={async (payload) => {
            if (!block.id) return;
            await onAddEjercicio(block.id, payload);
            setShowAddEj(false);
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowAddEj(true)}
          disabled={!block.id}
          className="w-full py-2 rounded-lg text-[10px] tracking-[0.15em] uppercase font-semibold disabled:opacity-30"
          style={{
            background: "rgba(42,191,191,0.06)",
            border: "0.5px dashed rgba(42,191,191,0.3)",
            color: "rgba(42,191,191,0.85)",
            fontFamily: FONT_TEXT,
          }}
        >
          + Ejercicio
        </button>
      )}
    </div>
  );
}

function AddEjercicioFuncionalInline({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (payload: {
    tipo: "fuerza" | "cardio";
    ejercicio_id: string | null;
    nombre_ejercicio: string | null;
    reps_objetivo: number | null;
    maquina: "carrera" | "bici" | "ski" | "remo" | null;
    calorias_objetivo: number | null;
    metros_objetivo: number | null;
  }) => Promise<void>;
}) {
  const [tipo, setTipo] = useState<"fuerza" | "cardio">("fuerza");
  const [nombre, setNombre] = useState("");
  const [ejercicioId, setEjercicioId] = useState<string | null>(null);
  const [maquina, setMaquina] = useState<"carrera" | "bici" | "ski" | "remo">("carrera");
  const [saving, setSaving] = useState(false);

  return (
    <div
      className="rounded-xl px-3 py-3 space-y-2"
      style={{ background: "rgba(42,191,191,0.04)", border: "0.5px dashed rgba(42,191,191,0.3)" }}
    >
      <p className="text-[9px] tracking-[0.18em] uppercase font-semibold" style={{ color: "rgba(42,191,191,0.85)", fontFamily: FONT_TEXT }}>
        Nuevo ejercicio funcional
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {(["fuerza", "cardio"] as const).map((t) => {
          const sel = tipo === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className="py-2 rounded-md text-[10px] tracking-[0.15em] uppercase font-semibold"
              style={{
                background: sel ? "rgba(42,191,191,0.15)" : "rgba(255,255,255,0.04)",
                border: `0.5px solid ${sel ? "rgba(42,191,191,0.4)" : "rgba(255,255,255,0.08)"}`,
                color: sel ? "#2abfbf" : "rgba(255,255,255,0.5)",
                fontFamily: FONT_TEXT,
              }}
            >
              {t === "fuerza" ? "Fuerza" : "Cardio"}
            </button>
          );
        })}
      </div>
      {tipo === "fuerza" ? (
        <div className="flex">
          <EjercicioSelector
            value={nombre}
            ejercicioId={ejercicioId}
            onChange={(n, id) => {
              setNombre(n);
              setEjercicioId(id);
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-1.5">
          {(["carrera", "bici", "ski", "remo"] as const).map((m) => {
            const sel = maquina === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMaquina(m)}
                className="py-1.5 rounded-md text-[9px] tracking-[0.15em] uppercase font-semibold"
                style={{
                  background: sel ? "rgba(42,191,191,0.15)" : "rgba(255,255,255,0.04)",
                  border: `0.5px solid ${sel ? "rgba(42,191,191,0.4)" : "rgba(255,255,255,0.08)"}`,
                  color: sel ? "#2abfbf" : "rgba(255,255,255,0.5)",
                  fontFamily: FONT_TEXT,
                }}
              >
                {capital(m)}
              </button>
            );
          })}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="py-2 rounded-lg text-[10px] tracking-[0.15em] uppercase font-semibold"
          style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", fontFamily: FONT_TEXT }}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={async () => {
            if (tipo === "fuerza" && !nombre.trim()) return;
            setSaving(true);
            await onSave({
              tipo,
              ejercicio_id: tipo === "fuerza" ? ejercicioId : null,
              nombre_ejercicio: tipo === "fuerza" ? nombre.trim() : null,
              reps_objetivo: null,
              maquina: tipo === "cardio" ? maquina : null,
              calorias_objetivo: null,
              metros_objetivo: null,
            });
            setSaving(false);
          }}
          disabled={saving || (tipo === "fuerza" && !nombre.trim())}
          className="py-2 rounded-lg text-[10px] tracking-[0.15em] uppercase font-semibold disabled:opacity-40"
          style={{ background: "#2abfbf", color: "#000", fontFamily: FONT_TEXT }}
        >
          {saving ? "Guardando…" : "Añadir"}
        </button>
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

const MAQUINAS_LIVE: { key: "carrera" | "bici" | "ski" | "remo"; label: string }[] = [
  { key: "carrera", label: "Carrera" },
  { key: "bici", label: "Bici" },
  { key: "ski", label: "Ski" },
  { key: "remo", label: "Remo" },
];

const FORMATOS_LIVE: { key: FuncionalBlock["formato"]; label: string }[] = [
  { key: "for_time", label: "For time" },
  { key: "amrap", label: "AMRAP" },
  { key: "emom", label: "EMOM" },
  { key: "tabata", label: "Tabata" },
];

function modosForLive(maquina: CardioBlock["maquina"]): { key: CardioBlock["modo"]; label: string }[] {
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

function LiveBlockStructureEditor({
  block,
  onChange,
  onCancel,
  onSave,
  saving,
}: {
  block: Block;
  onChange: (patch: any) => void;
  onCancel: () => void;
  onSave: () => Promise<void>;
  saving: boolean;
}) {
  const meta = BLOCK_META[block.kind];
  return (
    <div
      className="rounded-2xl px-4 py-4 space-y-3"
      style={{ ...GLASS, border: `0.5px dashed ${meta.border}` }}
    >
      <div className="flex items-center justify-between">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-[9px] tracking-[0.2em] uppercase font-semibold"
          style={{ background: meta.bg, border: `0.5px solid ${meta.border}`, color: meta.color, fontFamily: FONT_TEXT }}
        >
          Nuevo · {meta.label}
        </span>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancelar"
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {block.kind === "cardio" && (
        <>
          <div>
            <p style={{ ...LABEL, marginBottom: 6 }}>Máquina</p>
            <div className="grid grid-cols-4 gap-1.5">
              {MAQUINAS_LIVE.map((m) => {
                const sel = (block as CardioBlock).maquina === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => {
                      const validModos = modosForLive(m.key).map((x) => x.key);
                      const cur = (block as CardioBlock).modo;
                      const newModo = validModos.includes(cur) ? cur : validModos[0];
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
              {modosForLive((block as CardioBlock).maquina).map((m) => {
                const sel = (block as CardioBlock).modo === m.key;
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
        </>
      )}

      {block.kind === "funcional" && (
        <>
          <div>
            <p style={{ ...LABEL, marginBottom: 6 }}>Formato</p>
            <div className="grid grid-cols-4 gap-1.5">
              {FORMATOS_LIVE.map((f) => {
                const sel = (block as FuncionalBlock).formato === f.key;
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
          <div>
            <p style={{ ...LABEL, marginBottom: 4 }}>Tiempo total (min)</p>
            <input
              type="number"
              min={1}
              value={(block as FuncionalBlock).tiempo_minutos || ""}
              onChange={(e) => onChange({ tiempo_minutos: e.target.value === "" ? 0 : Number(e.target.value) })}
              placeholder="min"
              className="w-24 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] text-sm outline-none focus:border-[#2abfbf]"
            />
          </div>
        </>
      )}

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="w-full py-3 rounded-xl text-[11px] font-semibold tracking-widest uppercase active:scale-[0.98] disabled:opacity-40"
        style={{
          background: "#2abfbf",
          color: "#000",
          fontFamily: FONT_TEXT,
          boxShadow: "0 4px 24px rgba(42,191,191,0.3)",
        }}
      >
        {saving ? "Guardando…" : "Confirmar bloque"}
      </button>
    </div>
  );
}
