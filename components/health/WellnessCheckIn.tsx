"use client";

import { useState, useTransition } from "react";
import { createBrowserClient } from "@supabase/ssr";

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

const PREGUNTAS = [
  { key: "sueno", label: "Sueño", pregunta: "¿Cómo has dormido esta noche?", opciones: ["Muy mal", "Mal", "Regular", "Bien", "Muy bien"] },
  { key: "fatiga", label: "Energía", pregunta: "¿Cómo te encuentras de cansado/a hoy?", opciones: ["Agotado/a", "Cansado/a", "Regular", "Con energía", "Con mucha energía"] },
  { key: "estres", label: "Estrés", pregunta: "¿Cómo está tu nivel de estrés hoy?", opciones: ["Muy alto", "Alto", "Moderado", "Bajo", "Muy bajo"] },
  { key: "animo", label: "Ánimo", pregunta: "¿Cómo es tu estado de ánimo?", opciones: ["Muy bajo", "Bajo", "Neutro", "Positivo", "Muy positivo"] },
  { key: "dolor", label: "Dolor", pregunta: "¿Tienes algún dolor o molestia muscular/articular hoy?", opciones: ["Dolor intenso", "Dolor notable", "Molestia leve", "Casi ninguna", "Ninguna"] },
];

type WellnessAnswers = Record<string, number>;

interface WellnessCheckInProps {
  sesionId?: string;
  onComplete: () => void;
  onSkip: () => void;
  ctaLabel?: string;
  onSubmit?: (answers: { sueno: number; fatiga: number; estres: number; animo: number; dolor: number; omitido: boolean }) => Promise<{ ok: boolean; error?: string }>;
}

