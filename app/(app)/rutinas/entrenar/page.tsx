"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import EjercicioSelector from "@/components/EjercicioSelector";
import WellnessCheckIn from "@/components/health/WellnessCheckIn";
import RPECapture from "@/components/health/RPECapture";
import DuracionCapture from "@/components/health/DuracionCapture";

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
  const [historico, setHistorico] = useState<HistorialMap>({});

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

    supabase
      .from("rutinas")
      .select("id, nombre, rutina_dias(id, nombre, orden, rutina_ejercicios(id, nombre, series, repeticiones, orden, ejercicio_id))")
      .eq("activa", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
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
      });
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

      const { data } = await supabase
        .from("series_realizadas")
        .select("numero_serie, peso, repeticiones, ejercicio_catalogo_id, sesion_id, sesiones!inner(id, user_id, fecha)")
        .eq("sesiones.user_id", user.id)
        .in("ejercicio_catalogo_id", catalogIds)
        .order("fecha", { foreignTable: "sesiones", ascending: false })
        .order("numero_serie", { ascending: true })
        .limit(300);

      if (cancelled || !data) return;

      const latestSesionByEj = new Map<string, string>();
      const result: HistorialMap = {};
      for (const id of catalogIds) result[id] = [];

      for (const row of data as Array<{
        numero_serie: number;
        peso: number | null;
        repeticiones: number | null;
        ejercicio_catalogo_id: string | null;
        sesion_id: string;
      }>) {
        const catId = row.ejercicio_catalogo_id;
        if (!catId) continue;
        if (!latestSesionByEj.has(catId)) latestSesionByEj.set(catId, row.sesion_id);
        if (latestSesionByEj.get(catId) !== row.sesion_id) continue;
        result[catId].push({
          serie: row.numero_serie,
          peso: row.peso,
          reps: row.repeticiones,
        });
      }

      Object.values(result).forEach((arr) => arr.sort((a, b) => a.serie - b.serie));
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
    maybeShowWellness();
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
          <Link href="/rutinas" className="shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>{rutina?.nombre}</p>
            <h1 className="text-xl font-light" style={{ color: "rgba(255,255,255,0.9)" }}>¿Qué día entrenas hoy?</h1>
          </div>
        </div>

        <div className="px-4 space-y-2">
          {rutina?.rutina_dias.map((dia) => (
            <button
              key={dia.id}
              onClick={() => selectDia(dia)}
              className="w-full text-left rounded-2xl px-4 py-4 transition-all active:scale-[0.98]"
              style={GLASS}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-light" style={{ color: "rgba(255,255,255,0.9)" }}>{dia.nombre}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {dia.rutina_ejercicios.length} ejercicios · {dia.rutina_ejercicios.reduce((s, e) => s + e.series, 0)} series
                  </p>
                  <p className="text-[10px] mt-1 truncate" style={{ color: "rgba(255,255,255,0.2)" }}>
                    {dia.rutina_ejercicios.slice(0, 3).map((e) => e.nombre).join(" · ")}
                    {dia.rutina_ejercicios.length > 3 ? " …" : ""}
                  </p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
                  <path d="M9 6l6 6-6 6" stroke="#2abfbf" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
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
          className="shrink-0"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: isDiaLibre ? "#2abfbf" : "rgba(255,255,255,0.3)" }}>
            {isDiaLibre ? "día libre" : "registro de hoy"}
          </p>
          <h1 className="text-xl font-light truncate" style={{ color: "rgba(255,255,255,0.9)" }}>
            {isDiaLibre ? "Entrenamiento libre" : selectedDia.nombre}
          </h1>
        </div>
      </div>

      <div className="px-4 pb-[calc(96px+env(safe-area-inset-bottom))] space-y-3">

        {/* Progress */}
        <div className="rounded-2xl px-4 py-3 flex items-center gap-4" style={GLASS}>
          <div className="shrink-0">
            <p className="text-lg font-light" style={{ color: "rgba(255,255,255,0.9)" }}>{totalCompletadas}/{totalSeries}</p>
            <p className="text-[9px] tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>series</p>
          </div>
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
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
              className="px-4 py-3"
              style={{ background: "rgba(255,255,255,0.09)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
            >
              <p className="text-sm font-light" style={{ color: "rgba(255,255,255,0.88)" }}>{ej.nombre}</p>
            </div>

            {/* Series */}
            <div style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
              {/* Column headers */}
              <div className="px-4 py-1.5 grid grid-cols-[28px_52px_1fr_1fr_36px] gap-2 items-center">
                {["ser.", "obj.", "kg", "reps", ""].map((h, i) => (
                  <span key={i} className={`text-[8px] tracking-wider uppercase ${i === 2 || i === 3 ? "text-center" : ""}`} style={{ color: "rgba(255,255,255,0.2)" }}>{h}</span>
                ))}
              </div>

              {ej.seriesData.map((s, sIdx) => (
                <div
                  key={sIdx}
                  className="px-4 py-2 grid grid-cols-[28px_52px_1fr_1fr_36px] gap-2 items-center"
                  style={{
                    background: s.completada ? "rgba(42,191,191,0.06)" : undefined,
                    borderTop: "0.5px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span className="text-[10px] font-mono" style={{ color: s.completada ? "#2abfbf" : "rgba(255,255,255,0.3)" }}>
                    {String(sIdx + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>×{ej.repeticiones}</span>

                  <input
                    type="number" inputMode="decimal" min={0} step={0.5}
                    value={s.peso}
                    onChange={(e) => updateSerie(ejIdx, sIdx, "peso", e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="—"
                    className="w-full rounded-lg px-1 py-2 text-xs text-center outline-none transition-colors"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "0.5px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.9)",
                      opacity: s.completada ? 0.45 : 1,
                    }}
                  />
                  <input
                    type="number" inputMode="numeric" min={0}
                    value={s.repeticiones}
                    onChange={(e) => updateSerie(ejIdx, sIdx, "repeticiones", e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-full rounded-lg px-1 py-2 text-xs text-center outline-none transition-colors"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "0.5px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.9)",
                      opacity: s.completada ? 0.45 : 1,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => toggleSerie(ejIdx, sIdx)}
                    style={{
                      width: 44, height: 44,
                      borderRadius: 10,
                      border: `1.5px solid ${s.completada ? "#2abfbf" : "rgba(255,255,255,0.1)"}`,
                      background: s.completada ? "rgba(42,191,191,0.15)" : "rgba(255,255,255,0.03)",
                      backdropFilter: "blur(10px)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path
                        d="M3.5 9L7.5 13L14.5 5"
                        stroke={s.completada ? "#2abfbf" : "rgba(255,255,255,0.2)"}
                        strokeWidth="2"
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
            <div className="rounded-2xl px-4 py-4 space-y-3" style={GLASS}>
              <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: "#2abfbf" }}>Añadir ejercicio extra</p>
              <EjercicioSelector
                value={extraName}
                ejercicioId={extraEjId}
                onChange={(nombre, ejId) => { setExtraName(nombre); setExtraEjId(ejId); }}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowAddExtra(false); setExtraName(""); setExtraEjId(null); }}
                  className="flex-1 py-2.5 rounded-xl text-xs transition-colors"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "0.5px solid rgba(255,255,255,0.1)" }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddExtra}
                  disabled={!extraName.trim() || addingExtra}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40"
                  style={{ background: "rgba(42,191,191,0.15)", color: "#2abfbf", border: "0.5px solid rgba(42,191,191,0.3)" }}
                >
                  {addingExtra ? "Añadiendo..." : "Añadir"}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddExtra(true)}
              className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-xs transition-all active:scale-[0.98]"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "0.5px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                color: "rgba(255,255,255,0.35)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Añadir ejercicio extra
            </button>
          )
        )}

        <DuracionCapture duracion={duracionManual} onDuracionChange={setDuracionManual} />
        <RPECapture rpe={rpe} onRpeChange={setRpe} />

        {saveError && <p className="text-xs text-center px-4" style={{ color: "rgba(255,120,120,0.9)" }}>{saveError}</p>}
      </div>

      {/* Finish button */}
      <div
        className="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 px-4 pb-[calc(56px+env(safe-area-inset-bottom)+8px)] pt-4"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9) 60%, transparent)" }}
      >
        <button
          onClick={handleFinish}
          disabled={isSaving || saved}
          className="w-full py-4 rounded-2xl font-semibold text-sm tracking-widest uppercase transition-all disabled:opacity-60"
          style={{
            background: saved ? "rgba(42,191,191,0.15)" : "#2abfbf",
            color: saved ? "#2abfbf" : "#000",
            border: saved ? "0.5px solid rgba(42,191,191,0.3)" : "none",
            boxShadow: saved ? undefined : "0 4px 24px rgba(42,191,191,0.4), inset 0 1px 0 rgba(255,255,255,0.25)",
          }}
        >
          {saved ? "Entrenamiento guardado ✓" : isSaving ? "Guardando…" : "Finalizar entrenamiento"}
        </button>
      </div>
    </div>
  );
}

export default function EntrenarPage() {
  return (
    <Suspense>
      <EntrenarInner />
    </Suspense>
  );
}
