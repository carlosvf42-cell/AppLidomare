"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import EjercicioSelector from "@/components/EjercicioSelector";
import WellnessCheckIn from "@/components/health/WellnessCheckIn";
import RPECapture from "@/components/health/RPECapture";
import {
  CardioBlockTrainer,
  FuerzaBlockTrainer,
  FuncionalBlockTrainer,
  makeCardioRondaInput,
  makeFuerzaSerieInput,
  type CardioRondaInput,
  type FuerzaSerieInput,
  type FuncionalEjercicioInput,
} from "@/components/bloques/BlockTrainers";
import BlockEditor from "@/components/bloques/BlockEditor";
import { fromApiBlocks, type Block, type CardioBlock, type FuerzaBlock, type FuncionalBlock } from "@/components/antifragil/types";

type RutinaEjercicio = { id: string; nombre: string; series: number; repeticiones: number; orden: number; ejercicio_id?: string | null };
type RutinaDia = { id: string; nombre: string; orden: number; rutina_ejercicios: RutinaEjercicio[] };
type Rutina = { id: string; nombre: string; rutina_dias: RutinaDia[] };

type SerieForm = { repeticiones: string; peso: string; completada: boolean };
type EjercicioSession = RutinaEjercicio & { seriesData: SerieForm[] };
type HistorialSerie = { serie: number; peso: number | null; reps: number | null };
type HistorialMap = Record<string, HistorialSerie[]>;

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function formatHistorialSerie(s: { serie: number; peso: number | null; reps: number | null }): string {
  const peso = s.peso != null ? `${s.peso}kg` : "";
  const reps = s.reps != null ? `×${s.reps}` : "";
  const partes = [peso, reps].filter(Boolean).join("");
  return `S${s.serie}${partes ? " " + partes : ""}`;
}

/* ── Draft persistence (localStorage) ──────────────────────── */
const DRAFT_KEY = "lidomare-entreno-draft";

type Draft = {
  diaId: string;
  fecha: string;
  horaInicio: string;
  ejercicios: { id: string; nombre: string; series: number; repeticiones: number; orden: number; ejercicio_id?: string | null; seriesData: SerieForm[] }[];
};

function saveDraft(diaId: string, horaInicio: Date, ejercicios: EjercicioSession[]) {
  try {
    const draft: Draft = {
      diaId,
      fecha: todayISO(),
      horaInicio: horaInicio.toISOString(),
      ejercicios: ejercicios.map((ej) => ({
        id: ej.id,
        nombre: ej.nombre,
        series: ej.series,
        repeticiones: ej.repeticiones,
        orden: ej.orden,
        ejercicio_id: ej.ejercicio_id,
        seriesData: ej.seriesData,
      })),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch { /* quota exceeded or private browsing — silently ignore */ }
}

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft: Draft = JSON.parse(raw);
    if (draft.fecha !== todayISO()) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.07)",
  backdropFilter: "blur(24px) saturate(180%)",
  WebkitBackdropFilter: "blur(24px) saturate(180%)",
  border: "0.5px solid rgba(255,255,255,0.13)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 4px 24px rgba(0,0,0,0.4)",
};

function EntrenarInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const diaParam = searchParams.get("dia");
  const modoLibre = searchParams.get("modo") === "libre";
  const [rutina, setRutina] = useState<Rutina | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDia, setSelectedDia] = useState<RutinaDia | null>(null);
  const [isDiaLibre, setIsDiaLibre] = useState(false);
  const [ejercicios, setEjercicios] = useState<EjercicioSession[]>([]);
  const [isSaving, startSave] = useTransition();
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [horaInicio, setHoraInicio] = useState<Date | null>(null);
  const [showAddExtra, setShowAddExtra] = useState(false);
  const [extraName, setExtraName] = useState("");
  const [extraEjId, setExtraEjId] = useState<string | null>(null);
  const [addingExtra, setAddingExtra] = useState(false);
  const [showWellness, setShowWellness] = useState(false);
  const [wellnessDone, setWellnessDone] = useState(false);
  const [rpe, setRpe] = useState<number | null>(null);
  const [duracionManual, setDuracionManual] = useState("");
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [blockSheetOpen, setBlockSheetOpen] = useState(false);
  const [historico, setHistorico] = useState<HistorialMap>({});
  // Bloques cardio/funcional cargados del día actual
  const [diaBlocks, setDiaBlocks] = useState<Block[]>([]);
  // Inputs por bloque cardio (uid → array de rondas)
  const [cardioInputs, setCardioInputs] = useState<Record<string, CardioRondaInput[]>>({});
  // Inputs por bloque funcional (bloque uid → ejercicio uid → input)
  const [funcionalInputs, setFuncionalInputs] = useState<Record<string, Record<string, FuncionalEjercicioInput>>>({});
  // Inputs por bloque fuerza ad-hoc (bloque uid → ejercicio uid → array de series)
  const [fuerzaBlockInputs, setFuerzaBlockInputs] = useState<Record<string, Record<string, FuerzaSerieInput[]>>>({});

  useEffect(() => {
    // Free day mode — no routine needed
    if (modoLibre) {
      const draft = loadDraft();
      if (draft && draft.diaId === "__libre__" && draft.fecha === todayISO()) {
        setHoraInicio(new Date(draft.horaInicio));
        setEjercicios(draft.ejercicios);
      } else {
        setHoraInicio(new Date());
        setEjercicios([]);
      }
      setIsDiaLibre(true);
      setSelectedDia({ id: "__libre__", nombre: "Día libre", orden: 0, rutina_ejercicios: [] } as RutinaDia);
      setLoading(false);
      return;
    }

    const supabase = getSupabase();
    const draft = loadDraft();

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("rutinas")
        .select("id, nombre, rutina_dias(id, nombre, orden, rutina_ejercicios(id, nombre, series, repeticiones, orden, ejercicio_id))")
        .eq("user_id", user.id)
        .eq("activa", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
        if (data) {
          const r = data as Rutina;
          r.rutina_dias.sort((a, b) => a.orden - b.orden);
          r.rutina_dias.forEach((d) => d.rutina_ejercicios.sort((a, b) => a.orden - b.orden));
          setRutina(r);

          // Priority: URL param (with draft if matching) > draft > nothing
          if (diaParam) {
            const diaToSelect = r.rutina_dias.find((d) => d.id === diaParam);
            if (diaToSelect) {
              const matchingDraft = draft && draft.diaId === diaParam ? draft : undefined;
              selectDia(diaToSelect, matchingDraft);
            }
          } else if (draft && draft.diaId !== "__libre__") {
            const diaToRestore = r.rutina_dias.find((d) => d.id === draft.diaId);
            if (diaToRestore) selectDia(diaToRestore, draft);
          }
        }
        setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const catalogIds = Array.from(
      new Set(
        ejercicios
          .map((ej) => ej.ejercicio_id)
          .filter((id): id is string => !!id && !(id in historico))
      )
    );
    if (catalogIds.length === 0) return;

    let cancelled = false;
    (async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("series_realizadas")
        .select("numero_serie, peso, repeticiones, ejercicio_catalogo_id, sesion_id, sesiones!inner(fecha)")
        .in("ejercicio_catalogo_id", catalogIds)
        .limit(500);

      if (cancelled) return;
      if (error) {
        console.error("[historico] query error:", error);
        return;
      }
      if (!data) return;

      type Row = {
        numero_serie: number;
        peso: number | null;
        repeticiones: number | null;
        ejercicio_catalogo_id: string | null;
        sesion_id: string;
        sesiones: { fecha: string } | { fecha: string }[] | null;
      };

      const byCat = new Map<
        string,
        Array<{ sesion_id: string; fecha: string; serie: number; peso: number | null; reps: number | null }>
      >();
      for (const row of data as Row[]) {
        const catId = row.ejercicio_catalogo_id;
        if (!catId) continue;
        const ses = Array.isArray(row.sesiones) ? row.sesiones[0] : row.sesiones;
        const fecha = ses?.fecha;
        if (!fecha) continue;
        if (!byCat.has(catId)) byCat.set(catId, []);
        byCat.get(catId)!.push({
          sesion_id: row.sesion_id,
          fecha,
          serie: row.numero_serie,
          peso: row.peso,
          reps: row.repeticiones,
        });
      }

      const result: HistorialMap = {};
      for (const id of catalogIds) result[id] = [];
      for (const [catId, rows] of byCat) {
        rows.sort((a, b) =>
          a.fecha === b.fecha ? a.serie - b.serie : a.fecha < b.fecha ? 1 : -1
        );
        const latestSesion = rows[0]?.sesion_id;
        if (!latestSesion) continue;
        result[catId] = rows
          .filter((r) => r.sesion_id === latestSesion)
          .map((r) => ({ serie: r.serie, peso: r.peso, reps: r.reps }))
          .sort((a, b) => a.serie - b.serie);
      }

      setHistorico((prev) => ({ ...prev, ...result }));
    })();

    return () => { cancelled = true; };
  }, [ejercicios]);

  async function maybeShowWellness() {
    if (wellnessDone) return;
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setShowWellness(true); return; }
    const today = todayISO();
    const { data } = await supabase
      .from("wellness_entries")
      .select("id")
      .eq("user_id", user.id)
      .eq("fecha", today)
      .maybeSingle();
    if (data) {
      setWellnessDone(true);
    } else {
      setShowWellness(true);
    }
  }

  function selectDia(dia: RutinaDia, fromDraft?: Draft) {
    setSelectedDia(dia);

    if (fromDraft && fromDraft.diaId === dia.id) {
      // Restore from draft
      setHoraInicio(new Date(fromDraft.horaInicio));
      setEjercicios(fromDraft.ejercicios);
      return;
    }

    // Fresh start
    const inicio = new Date();
    setHoraInicio(inicio);
    const ejs = dia.rutina_ejercicios.map((ej) => ({
      ...ej,
      seriesData: Array.from({ length: ej.series }, () => ({
        repeticiones: String(ej.repeticiones),
        peso: "",
        completada: false,
      })),
    }));
    setEjercicios(ejs);
    saveDraft(dia.id, inicio, ejs);
    loadBlocksForDia(dia.id);
    maybeShowWellness();
  }

  async function loadBlocksForDia(diaId: string) {
    if (!diaId || diaId === "__libre__") {
      setDiaBlocks([]);
      setCardioInputs({});
      setFuncionalInputs({});
      return;
    }
    const supabase = getSupabase();
    const [{ data: cardioRows }, { data: funcRows }] = await Promise.all([
      supabase
        .from("rutina_bloques_cardio")
        .select("id, orden, nombre, maquina, modo, distancia_metros, calorias_total, watts_objetivo, rondas, duracion_accion_seg, duracion_descanso_seg, calorias_por_ronda")
        .eq("dia_id", diaId)
        .order("orden", { ascending: true }),
      supabase
        .from("rutina_bloques_funcional")
        .select("id, orden, nombre, formato, tiempo_minutos, duracion_accion_seg, duracion_descanso_seg, rutina_ejercicios_funcional(id, orden, tipo, ejercicio_id, nombre_ejercicio, reps_objetivo, maquina, calorias_objetivo, metros_objetivo)")
        .eq("dia_id", diaId)
        .order("orden", { ascending: true }),
    ]);
    const cardioApi = (cardioRows ?? []).map((r: any) => ({ ...r, kind: "cardio" }));
    const funcApi = (funcRows ?? []).map((r: any) => ({ ...r, kind: "funcional", ejercicios: r.rutina_ejercicios_funcional ?? [] }));
    const blocks = fromApiBlocks([...cardioApi, ...funcApi]);
    setDiaBlocks(blocks);

    // Inicializar inputs vacíos
    const cardioInit: Record<string, CardioRondaInput[]> = {};
    const funcInit: Record<string, Record<string, FuncionalEjercicioInput>> = {};
    for (const b of blocks) {
      if (b.kind === "cardio") {
        const rondas = Math.max(1, b.rondas ?? 1);
        cardioInit[b.uid] = Array.from({ length: rondas }, () => makeCardioRondaInput());
      } else if (b.kind === "funcional") {
        funcInit[b.uid] = {};
        for (const ej of b.ejercicios) {
          funcInit[b.uid][ej.uid] = { kg: "", reps: "", calorias: "", metros: "", completada: false };
        }
      }
    }
    setCardioInputs(cardioInit);
    setFuncionalInputs(funcInit);
  }

  function updateSerie(ejIdx: number, sIdx: number, key: keyof SerieForm, value: string | boolean) {
    setEjercicios((prev) => {
      const next = prev.map((ej, i) =>
        i === ejIdx
          ? { ...ej, seriesData: ej.seriesData.map((s, j) => (j === sIdx ? { ...s, [key]: value } : s)) }
          : ej
      );
      if (selectedDia && horaInicio) saveDraft(selectedDia.id, horaInicio, next);
      return next;
    });
  }

  function toggleSerie(ejIdx: number, sIdx: number) {
    setEjercicios((prev) => {
      const next = prev.map((ej, i) =>
        i === ejIdx
          ? { ...ej, seriesData: ej.seriesData.map((s, j) => (j === sIdx ? { ...s, completada: !s.completada } : s)) }
          : ej
      );
      if (selectedDia && horaInicio) saveDraft(selectedDia.id, horaInicio, next);
      return next;
    });
  }

  async function handleAddExtra() {
    if (!extraName.trim() || !selectedDia) return;
    setAddingExtra(true);

    if (isDiaLibre) {
      // Día libre: only local state, no DB insert for rutina_ejercicios
      const localEj: RutinaEjercicio = {
        id: `libre-${Date.now()}`,
        nombre: extraName.trim(),
        series: 3,
        repeticiones: 10,
        orden: ejercicios.length + 1,
        ejercicio_id: extraEjId,
      };
      setEjercicios((prev) => {
        const next = [
          ...prev,
          {
            ...localEj,
            seriesData: Array.from({ length: localEj.series }, () => ({
              repeticiones: String(localEj.repeticiones),
              peso: "",
              completada: false,
            })),
          },
        ];
        if (horaInicio) saveDraft("__libre__", horaInicio, next);
        return next;
      });
      setExtraName("");
      setExtraEjId(null);
      setShowAddExtra(false);
      setAddingExtra(false);
      return;
    }

    const supabase = getSupabase();
    const orden = ejercicios.length + 1;
    const { data: nuevoEj } = await supabase
      .from("rutina_ejercicios")
      .insert({
        dia_id: selectedDia.id,
        nombre: extraName.trim(),
        ejercicio_id: extraEjId,
        series: 3,
        repeticiones: 10,
        orden,
      })
      .select("id, nombre, series, repeticiones, orden, ejercicio_id")
      .single();

    if (nuevoEj) {
      const ej = nuevoEj as RutinaEjercicio;
      setEjercicios((prev) => {
        const next = [
          ...prev,
          {
            ...ej,
            seriesData: Array.from({ length: ej.series }, () => ({
              repeticiones: String(ej.repeticiones),
              peso: "",
              completada: false,
            })),
          },
        ];
        if (selectedDia && horaInicio) saveDraft(selectedDia.id, horaInicio, next);
        return next;
      });
    }
    setExtraName("");
    setExtraEjId(null);
    setShowAddExtra(false);
    setAddingExtra(false);
  }

  function handleFinish() {
    if (!selectedDia) return;
    setSaveError(null);
    startSave(async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: sesion, error: sesionErr } = await supabase
        .from("sesiones")
        .insert({
          user_id: user.id,
          dia_id: isDiaLibre ? null : selectedDia.id,
          fecha: todayISO(),
        })
        .select("id")
        .single();

      if (sesionErr || !sesion) {
        console.error("Sesion insert error:", sesionErr);
        setSaveError(`No se pudo guardar la sesión. ${sesionErr?.message ?? ""}`);
        return;
      }

      // Persistir registros de bloques cardio + funcional + fuerza (ad-hoc)
      const cardioRegistros: any[] = [];
      const funcRegistros: any[] = [];
      const fuerzaBlockSeries: any[] = [];
      for (const b of diaBlocks) {
        if (b.kind === "fuerza") {
          // Bloques fuerza ad-hoc → se persisten en series_realizadas
          // (ejercicio_id=null, ejercicio_catalogo_id si el ejercicio viene del catálogo)
          const ejSerieMap = fuerzaBlockInputs[b.uid] ?? {};
          for (const ej of b.ejercicios) {
            const series = ejSerieMap[ej.uid] ?? [];
            series.forEach((s, idx) => {
              const hasData = s.peso !== "" || s.reps !== "" || s.completada;
              if (!hasData) return;
              fuerzaBlockSeries.push({
                sesion_id: sesion.id,
                ejercicio_id: null,
                ejercicio_catalogo_id: ej.ejercicio_id ?? null,
                numero_serie: idx + 1,
                peso: s.peso ? parseFloat(s.peso) : null,
                repeticiones: s.reps ? parseInt(s.reps) : null,
                completada: s.completada,
              });
            });
          }
        } else if (b.kind === "cardio") {
          const rondas = cardioInputs[b.uid] ?? [];
          rondas.forEach((r, idx) => {
            const hasData =
              r.watts !== "" || r.calorias !== "" || r.distancia !== "" || r.duracion_seg !== "" || r.completada;
            if (!hasData) return;
            cardioRegistros.push({
              sesion_id: sesion.id,
              bloque_id: b.id ?? null,
              maquina: b.maquina,
              numero_ronda: idx + 1,
              watts: r.watts ? parseInt(r.watts) : null,
              calorias_real: r.calorias ? parseInt(r.calorias) : null,
              distancia_metros_real: r.distancia ? parseInt(r.distancia) : null,
              duracion_seg_real: r.duracion_seg ? parseInt(r.duracion_seg) : null,
              completada: r.completada,
            });
          });
        } else if (b.kind === "funcional") {
          const ejInputs = funcionalInputs[b.uid] ?? {};
          for (const ej of b.ejercicios) {
            const inp = ejInputs[ej.uid];
            if (!inp) continue;
            const hasData =
              inp.kg !== "" || inp.reps !== "" || inp.calorias !== "" || inp.metros !== "" || inp.completada;
            if (!hasData) continue;
            funcRegistros.push({
              sesion_id: sesion.id,
              bloque_id: b.id ?? null,
              ejercicio_funcional_id: ej.id ?? null,
              nombre_ejercicio: ej.nombre_ejercicio || null,
              kg: inp.kg ? parseFloat(inp.kg) : null,
              reps_real: inp.reps ? parseInt(inp.reps) : null,
              calorias_real: inp.calorias ? parseInt(inp.calorias) : null,
              metros_real: inp.metros ? parseInt(inp.metros) : null,
            });
          }
        }
      }
      if (cardioRegistros.length > 0) {
        const { error: cErr } = await supabase.from("registros_cardio").insert(cardioRegistros);
        if (cErr) {
          console.error("Cardio registros error:", cErr);
          setSaveError(`Sesión creada pero error en cardio. ${cErr.message}`);
          return;
        }
      }
      if (funcRegistros.length > 0) {
        const { error: fErr } = await supabase.from("registros_funcional_user").insert(funcRegistros);
        if (fErr) {
          console.error("Funcional registros error:", fErr);
          setSaveError(`Sesión creada pero error en funcional. ${fErr.message}`);
          return;
        }
      }
      if (fuerzaBlockSeries.length > 0) {
        const { error: fbErr } = await supabase.from("series_realizadas").insert(fuerzaBlockSeries);
        if (fbErr) {
          console.error("Fuerza ad-hoc series error:", fbErr);
          setSaveError(`Sesión creada pero error en fuerza ad-hoc. ${fbErr.message}`);
          return;
        }
      }

      const seriesRows = ejercicios.flatMap((ej) =>
        ej.seriesData.map((s, sIdx) => ({
          sesion_id: sesion.id,
          ejercicio_id: isDiaLibre ? null : ej.id,
          ejercicio_catalogo_id: ej.ejercicio_id ?? null,
          numero_serie: sIdx + 1,
          repeticiones: s.repeticiones ? parseInt(s.repeticiones) : null,
          peso: s.peso ? parseFloat(s.peso) : null,
          completada: s.completada,
        }))
      );

      if (seriesRows.length === 0) {
        // Día libre with no exercises — just mark session complete
        await supabase
          .from("sesiones")
          .update({ completada: true, duracion_minutos: duracionManual ? parseInt(duracionManual) : null, rpe: rpe ?? null })
          .eq("id", sesion.id);
        clearDraft();
        setSaved(true);
        setTimeout(() => router.push("/rutinas"), 1200);
        return;
      }

      const { error: seriesErr } = await supabase.from("series_realizadas").insert(seriesRows);
      if (seriesErr) {
        console.error("Series insert error:", seriesErr);
        setSaveError(`Sesión creada pero error en series. ${seriesErr.message}`);
        return;
      }

      await supabase
        .from("sesiones")
        .update({ completada: true, duracion_minutos: duracionManual ? parseInt(duracionManual) : null, rpe: rpe ?? null })
        .eq("id", sesion.id);

      clearDraft();
      setSaved(true);
      setTimeout(() => router.push("/rutinas"), 1200);
    });
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 rounded-full animate-spin" style={{ border: "1.5px solid rgba(255,255,255,0.1)", borderTopColor: "#2abfbf" }} />
      </div>
    );
  }

  /* ── No active routine (skip for día libre) ── */
  if (!rutina && !isDiaLibre) {
    return (
      <div className="min-h-screen">
        <div className="px-5 pt-14 pb-4 flex items-center gap-3">
          <Link href="/rutinas" className="shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <h1 className="text-xl font-light" style={{ color: "rgba(255,255,255,0.9)" }}>Entrenar</h1>
        </div>
        <div className="text-center pt-20 px-8">
          <p className="text-sm font-light" style={{ color: "rgba(255,255,255,0.4)" }}>No tienes una rutina activa.</p>
          <Link
            href="/rutinas/nueva"
            className="inline-block mt-4 px-6 py-2.5 rounded-2xl text-xs font-semibold tracking-widest uppercase active:scale-[0.98] transition-transform"
            style={{ background: "#2abfbf", color: "#000", boxShadow: "0 4px 20px rgba(42,191,191,0.3)" }}
          >
            Crear rutina
          </Link>
        </div>
      </div>
    );
  }

  /* ── Phase 1: Select day ── */
  if (!selectedDia) {
    return (
      <div className="min-h-screen">
        <div className="px-5 pt-14 pb-6 flex items-center gap-3">
          <Link
            href="/rutinas"
            className="shrink-0 no-min-h"
            aria-label="Volver"
            style={{
              width: 44, height: 44, borderRadius: 14,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#ffffff",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <div className="min-w-0">
            <p style={{ fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, color: "var(--accent)" }}>
              {rutina?.nombre}
            </p>
            <h1 className="truncate" style={{ fontSize: 26, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.01em", lineHeight: 1.1, marginTop: 4 }}>
              ¿Qué día entrenas hoy?
            </h1>
          </div>
        </div>

        <div className="px-4 space-y-3">
          {rutina?.rutina_dias.map((dia) => (
            <button
              key={dia.id}
              onClick={() => selectDia(dia)}
              className="w-full text-left rounded-2xl transition-all active:scale-[0.98]"
              style={{ ...GLASS, padding: "18px 20px" }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p style={{ fontSize: 18, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.005em" }}>{dia.nombre}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
                    {dia.rutina_ejercicios.length} ejercicios · {dia.rutina_ejercicios.reduce((s, e) => s + e.series, 0)} series
                  </p>
                  <p className="truncate" style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
                    {dia.rutina_ejercicios.slice(0, 3).map((e) => e.nombre).join(" · ")}
                    {dia.rutina_ejercicios.length > 3 ? " …" : ""}
                  </p>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
                  <path d="M9 6l6 6-6 6" stroke="#2abfbf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ── Phase 2: Log session ── */
  const totalCompletadas = ejercicios.reduce((s, ej) => s + ej.seriesData.filter((sr) => sr.completada).length, 0);
  const totalSeries = ejercicios.reduce((s, ej) => s + ej.seriesData.length, 0);

  if (showWellness) {
    return (
      <WellnessCheckIn
        onComplete={() => { setShowWellness(false); setWellnessDone(true); }}
        onSkip={() => { setShowWellness(false); setWellnessDone(true); }}
      />
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <button
          onClick={() => { clearDraft(); isDiaLibre ? router.push("/rutinas") : setSelectedDia(null); }}
          className="shrink-0 no-min-h"
          aria-label="Volver"
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="min-w-0">
          <p style={{ fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, color: "var(--accent)" }}>
            {isDiaLibre ? "Día libre" : "Registro de hoy"}
          </p>
          <h1 className="truncate" style={{ fontSize: 26, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.01em", lineHeight: 1.1, marginTop: 4 }}>
            {isDiaLibre ? "Entrenamiento libre" : selectedDia.nombre}
          </h1>
        </div>
      </div>

      <div className="px-4 pb-[calc(160px+env(safe-area-inset-bottom))] space-y-3">

        {/* Progress */}
        <div className="rounded-2xl flex items-center gap-4" style={{ ...GLASS, padding: "16px 20px" }}>
          <div className="shrink-0">
            <p style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", fontFeatureSettings: "'tnum'", lineHeight: 1 }}>
              {totalCompletadas}<span style={{ color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>/{totalSeries}</span>
            </p>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
              series
            </p>
          </div>
          <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: "rgba(255,255,255,0.10)" }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: totalSeries ? `${(totalCompletadas / totalSeries) * 100}%` : "0%",
                background: "#2abfbf",
                boxShadow: "0 0 8px rgba(42,191,191,0.5)",
              }}
            />
          </div>
        </div>

        {/* Empty state for día libre */}
        {isDiaLibre && ejercicios.length === 0 && !showAddExtra && !saved && (
          <button
            type="button"
            onClick={() => setShowAddExtra(true)}
            className="w-full rounded-2xl px-6 py-10 flex flex-col items-center gap-3 transition-all active:scale-[0.98]"
            style={{
              background: "rgba(42,191,191,0.06)",
              border: "1px dashed rgba(42,191,191,0.3)",
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "rgba(42,191,191,0.12)", border: "0.5px solid rgba(42,191,191,0.25)" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="#2abfbf" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: "#2abfbf" }}>Añadir ejercicio</p>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                Registra ejercicios libremente
              </p>
            </div>
          </button>
        )}

        {/* Exercises */}
        {ejercicios.map((ej, ejIdx) => (
          <div
            key={ej.id}
            className="rounded-2xl overflow-hidden"
            style={{ border: "0.5px solid rgba(255,255,255,0.13)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}
          >
            {/* Exercise header */}
            <div
              className="px-5 py-4"
              style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
            >
              <p style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.005em", lineHeight: 1.2 }}>{ej.nombre}</p>
            </div>

            {/* Series */}
            <div style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
              {/* Column headers */}
              <div className="px-4 py-3 grid grid-cols-[36px_56px_1fr_1fr_52px] gap-3 items-center">
                {[
                  { l: "Ser.", c: "left" as const },
                  { l: "Obj.", c: "left" as const },
                  { l: "Kg", c: "center" as const },
                  { l: "Reps", c: "center" as const },
                  { l: "", c: "left" as const },
                ].map((h, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "0.10em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.65)",
                      textAlign: h.c,
                    }}
                  >
                    {h.l}
                  </span>
                ))}
              </div>

              {ej.seriesData.map((s, sIdx) => (
                <div
                  key={sIdx}
                  className="px-4 py-2.5 grid grid-cols-[36px_56px_1fr_1fr_52px] gap-3 items-center"
                  style={{
                    background: s.completada ? "rgba(42,191,191,0.08)" : undefined,
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 800, color: s.completada ? "#2abfbf" : "#ffffff", fontFeatureSettings: "'tnum'" }}>
                    {sIdx + 1}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>×{ej.repeticiones}</span>

                  <input
                    type="number" inputMode="decimal" min={0} step={0.5}
                    value={s.peso}
                    onChange={(e) => updateSerie(ejIdx, sIdx, "peso", e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="—"
                    className="w-full rounded-xl text-center outline-none transition-colors no-min-h"
                    style={{
                      height: 52,
                      padding: "0 8px",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.18)",
                      color: "#ffffff",
                      fontSize: 18,
                      fontWeight: 700,
                      opacity: s.completada ? 0.55 : 1,
                    }}
                  />
                  <input
                    type="number" inputMode="numeric" min={0}
                    value={s.repeticiones}
                    onChange={(e) => updateSerie(ejIdx, sIdx, "repeticiones", e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-full rounded-xl text-center outline-none transition-colors no-min-h"
                    style={{
                      height: 52,
                      padding: "0 8px",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.18)",
                      color: "#ffffff",
                      fontSize: 18,
                      fontWeight: 700,
                      opacity: s.completada ? 0.55 : 1,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => toggleSerie(ejIdx, sIdx)}
                    aria-label={s.completada ? "Desmarcar serie" : "Marcar serie completada"}
                    className="no-min-h"
                    style={{
                      width: 52, height: 52,
                      borderRadius: 14,
                      border: `2px solid ${s.completada ? "#2abfbf" : "rgba(255,255,255,0.20)"}`,
                      background: s.completada ? "rgba(42,191,191,0.20)" : "rgba(255,255,255,0.05)",
                      backdropFilter: "blur(10px)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
                      <path
                        d="M3.5 9L7.5 13L14.5 5"
                        stroke={s.completada ? "#2abfbf" : "rgba(255,255,255,0.55)"}
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              ))}
              {ej.ejercicio_id && historico[ej.ejercicio_id]?.length ? (
                <div
                  className="px-4 py-2 flex items-center gap-1.5"
                  style={{
                    color: "rgba(255,255,255,0.35)",
                    fontFamily: "var(--font-ui)",
                    fontSize: 12,
                    borderTop: "0.5px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
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
          </div>
        ))}

        {/* Add extra exercise */}
        {!saved && (
          showAddExtra ? (
            <div className="rounded-2xl px-5 py-5 space-y-4" style={GLASS}>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent)" }}>
                Añadir ejercicio extra
              </p>
              <EjercicioSelector
                value={extraName}
                ejercicioId={extraEjId}
                onChange={(nombre, ejId) => { setExtraName(nombre); setExtraEjId(ejId); }}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowAddExtra(false); setExtraName(""); setExtraEjId(null); }}
                  className="flex-1 transition-colors active:scale-[0.98]"
                  style={{
                    minHeight: 52,
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.65)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddExtra}
                  disabled={!extraName.trim() || addingExtra}
                  className="flex-1 transition-colors active:scale-[0.98] disabled:opacity-40"
                  style={{
                    minHeight: 52,
                    borderRadius: 14,
                    background: "rgba(42,191,191,0.18)",
                    color: "#2abfbf",
                    border: "1px solid rgba(42,191,191,0.4)",
                    fontSize: 15,
                    fontWeight: 800,
                  }}
                >
                  {addingExtra ? "Añadiendo..." : "Añadir"}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddExtra(true)}
              className="w-full flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              style={{
                minHeight: 56,
                borderRadius: 16,
                background: "rgba(255,255,255,0.04)",
                border: "1px dashed rgba(255,255,255,0.20)",
                color: "rgba(255,255,255,0.75)",
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Añadir ejercicio extra
            </button>
          )
        )}

        {/* Bloques cardio + funcional + fuerza (ad-hoc) del día */}
        {diaBlocks.length > 0 && (
          <div className="space-y-3">
            {diaBlocks.map((b) => {
              if (b.kind === "fuerza") {
                return (
                  <FuerzaBlockTrainer
                    key={b.uid}
                    block={b as FuerzaBlock}
                    inputs={fuerzaBlockInputs[b.uid] ?? {}}
                    onChange={(inputs) => setFuerzaBlockInputs((prev) => ({ ...prev, [b.uid]: inputs }))}
                  />
                );
              }
              if (b.kind === "cardio") {
                return (
                  <CardioBlockTrainer
                    key={b.uid}
                    block={b as CardioBlock}
                    rondas={cardioInputs[b.uid] ?? [makeCardioRondaInput()]}
                    onChange={(rondas) => setCardioInputs((prev) => ({ ...prev, [b.uid]: rondas }))}
                  />
                );
              }
              if (b.kind === "funcional") {
                return (
                  <FuncionalBlockTrainer
                    key={b.uid}
                    block={b as FuncionalBlock}
                    inputs={funcionalInputs[b.uid] ?? {}}
                    onChange={(inputs) => setFuncionalInputs((prev) => ({ ...prev, [b.uid]: inputs }))}
                  />
                );
              }
              return null;
            })}
          </div>
        )}

        {/* Editor in-line para añadir bloques cardio/funcional ad-hoc
            (especialmente útil en modo día libre) */}
        {!saved && (
          <div>
            <p
              className="mb-3 px-1"
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--accent)",
              }}
            >
              Bloques (cardio · funcional)
            </p>
            <BlockEditor
              blocks={diaBlocks}
              allowKinds={["fuerza", "cardio", "funcional"]}
              onAddSheetOpenChange={setBlockSheetOpen}
              onChange={(next) => {
                setDiaBlocks(next);
                // Cardio: limpia huérfanos + inicializa rondas para bloques nuevos
                setCardioInputs((prev) => {
                  const out: Record<string, CardioRondaInput[]> = {};
                  for (const b of next) {
                    if (b.kind !== "cardio") continue;
                    if (prev[b.uid]) {
                      out[b.uid] = prev[b.uid];
                    } else {
                      const rondas = Math.max(1, b.rondas ?? 1);
                      out[b.uid] = Array.from({ length: rondas }, () => makeCardioRondaInput());
                    }
                  }
                  return out;
                });
                // Funcional: limpia huérfanos + sincroniza ejercicios por bloque
                setFuncionalInputs((prev) => {
                  const out: Record<string, Record<string, FuncionalEjercicioInput>> = {};
                  for (const b of next) {
                    if (b.kind !== "funcional") continue;
                    const previo = prev[b.uid] ?? {};
                    const seg: Record<string, FuncionalEjercicioInput> = {};
                    for (const ej of b.ejercicios) {
                      seg[ej.uid] = previo[ej.uid] ?? { kg: "", reps: "", calorias: "", metros: "", completada: false };
                    }
                    out[b.uid] = seg;
                  }
                  return out;
                });
                // Fuerza ad-hoc: limpia huérfanos + sincroniza ejercicios y series
                setFuerzaBlockInputs((prev) => {
                  const out: Record<string, Record<string, FuerzaSerieInput[]>> = {};
                  for (const b of next) {
                    if (b.kind !== "fuerza") continue;
                    const previo = prev[b.uid] ?? {};
                    const seg: Record<string, FuerzaSerieInput[]> = {};
                    for (const ej of b.ejercicios) {
                      const target = Math.max(1, ej.series_objetivo ?? 1);
                      const ejPrev = previo[ej.uid];
                      seg[ej.uid] = ejPrev ?? Array.from({ length: target }, () => makeFuerzaSerieInput());
                    }
                    out[b.uid] = seg;
                  }
                  return out;
                });
              }}
            />
          </div>
        )}

        {saveError && <p className="text-xs text-center px-4" style={{ color: "rgba(255,120,120,0.9)" }}>{saveError}</p>}
      </div>

      {/* Finish button — se oculta cuando hay un sheet/modal abierto
          para no superponerse (Funcional al final del selector quedaba
          tapado por el botón). */}
      <div
        className="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 px-4 pb-[calc(56px+env(safe-area-inset-bottom)+8px)] pt-4"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.9) 60%, transparent)",
          zIndex: 30,
          visibility: blockSheetOpen || showFinalizeModal || saved ? "hidden" : "visible",
          pointerEvents: blockSheetOpen || showFinalizeModal ? "none" : "auto",
          transition: "opacity 0.15s ease",
          opacity: blockSheetOpen || showFinalizeModal ? 0 : 1,
        }}
      >
        <button
          onClick={() => setShowFinalizeModal(true)}
          disabled={isSaving || saved}
          className="w-full transition-all active:scale-[0.98] disabled:opacity-60"
          style={{
            minHeight: 64,
            padding: "20px 24px",
            borderRadius: 18,
            background: saved ? "rgba(42,191,191,0.15)" : "linear-gradient(180deg, #34d4d4 0%, #2abfbf 100%)",
            color: saved ? "#2abfbf" : "#000",
            border: saved ? "1px solid rgba(42,191,191,0.3)" : "none",
            boxShadow: saved ? undefined : "0 8px 28px rgba(42,191,191,0.45), inset 0 1px 0 rgba(255,255,255,0.30)",
            fontSize: 17,
            fontWeight: 800,
            letterSpacing: "-0.005em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <span>{saved ? "Entrenamiento guardado" : isSaving ? "Guardando…" : "Finalizar entrenamiento"}</span>
          {saved ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : !isSaving ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : null}
        </button>
      </div>

      {/* Modal de finalizar — RPE + duración + guardar */}
      {showFinalizeModal && !saved && (
        <FinalizeModal
          rpe={rpe}
          onRpeChange={setRpe}
          duracion={duracionManual}
          onDuracionChange={setDuracionManual}
          isSaving={isSaving}
          error={saveError}
          onCancel={() => { if (!isSaving) setShowFinalizeModal(false); }}
          onSave={() => { handleFinish(); }}
        />
      )}
    </div>
  );
}

function FinalizeModal({
  rpe,
  onRpeChange,
  duracion,
  onDuracionChange,
  isSaving,
  error,
  onCancel,
  onSave,
}: {
  rpe: number | null;
  onRpeChange: (v: number | null) => void;
  duracion: string;
  onDuracionChange: (v: string) => void;
  isSaving: boolean;
  error: string | null;
  onCancel: () => void;
  onSave: () => void;
}) {
  const FONT_UI = "var(--font-ui)";
  const duracionNum = parseInt(duracion, 10);
  const canSave = rpe != null && Number.isFinite(duracionNum) && duracionNum > 0;
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
      <button
        type="button"
        aria-label="Cancelar"
        onClick={onCancel}
        className="absolute inset-0 no-min-h"
        style={{ background: "transparent", border: "none", cursor: "pointer" }}
      />
      <div
        className="relative w-full"
        style={{
          maxWidth: 430,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          background: "rgba(15,15,15,0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "0.5px solid rgba(255,255,255,0.1)",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
        }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
        </div>
        <div className="flex items-center justify-between px-5 pt-3 pb-4">
          <h2
            style={{
              fontFamily: FONT_UI,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.95)",
            }}
          >
            Finalizar entreno
          </h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            aria-label="Cerrar"
            className="no-min-h"
            style={{
              width: 32, height: 32, borderRadius: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(255,255,255,0.06)",
              border: "0.5px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.6)",
              cursor: isSaving ? "wait" : "pointer",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-5">
          <RPECapture rpe={rpe} onRpeChange={onRpeChange} />

          <div>
            <p
              style={{
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(42,191,191,0.7)",
                fontFamily: FONT_UI,
                marginBottom: 8,
              }}
            >
              Duración
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={duracion}
                onChange={(e) => onDuracionChange(e.target.value.replace(/[^0-9]/g, ""))}
                onFocus={(e) => e.target.select()}
                placeholder="—"
                className="flex-1 outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "0.5px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  padding: "12px 14px",
                  color: "rgba(255,255,255,0.95)",
                  fontFamily: FONT_UI,
                  fontSize: 16,
                  fontWeight: 500,
                  textAlign: "center",
                }}
              />
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontFamily: FONT_UI, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                min
              </span>
            </div>
          </div>

          {error && (
            <p style={{ fontSize: 12, color: "#ff8080", textAlign: "center", fontFamily: FONT_UI }}>
              {error}
            </p>
          )}
        </div>

        <div className="px-5 pt-3 pb-[calc(20px+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave || isSaving}
            className="w-full py-4 rounded-2xl text-sm font-semibold tracking-widest uppercase transition-all disabled:opacity-30"
            style={{
              background: "#2abfbf",
              color: "#080808",
              fontFamily: FONT_UI,
              boxShadow: canSave ? "0 4px 24px rgba(42,191,191,0.35)" : undefined,
              cursor: canSave && !isSaving ? "pointer" : "not-allowed",
            }}
          >
            {isSaving ? "Guardando…" : "Guardar entreno"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function EntrenarPage() {
  return (
    <Suspense>
      <EntrenarInner />
    </Suspense>
  );
}
