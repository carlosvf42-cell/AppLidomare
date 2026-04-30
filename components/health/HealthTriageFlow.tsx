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

const GLASS_ACTIVE: React.CSSProperties = {
  background: "rgba(42,191,191,0.1)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "0.5px solid rgba(42,191,191,0.4)",
  boxShadow: "inset 0 1px 0 rgba(42,191,191,0.1), 0 4px 24px rgba(42,191,191,0.15)",
};

type Answers = Record<string, string | boolean | null>;

const PERSONAL_FIELDS = [
  { key: "fecha_nacimiento", label: "Fecha de nacimiento", type: "date" },
  { key: "peso_kg", label: "Peso (kg)", type: "number", placeholder: "70" },
  { key: "altura_cm", label: "Altura (cm)", type: "number", placeholder: "175" },
];

const SEXO_OPTIONS = [
  { value: "masculino", label: "Masculino" },
  { value: "femenino", label: "Femenino" },
];

const PARQ_A = [
  { key: "a1", text: "¿Le ha dicho su médico alguna vez que padece una enfermedad cardíaca y que sólo debe hacer aquella actividad física que le aconseje un médico?" },
  { key: "a2", text: "¿Tiene dolor en el pecho cuando hace actividad física?" },
  { key: "a3", text: "En el último mes, ¿ha tenido dolor en el pecho cuando no hacía actividad física?" },
  { key: "a4", text: "¿Pierde el equilibrio debido a mareos o se ha desmayado alguna vez?" },
  { key: "a5", text: "¿Le receta su médico algún medicamento para la tensión arterial o un problema cardíaco?" },
];

const PARQ_B = [
  { key: "b1", text: "¿Tiene problemas en huesos o articulaciones (por ejemplo, espalda, rodilla o cadera) que puedan empeorar si aumenta la actividad física?" },
  { key: "b2", text: "¿Conoce alguna razón por la cual no debería realizar actividad física?" },
];

const OBJETIVO_OPTIONS = [
  { value: "perder_peso", label: "Perder peso" },
  { value: "ganar_musculo", label: "Ganar músculo" },
  { value: "mejorar_rendimiento", label: "Mejorar rendimiento" },
  { value: "salud_general", label: "Salud general" },
  { value: "rehabilitacion", label: "Rehabilitación" },
];

const DIAS_OPTIONS = [
  { value: "0", label: "No entreno" },
  { value: "1-2", label: "1–2 días" },
  { value: "3-4", label: "3–4 días" },
  { value: "5+", label: "5 o más días" },
];

function calcularEstado(answers: Answers): "danger" | "caution" | "ok" {
  const hayPeligro = PARQ_A.some((q) => answers[q.key] === true);
  if (hayPeligro) return "danger";
  const hayCaution = PARQ_B.some((q) => answers[q.key] === true);
  if (hayCaution) return "caution";
  return "ok";
}