export default function WellnessCheckIn({ sesionId, onComplete, onSkip, ctaLabel = "Iniciar entrenamiento", onSubmit }: WellnessCheckInProps) {
  const [answers, setAnswers] = useState<WellnessAnswers>({});
  const [isSaving, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const totalAnswered = Object.keys(answers).length;
  const allDone = totalAnswered === PREGUNTAS.length;
  const puntuacion = Object.values(answers).reduce((s, v) => s + v, 0);

  function getColor(score: number) {
    if (score >= 20) return "#2abfbf";
    if (score >= 13) return "#ffb040";
    return "#ff8080";
  }

  async function handleGuardar() {
    if (!allDone) return;
    setError(null);
    startSave(async () => {
      if (onSubmit) {
        const res = await onSubmit({
          sueno: answers.sueno, fatiga: answers.fatiga, estres: answers.estres, animo: answers.animo, dolor: answers.dolor, omitido: false,
        });
        if (!res.ok) { setError(res.error ?? "Error al guardar. Inténtalo de nuevo."); return; }
        onComplete();
        return;
      }
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const today = new Date().toISOString().split("T")[0];
      const { error: err } = await supabase.from("wellness_entries").upsert({
        user_id: user.id, sesion_id: sesionId || null, fecha: today,
        sueno: answers.sueno, fatiga: answers.fatiga, estres: answers.estres, animo: answers.animo, dolor: answers.dolor, omitido: false,
      }, { onConflict: "user_id,fecha" });
      if (err) { setError("Error al guardar. Inténtalo de nuevo."); return; }
      onComplete();
    });
  }

  async function handleOmitir() {
    if (onSubmit) {
      await onSubmit({ sueno: 3, fatiga: 3, estres: 3, animo: 3, dolor: 3, omitido: true });
      onSkip();
      return;
    }
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { onSkip(); return; }
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("wellness_entries").upsert({
      user_id: user.id, sesion_id: sesionId || null, fecha: today,
      sueno: 3, fatiga: 3, estres: 3, animo: 3, dolor: 3, omitido: true,
    }, { onConflict: "user_id,fecha" });
    onSkip();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(8,8,8,0.97)", backdropFilter: "blur(20px)" }}>
      <div className="max-w-[430px] w-full mx-auto flex flex-col h-full px-4 pt-14 pb-8">
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="mb-1" style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(42,191,191,0.7)", fontFamily: "var(--font-condensed)" }}>Check-in pre-entreno</p>
              <h1 style={{ fontSize: "2rem", fontWeight: 300, lineHeight: 1.1, color: "rgba(255,255,255,0.95)", fontFamily: "var(--font-serif)" }}>¿Cómo estás hoy?</h1>
            </div>
            <button type="button" onClick={handleOmitir} className="shrink-0 mt-1 text-[10px] tracking-[0.2em] uppercase transition-colors" style={{ color: "rgba(255,255,255,0.35)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-condensed)" }}>Omitir hoy</button>
          </div>
          <div className="mt-4 h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(totalAnswered / PREGUNTAS.length) * 100}%`, background: "#2abfbf", boxShadow: "0 0 8px rgba(42,191,191,0.5)" }} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 pb-4">
          {PREGUNTAS.map((q) => (
            <div key={q.key} className="rounded-2xl p-4" style={GLASS}>
              <p className="mb-0.5" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(42,191,191,0.6)", fontFamily: "var(--font-condensed)" }}>{q.label}</p>
              <p className="mb-3" style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-condensed)", letterSpacing: "0.03em", lineHeight: 1.4 }}>{q.pregunta}</p>
              <div className="flex gap-1.5">
                {q.opciones.map((opcion, idx) => {
                  const valor = idx + 1;
                  const selected = answers[q.key] === valor;
                  return (
                    <button key={idx} type="button" onClick={() => setAnswers((prev) => ({ ...prev, [q.key]: valor }))} className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all" style={{ background: selected ? "rgba(42,191,191,0.12)" : "rgba(255,255,255,0.04)", border: selected ? "0.5px solid rgba(42,191,191,0.4)" : "0.5px solid rgba(255,255,255,0.06)" }} title={opcion}>
                      <div className="rounded-full transition-all" style={{ width: 8, height: 8, background: selected ? "#2abfbf" : "rgba(255,255,255,0.12)", boxShadow: selected ? "0 0 6px rgba(42,191,191,0.6)" : "none" }} />
                      <span className="text-[10px] font-semibold" style={{ color: selected ? "#2abfbf" : "rgba(255,255,255,0.25)", fontFamily: "var(--font-condensed)" }}>{valor}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-condensed)" }}>{q.opciones[0]}</span>
                <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-condensed)" }}>{q.opciones[4]}</span>
              </div>
            </div>
          ))}
        </div>
        {allDone && (
          <div className="rounded-2xl px-4 py-3 mb-3 flex items-center justify-between" style={{ background: `rgba(${puntuacion >= 20 ? "42,191,191" : puntuacion >= 13 ? "255,176,64" : "255,128,128"},0.08)`, border: `0.5px solid rgba(${puntuacion >= 20 ? "42,191,191" : puntuacion >= 13 ? "255,176,64" : "255,128,128"},0.25)` }}>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-condensed)" }}>Estado general</p>
            <p className="text-sm font-semibold" style={{ color: getColor(puntuacion), fontFamily: "var(--font-condensed)" }}>{puntuacion >= 20 ? "Bueno para entrenar" : puntuacion >= 13 ? "Entrenar con precaución" : "Considera descansar hoy"}</p>
          </div>
        )}
        {error && <p className="text-xs text-center mb-2" style={{ color: "#ff8080" }}>{error}</p>}
        <button type="button" onClick={handleGuardar} disabled={!allDone || isSaving} className="w-full py-4 rounded-2xl text-sm font-semibold tracking-widest uppercase transition-all disabled:opacity-30" style={{ background: "#2abfbf", color: "#000", fontFamily: "var(--font-condensed)", boxShadow: "0 4px 24px rgba(42,191,191,0.3)" }}>{isSaving ? "Guardando…" : ctaLabel}</button>
      </div>
    </div>
  );
}
