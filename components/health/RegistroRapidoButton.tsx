"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const FONT_UI = "var(--font-ui)";

const PREGUNTAS = [
  { key: "sueno",  label: "Sueño",  pregunta: "¿Cómo has dormido esta noche?",                opciones: ["Muy mal",       "Mal",         "Regular",        "Bien",            "Muy bien"] },
  { key: "fatiga", label: "Energía", pregunta: "¿Cómo te encuentras de cansado/a hoy?",        opciones: ["Agotado/a",     "Cansado/a",   "Regular",        "Con energía",     "Con mucha energía"] },
  { key: "estres", label: "Estrés", pregunta: "¿Cómo está tu nivel de estrés hoy?",            opciones: ["Muy alto",      "Alto",        "Moderado",       "Bajo",            "Muy bajo"] },
  { key: "animo",  label: "Ánimo",  pregunta: "¿Cómo es tu estado de ánimo?",                  opciones: ["Muy bajo",      "Bajo",        "Neutro",         "Positivo",        "Muy positivo"] },
  { key: "dolor",  label: "Dolor",  pregunta: "¿Tienes algún dolor o molestia hoy?",           opciones: ["Dolor intenso", "Dolor notable", "Molestia leve", "Casi ninguna",    "Ninguna"] },
] as const;

type WellnessKey = typeof PREGUNTAS[number]["key"];
type WellnessAnswers = Partial<Record<WellnessKey, number>>;

interface Props {
  proximoDiaId: string;
}

export default function RegistroRapidoButton({ proximoDiaId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rpe, setRpe] = useState<number | null>(null);
  const [duracion, setDuracion] = useState("");
  const [answers, setAnswers] = useState<WellnessAnswers>({});
  const [isSaving, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const wellnessDone = PREGUNTAS.every((q) => answers[q.key] != null);
  const duracionNum = parseInt(duracion, 10);
  const canSave = rpe != null && Number.isFinite(duracionNum) && duracionNum > 0 && wellnessDone;

  function reset() {
    setRpe(null);
    setDuracion("");
    setAnswers({});
    setError(null);
  }

  function close() {
    if (isSaving) return;
    setOpen(false);
    reset();
  }

  function handleSave() {
    if (!canSave) return;
    setError(null);
    startSave(async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Sesión no válida."); return; }

      const today = new Date().toISOString().split("T")[0];

      const { data: sesion, error: sesionErr } = await supabase
        .from("sesiones")
        .insert({
          user_id: user.id,
          dia_id: proximoDiaId,
          fecha: today,
          completada: true,
          rpe: rpe!,
          duracion_minutos: duracionNum,
        })
        .select("id")
        .single();

      if (sesionErr || !sesion) {
        setError(`No se pudo guardar la sesión. ${sesionErr?.message ?? ""}`);
        return;
      }

      const { error: wellnessErr } = await supabase
        .from("wellness_entries")
        .upsert(
          {
            user_id: user.id,
            sesion_id: sesion.id,
            fecha: today,
            sueno: answers.sueno!,
            fatiga: answers.fatiga!,
            estres: answers.estres!,
            animo: answers.animo!,
            dolor: answers.dolor!,
            omitido: false,
          },
          { onConflict: "user_id,fecha" }
        );

      if (wellnessErr) {
        setError(`Sesión creada pero error en wellness. ${wellnessErr.message}`);
        return;
      }

      setOpen(false);
      reset();
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left transition-all active:scale-[0.98]"
        style={{
          background: "rgba(42,191,191,0.06)",
          border: "0.5px solid rgba(42,191,191,0.25)",
          borderRadius: 14,
          padding: "18px 20px",
          fontFamily: FONT_UI,
          cursor: "pointer",
        }}
      >
        <span
          className="block uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.18em",
            color: "#2abfbf",
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          ⚡ Registro rápido de entrenamiento
        </span>
        <span
          className="block"
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.7)",
            fontWeight: 400,
            marginTop: 8,
            lineHeight: 1.45,
          }}
        >
          Para los días que no tienes tiempo. Tu progreso igual cuenta.
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={close}
            className="absolute inset-0 no-min-h"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: "none", cursor: "pointer" }}
          />

          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full"
            style={{
              maxWidth: 430,
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              background: "rgba(15,15,15,0.95)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderTop: "0.5px solid rgba(255,255,255,0.1)",
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
                Registro rápido de entrenamiento
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar"
                className="no-min-h"
                style={{
                  width: 32, height: 32, borderRadius: 16,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(255,255,255,0.06)",
                  border: "0.5px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.6)",
                  cursor: "pointer",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <p
              className="px-5 pb-4"
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.45)",
                fontFamily: FONT_UI,
                fontWeight: 400,
                lineHeight: 1.5,
              }}
            >
              Registra tu sesión en segundos. Sin series, solo dinos cómo fue tu entreno para que podamos calcular tu carga y hacer seguimiento de tu progreso.
            </p>

            <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-5">
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
                  Esfuerzo percibido (RPE)
                </p>
                <div className="grid grid-cols-10 gap-1.5">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                    const selected = rpe === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRpe(n)}
                        className="no-min-h"
                        style={{
                          height: 36,
                          borderRadius: 10,
                          fontFamily: FONT_UI,
                          fontSize: 12,
                          fontWeight: 600,
                          background: selected ? "#2abfbf" : "rgba(255,255,255,0.06)",
                          color: selected ? "#080808" : "rgba(255,255,255,0.85)",
                          border: selected ? "0.5px solid rgba(42,191,191,0.6)" : "0.5px solid rgba(255,255,255,0.08)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>

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
                    onChange={(e) => setDuracion(e.target.value.replace(/[^0-9]/g, ""))}
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

              <div className="space-y-3">
                <p
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "rgba(42,191,191,0.7)",
                    fontFamily: FONT_UI,
                  }}
                >
                  Wellness
                </p>
                {PREGUNTAS.map((q) => (
                  <div
                    key={q.key}
                    className="rounded-2xl p-4"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "0.5px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(42,191,191,0.6)", fontFamily: FONT_UI, marginBottom: 2 }}>
                      {q.label}
                    </p>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontFamily: FONT_UI, lineHeight: 1.4, marginBottom: 10 }}>
                      {q.pregunta}
                    </p>
                    <div className="flex gap-1.5">
                      {q.opciones.map((opcion, idx) => {
                        const valor = idx + 1;
                        const selected = answers[q.key] === valor;
                        return (
                          <button
                            key={idx}
                            type="button"
                            title={opcion}
                            onClick={() => setAnswers((prev) => ({ ...prev, [q.key]: valor }))}
                            className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all no-min-h"
                            style={{
                              background: selected ? "rgba(42,191,191,0.12)" : "rgba(255,255,255,0.04)",
                              border: selected ? "0.5px solid rgba(42,191,191,0.4)" : "0.5px solid rgba(255,255,255,0.06)",
                              cursor: "pointer",
                            }}
                          >
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: selected ? "#2abfbf" : "rgba(255,255,255,0.12)", boxShadow: selected ? "0 0 6px rgba(42,191,191,0.6)" : "none" }} />
                            <span style={{ fontSize: 10, fontWeight: 600, color: selected ? "#2abfbf" : "rgba(255,255,255,0.25)", fontFamily: FONT_UI }}>
                              {valor}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-1">
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: FONT_UI }}>{q.opciones[0]}</span>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: FONT_UI }}>{q.opciones[4]}</span>
                    </div>
                  </div>
                ))}
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
                onClick={handleSave}
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
                {isSaving ? "Guardando…" : "Completar entreno"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