export default function HealthTriageFlow({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState<"personal" | "parq_a" | "parq_b" | "contexto" | "consentimiento" | "resultado">("personal");
  const [personal, setPersonal] = useState<Record<string, string>>({});
  const [sexo, setSexo] = useState<string>("");
  const [answers, setAnswers] = useState<Answers>({});
  const [objetivo, setObjetivo] = useState("");
  const [diasEntreno, setDiasEntreno] = useState("");
  const [entrena3meses, setEntrena3meses] = useState<boolean | null>(null);
  const [zonaMolestia, setZonaMolestia] = useState("");
  const [consentimiento, setConsentimiento] = useState(false);
  const [isSaving, startSave] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estado = calcularEstado(answers);

  function handlePersonalNext() {
    if (!personal.fecha_nacimiento || !personal.peso_kg || !personal.altura_cm || !sexo) return;
    setStep("parq_a");
  }

  function setAnswer(key: string, value: boolean) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function allAnswered(questions: { key: string }[]) {
    return questions.every((q) => answers[q.key] !== undefined);
  }

  async function handleGuardar() {
    if (!consentimiento) return;
    setError(null);
    startSave(async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("user_profiles").upsert({
        user_id: user.id,
        fecha_nacimiento: personal.fecha_nacimiento,
        peso_kg: parseFloat(personal.peso_kg),
        altura_cm: parseFloat(personal.altura_cm),
        sexo,
        objetivo,
        dias_entreno_semana: diasEntreno,
        entrena_mas_3_meses: entrena3meses,
        zona_molestia: zonaMolestia || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      const { error: triageErr } = await supabase.from("health_assessments").upsert({
        user_id: user.id,
        respuestas: { ...answers, objetivo, dias_entreno_semana: diasEntreno, entrena_mas_3_meses: entrena3meses, zona_molestia: zonaMolestia },
        estado,
        consentimiento_aceptado: true,
        consentimiento_fecha: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      if (triageErr) { setError("Error al guardar. Inténtalo de nuevo."); return; }
      setSaved(true);
      setStep("resultado");
    });
  }

  const steps = ["personal", "parq_a", "parq_b", "contexto", "consentimiento"];
  const currentIdx = steps.indexOf(step);
  const progress = step === "resultado" ? 100 : ((currentIdx) / steps.length) * 100;

  return (
    <div className="min-h-screen" style={{ background: "#080808" }}>
      <div className="max-w-[430px] mx-auto px-4 pt-14 pb-12">
        {step !== "resultado" && (
          <div className="mb-8">
            <p className="mb-2" style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(42,191,191,0.7)", fontFamily: "var(--font-ui)" }}>Perfil de salud</p>
            <h1 className="mb-4" style={{ fontSize: "2rem", fontWeight: 300, lineHeight: 1.1, color: "rgba(255,255,255,0.95)", fontFamily: "var(--font-serif)" }}>
              {step === "personal" && "Datos personales"}
              {step === "parq_a" && "Cuestionario PAR-Q"}
              {step === "parq_b" && "Cuestionario PAR-Q"}
              {step === "contexto" && "Tu actividad física"}
              {step === "consentimiento" && "Revisión y consentimiento"}
            </h1>
            <div className="h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "#2abfbf", boxShadow: "0 0 8px rgba(42,191,191,0.5)" }} />
            </div>
          </div>
        )}

        {step === "personal" && (
          <div className="space-y-4">
            {PERSONAL_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="block text-[10px] tracking-[0.15em] uppercase mb-2" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-ui)" }}>{f.label}</label>
                <input type={f.type} value={personal[f.key] || ""} placeholder={f.placeholder} onChange={(e) => setPersonal((p) => ({ ...p, [f.key]: e.target.value }))} className="w-full px-4 py-3 rounded-2xl text-sm outline-none" style={{ ...GLASS, color: "rgba(255,255,255,0.9)", fontFamily: "var(--font-ui)", colorScheme: "dark" }} />
              </div>
            ))}
            <div>
              <label className="block text-[10px] tracking-[0.15em] uppercase mb-2" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-ui)" }}>Sexo biológico</label>
              <div className="grid grid-cols-2 gap-2">
                {SEXO_OPTIONS.map((o) => (
                  <button key={o.value} type="button" onClick={() => setSexo(o.value)} className="py-3 rounded-2xl text-xs transition-all" style={sexo === o.value ? GLASS_ACTIVE : GLASS}>
                    <span style={{ color: sexo === o.value ? "#2abfbf" : "rgba(255,255,255,0.5)", fontFamily: "var(--font-ui)" }}>{o.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <button type="button" onClick={handlePersonalNext} disabled={!personal.fecha_nacimiento || !personal.peso_kg || !personal.altura_cm || !sexo} className="w-full py-4 rounded-2xl text-sm font-semibold tracking-widest uppercase transition-all disabled:opacity-30 mt-4" style={{ background: "#2abfbf", color: "#000", fontFamily: "var(--font-ui)", boxShadow: "0 4px 24px rgba(42,191,191,0.3)" }}>Continuar</button>
          </div>
        )}

        {step === "parq_a" && (
          <div className="space-y-3">
            <p className="mb-4" style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-ui)", lineHeight: 1.6, letterSpacing: "0.02em" }}>Responde con honestidad. El sentido común es la mejor guía.</p>
            {PARQ_A.map((q, i) => (
              <div key={q.key} className="rounded-2xl p-4" style={GLASS}>
                <p className="mb-3" style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-ui)", lineHeight: 1.5, letterSpacing: "0.03em" }}>
                  <span style={{ color: "rgba(42,191,191,0.5)", marginRight: 8 }}>{i + 1}.</span>{q.text}
                </p>
                <div className="flex gap-2">
                  {[{ v: true, l: "Sí" }, { v: false, l: "No" }].map(({ v, l }) => (
                    <button key={l} type="button" onClick={() => setAnswer(q.key, v)} className="flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-widest uppercase transition-all"
                      style={answers[q.key] === v ? { background: v ? "rgba(255,80,80,0.15)" : "rgba(42,191,191,0.12)", border: `0.5px solid ${v ? "rgba(255,80,80,0.4)" : "rgba(42,191,191,0.4)"}`, color: v ? "#ff8080" : "#2abfbf", fontFamily: "var(--font-ui)" } : { ...GLASS, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-ui)" }}
                    >{l}</button>
                  ))}
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setStep("parq_b")} disabled={!allAnswered(PARQ_A)} className="w-full py-4 rounded-2xl text-sm font-semibold tracking-widest uppercase transition-all disabled:opacity-30 mt-2" style={{ background: "#2abfbf", color: "#000", fontFamily: "var(--font-ui)", boxShadow: "0 4px 24px rgba(42,191,191,0.3)" }}>Continuar</button>
          </div>
        )}

        {step === "parq_b" && (
          <div className="space-y-3">
            <p className="mb-4" style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-ui)", lineHeight: 1.6, letterSpacing: "0.02em" }}>Últimas preguntas del cuestionario PAR-Q.</p>
            {PARQ_B.map((q, i) => (
              <div key={q.key} className="rounded-2xl p-4" style={GLASS}>
                <p className="mb-3" style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-ui)", lineHeight: 1.5, letterSpacing: "0.03em" }}>
                  <span style={{ color: "rgba(42,191,191,0.5)", marginRight: 8 }}>{PARQ_A.length + i + 1}.</span>{q.text}
                </p>
                <div className="flex gap-2">
                  {[{ v: true, l: "Sí" }, { v: false, l: "No" }].map(({ v, l }) => (
                    <button key={l} type="button" onClick={() => setAnswer(q.key, v)} className="flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-widest uppercase transition-all"
                      style={answers[q.key] === v ? { background: v ? "rgba(255,160,0,0.15)" : "rgba(42,191,191,0.12)", border: `0.5px solid ${v ? "rgba(255,160,0,0.4)" : "rgba(42,191,191,0.4)"}`, color: v ? "#ffb040" : "#2abfbf", fontFamily: "var(--font-ui)" } : { ...GLASS, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-ui)" }}
                    >{l}</button>
                  ))}
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setStep("contexto")} disabled={!allAnswered(PARQ_B)} className="w-full py-4 rounded-2xl text-sm font-semibold tracking-widest uppercase transition-all disabled:opacity-30 mt-2" style={{ background: "#2abfbf", color: "#000", fontFamily: "var(--font-ui)", boxShadow: "0 4px 24px rgba(42,191,191,0.3)" }}>Continuar</button>
          </div>
        )}

        {step === "contexto" && (
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] tracking-[0.15em] uppercase mb-2" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-ui)" }}>Objetivo principal</label>
              <div className="grid grid-cols-2 gap-2">
                {OBJETIVO_OPTIONS.map((o) => (
                  <button key={o.value} type="button" onClick={() => setObjetivo(o.value)} className="py-3 px-4 rounded-2xl text-xs text-left transition-all" style={objetivo === o.value ? GLASS_ACTIVE : GLASS}>
                    <span style={{ color: objetivo === o.value ? "#2abfbf" : "rgba(255,255,255,0.5)", fontFamily: "var(--font-ui)" }}>{o.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.15em] uppercase mb-2" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-ui)" }}>¿Cuántos días a la semana entrenas?</label>
              <div className="grid grid-cols-2 gap-2">
                {DIAS_OPTIONS.map((o) => (
                  <button key={o.value} type="button" onClick={() => setDiasEntreno(o.value)} className="py-3 px-4 rounded-2xl text-xs transition-all" style={diasEntreno === o.value ? GLASS_ACTIVE : GLASS}>
                    <span style={{ color: diasEntreno === o.value ? "#2abfbf" : "rgba(255,255,255,0.5)", fontFamily: "var(--font-ui)" }}>{o.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.15em] uppercase mb-2" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-ui)" }}>¿Llevas más de 3 meses entrenando de forma continuada?</label>
              <div className="grid grid-cols-3 gap-2">
                {[{ v: true, l: "Sí" }, { v: false, l: "No" }, { v: null, l: "Menos de 1 mes" }].map(({ v, l }) => (
                  <button key={l} type="button" onClick={() => setEntrena3meses(v)} className="py-3 rounded-2xl text-xs transition-all" style={entrena3meses === v ? GLASS_ACTIVE : GLASS}>
                    <span style={{ color: entrena3meses === v ? "#2abfbf" : "rgba(255,255,255,0.5)", fontFamily: "var(--font-ui)" }}>{l}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.15em] uppercase mb-2" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-ui)" }}>¿Tienes alguna zona del cuerpo que te moleste de forma habitual? <span style={{ color: "rgba(255,255,255,0.2)" }}>(opcional)</span></label>
              <textarea value={zonaMolestia} onChange={(e) => setZonaMolestia(e.target.value)} placeholder="Ej: rodilla derecha, lumbar..." rows={2} className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none" style={{ ...GLASS, color: "rgba(255,255,255,0.9)", fontFamily: "var(--font-ui)" }} />
            </div>
            <button type="button" onClick={() => setStep("consentimiento")} disabled={!objetivo || !diasEntreno || entrena3meses === undefined} className="w-full py-4 rounded-2xl text-sm font-semibold tracking-widest uppercase transition-all disabled:opacity-30" style={{ background: "#2abfbf", color: "#000", fontFamily: "var(--font-ui)", boxShadow: "0 4px 24px rgba(42,191,191,0.3)" }}>Continuar</button>
          </div>
        )}

        {step === "consentimiento" && (
          <div className="space-y-4">
            <div className="rounded-2xl p-4 mb-2" style={{ background: estado === "danger" ? "rgba(255,80,80,0.08)" : estado === "caution" ? "rgba(255,160,0,0.08)" : "rgba(42,191,191,0.08)", border: `0.5px solid ${estado === "danger" ? "rgba(255,80,80,0.25)" : estado === "caution" ? "rgba(255,160,0,0.25)" : "rgba(42,191,191,0.25)"}` }}>
              <p className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-ui)" }}>Resultado del cuestionario</p>
              <p className="text-lg font-light" style={{ fontFamily: "var(--font-serif)", color: estado === "danger" ? "#ff8080" : estado === "caution" ? "#ffb040" : "#2abfbf" }}>
                {estado === "danger" && "Se recomienda valoración médica"}
                {estado === "caution" && "Se recomienda valoración con fisio"}
                {estado === "ok" && "Apto para entrenamiento"}
              </p>
            </div>
            <div className="rounded-2xl p-4" style={GLASS}>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-ui)", letterSpacing: "0.02em" }}>
                Esta aplicación es una herramienta de apoyo preventivo gestionada por <strong style={{ color: "rgba(255,255,255,0.65)" }}>Antifrágil</strong>. Los resultados del cuestionario y las alertas generadas son <strong style={{ color: "rgba(255,255,255,0.65)" }}>orientativos</strong> y no constituyen un diagnóstico médico. Tus datos de salud serán tratados conforme al <strong style={{ color: "rgba(255,255,255,0.65)" }}>RGPD</strong>. Al aceptar, confirmas que has leído y comprendido que esta app no sustituye a un profesional sanitario.
              </p>
            </div>
            <button type="button" onClick={() => setConsentimiento(!consentimiento)} className="w-full flex items-start gap-3 p-4 rounded-2xl transition-all text-left" style={consentimiento ? GLASS_ACTIVE : GLASS}>
              <div className="shrink-0 mt-0.5 flex items-center justify-center rounded" style={{ width: 18, height: 18, background: consentimiento ? "#2abfbf" : "transparent", border: `1.5px solid ${consentimiento ? "#2abfbf" : "rgba(255,255,255,0.2)"}`, transition: "all 0.2s" }}>
                {consentimiento && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <p className="text-xs" style={{ color: consentimiento ? "#2abfbf" : "rgba(255,255,255,0.45)", fontFamily: "var(--font-ui)", letterSpacing: "0.02em" }}>He leído y acepto las condiciones. Entiendo que esta app no sustituye a un profesional sanitario.</p>
            </button>
            {error && <p className="text-xs text-center" style={{ color: "#ff8080" }}>{error}</p>}
            <button type="button" onClick={handleGuardar} disabled={!consentimiento || isSaving} className="w-full py-4 rounded-2xl text-sm font-semibold tracking-widest uppercase transition-all disabled:opacity-30" style={{ background: "#2abfbf", color: "#000", fontFamily: "var(--font-ui)", boxShadow: "0 4px 24px rgba(42,191,191,0.3)" }}>{isSaving ? "Guardando…" : "Confirmar y guardar"}</button>
          </div>
        )}

        {step === "resultado" && (
          <div className="flex flex-col items-center pt-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: estado === "danger" ? "rgba(255,80,80,0.1)" : estado === "caution" ? "rgba(255,160,0,0.1)" : "rgba(42,191,191,0.1)", border: `0.5px solid ${estado === "danger" ? "rgba(255,80,80,0.3)" : estado === "caution" ? "rgba(255,160,0,0.3)" : "rgba(42,191,191,0.3)"}` }}>
              {estado === "ok" && <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M4 12l5 5L20 7" stroke="#2abfbf" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              {estado === "caution" && <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M12 9v5M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#ffb040" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              {estado === "danger" && <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#ff8080" strokeWidth="1.5"/><path d="M12 8v5M12 16h.01" stroke="#ff8080" strokeWidth="1.5" strokeLinecap="round"/></svg>}
            </div>
            <div>
              <p className="mb-2" style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(42,191,191,0.7)", fontFamily: "var(--font-ui)" }}>Perfil de salud completado</p>
              <h2 className="mb-3" style={{ fontSize: "2rem", fontWeight: 300, lineHeight: 1.15, fontFamily: "var(--font-serif)", color: estado === "danger" ? "#ff8080" : estado === "caution" ? "#ffb040" : "#2abfbf" }}>
                {estado === "ok" && "Todo en orden"}
                {estado === "caution" && "Recomendamos valoración"}
                {estado === "danger" && "Consulta con un profesional"}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-ui)", maxWidth: 300, margin: "0 auto" }}>
                {estado === "ok" && "Puedes comenzar a entrenar con normalidad. Recuerda registrar tu bienestar antes de cada sesión."}
                {estado === "caution" && "Puedes usar la app con normalidad. Te recomendamos una valoración con nuestro fisio de Antifrágil antes de empezar."}
                {estado === "danger" && "Te recomendamos visitar a tu médico o fisioterapeuta antes de comenzar a entrenar. Puedes seguir usando la app con normalidad."}
              </p>
            </div>
            <button type="button" onClick={onComplete} className="w-full py-4 rounded-2xl text-sm font-semibold tracking-widest uppercase transition-all" style={{ background: "#2abfbf", color: "#000", fontFamily: "var(--font-ui)", boxShadow: "0 4px 24px rgba(42,191,191,0.3)" }}>Ir a la app</button>
          </div>
        )}
      </div>
    </div>
  );
}
