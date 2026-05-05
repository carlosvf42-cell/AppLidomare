"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const FONT_UI = "var(--font-ui)";
const FONT_SERIF = "var(--font-serif)";
const ACCENT = "#2abfbf";
const BG = "#080808";

type Sexo = "masculino" | "femenino" | "otro";
type Objetivo = "perder_peso" | "ganar_musculo" | "mejorar_rendimiento" | "rehabilitacion" | "salud_general";

const PARQ = [
  "¿Te ha dicho alguna vez un médico que tienes una enfermedad cardíaca y que solo deberías hacer ejercicio recomendado por un médico?",
  "¿Sientes dolor en el pecho al realizar actividad física?",
  "¿Has sentido dolor en el pecho durante el último mes sin estar haciendo ejercicio?",
  "¿Pierdes el equilibrio debido a mareos o pierdes el conocimiento alguna vez?",
  "¿Tienes algún problema en huesos o articulaciones que pudiera empeorar con el ejercicio?",
  "¿Te receta tu médico actualmente medicación para la presión arterial o algún problema cardíaco?",
  "¿Conoces alguna otra razón por la que no debas hacer ejercicio?",
] as const;

const OBJETIVOS: Array<{ key: Objetivo; label: string }> = [
  { key: "perder_peso", label: "Perder peso" },
  { key: "ganar_musculo", label: "Ganar músculo" },
  { key: "mejorar_rendimiento", label: "Mejorar resistencia" },
  { key: "rehabilitacion", label: "Rehabilitación" },
  { key: "salud_general", label: "Mantenimiento" },
];

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState(1);

  // Paso 2 — datos personales
  const [nombre, setNombre] = useState("");
  const [fechaNac, setFechaNac] = useState("");
  const [sexo, setSexo] = useState<Sexo | null>(null);
  const [pesoKg, setPesoKg] = useState("");
  const [alturaCm, setAlturaCm] = useState("");

  // Paso 3 — PAR-Q
  const [parq, setParq] = useState<Array<boolean | null>>(() => Array(PARQ.length).fill(null));

  // Paso 4 — objetivo
  const [objetivo, setObjetivo] = useState<Objetivo | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  // Auth + check si ya está completo (entonces vete al home)
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("fecha_nacimiento, peso_kg, altura_cm")
        .eq("user_id", user.id)
        .maybeSingle();
      const fullName = (user.user_metadata?.full_name as string | undefined)?.trim();
      const isComplete =
        !!fullName &&
        !!profile?.fecha_nacimiento &&
        profile?.peso_kg != null &&
        profile?.altura_cm != null;
      if (isComplete) {
        router.replace("/");
        return;
      }
      // Pre-rellena lo que ya haya
      if (fullName) setNombre(fullName);
      if (profile?.fecha_nacimiento) setFechaNac(profile.fecha_nacimiento as string);
      if (profile?.peso_kg != null) setPesoKg(String(profile.peso_kg));
      if (profile?.altura_cm != null) setAlturaCm(String(profile.altura_cm));
      setChecking(false);
    })();
  }, [router]);

  function next() {
    setError(null);
    if (step === 2) {
      if (!nombre.trim()) { setError("Escribe tu nombre completo."); return; }
      if (!fechaNac) { setError("Indica tu fecha de nacimiento."); return; }
      if (!sexo) { setError("Selecciona una opción."); return; }
      const peso = parseFloat(pesoKg);
      const altura = parseFloat(alturaCm);
      if (!Number.isFinite(peso) || peso <= 0) { setError("Indica tu peso en kg."); return; }
      if (!Number.isFinite(altura) || altura <= 0) { setError("Indica tu altura en cm."); return; }
    }
    if (step === 3) {
      if (parq.some((v) => v === null)) { setError("Responde todas las preguntas."); return; }
    }
    if (step === 4) {
      if (!objetivo) { setError("Elige tu objetivo."); return; }
    }
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function prev() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  function finalize() {
    setError(null);
    startSave(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Sesión no válida."); return; }

      // 1) Nombre → user_metadata
      const { error: metaErr } = await supabase.auth.updateUser({
        data: { full_name: nombre.trim() },
      });
      if (metaErr) { setError(`No se pudo guardar el nombre. ${metaErr.message}`); return; }

      // 2) Datos físicos + objetivo → user_profiles (upsert por user_id)
      const { error: profileErr } = await supabase
        .from("user_profiles")
        .upsert(
          {
            user_id: user.id,
            fecha_nacimiento: fechaNac,
            peso_kg: parseFloat(pesoKg),
            altura_cm: parseFloat(alturaCm),
            sexo,
            objetivo,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      if (profileErr) { setError(`No se pudo guardar el perfil. ${profileErr.message}`); return; }

      // 3) PAR-Q → health_assessments (upsert por user_id)
      const respuestas: Record<string, boolean> = {};
      PARQ.forEach((preg, i) => { respuestas[`q${i + 1}`] = parq[i] === true; });
      const algunSi = parq.some((v) => v === true);
      const estado = algunSi ? "caution" : "ok";
      const { error: haErr } = await supabase
        .from("health_assessments")
        .upsert(
          {
            user_id: user.id,
            respuestas,
            estado,
            consentimiento_aceptado: true,
            consentimiento_fecha: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      if (haErr) {
        // No bloquea: el perfil ya está guardado, este es info clínica.
        console.warn("health_assessments upsert error:", haErr.message);
      }

      router.replace("/");
      router.refresh();
    });
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="w-5 h-5 rounded-full animate-spin" style={{ border: `1.5px solid rgba(255,255,255,0.1)`, borderTopColor: ACCENT }} />
      </div>
    );
  }

  const algunParqSi = parq.some((v) => v === true);

  return (
    <div className="min-h-screen" style={{ background: BG, fontFamily: FONT_UI }}>
      {/* Barra de progreso */}
      <div className="fixed top-0 left-0 right-0 px-5 pt-[calc(env(safe-area-inset-top)+18px)] pb-3" style={{ background: BG, zIndex: 10 }}>
        <div className="flex items-center justify-between mb-2">
          <span style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: ACCENT, fontWeight: 600 }}>
            Lidomare
          </span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: FONT_UI, fontFeatureSettings: "'tnum'" }}>
            Paso {step}/{TOTAL_STEPS}
          </span>
        </div>
        <div className="h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%`, background: ACCENT, boxShadow: `0 0 8px ${ACCENT}80` }}
          />
        </div>
      </div>

      {/* Contenido por paso */}
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+72px)] pb-[calc(120px+env(safe-area-inset-bottom))] max-w-[430px] mx-auto">
        {step === 1 && <Paso1 />}
        {step === 2 && (
          <Paso2
            nombre={nombre} setNombre={setNombre}
            fechaNac={fechaNac} setFechaNac={setFechaNac}
            sexo={sexo} setSexo={setSexo}
            pesoKg={pesoKg} setPesoKg={setPesoKg}
            alturaCm={alturaCm} setAlturaCm={setAlturaCm}
          />
        )}
        {step === 3 && (
          <Paso3 parq={parq} setParq={setParq} algunSi={algunParqSi} />
        )}
        {step === 4 && (
          <Paso4 objetivo={objetivo} setObjetivo={setObjetivo} />
        )}
        {step === 5 && <Paso5 />}

        {error && (
          <p className="text-xs text-center mt-4" style={{ color: "#ff8080" }}>{error}</p>
        )}
      </div>

      {/* Footer fijo con CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 px-5 pt-3 pb-[calc(20px+env(safe-area-inset-bottom))]"
        style={{
          background: "linear-gradient(to top, rgba(8,8,8,0.98) 60%, rgba(8,8,8,0))",
          zIndex: 10,
        }}
      >
        <div className="max-w-[430px] mx-auto flex gap-2">
          {step > 1 && step < 5 && (
            <button
              type="button"
              onClick={prev}
              disabled={saving}
              className="px-5 py-3 rounded-2xl text-xs tracking-widest uppercase transition-all active:scale-[0.98] disabled:opacity-40"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "0.5px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.6)",
                fontFamily: FONT_UI,
              }}
            >
              Atrás
            </button>
          )}
          <button
            type="button"
            onClick={step === 5 ? finalize : next}
            disabled={saving}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold tracking-widest uppercase transition-all active:scale-[0.98] disabled:opacity-50"
            style={{
              background: ACCENT,
              color: "#001a1a",
              fontFamily: FONT_UI,
              boxShadow: "0 4px 24px rgba(42,191,191,0.35), inset 0 1px 0 rgba(255,255,255,0.25)",
            }}
          >
            {saving
              ? "Guardando…"
              : step === 1
              ? "Empezar"
              : step === 5
              ? "Ir al home"
              : "Continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Paso 1: Bienvenida ─────────────────────── */

function Paso1() {
  return (
    <div className="pt-12 space-y-5 text-center">
      <div
        className="mx-auto w-20 h-20 rounded-full flex items-center justify-center"
        style={{
          background: "rgba(42,191,191,0.10)",
          border: `0.5px solid rgba(42,191,191,0.30)`,
          boxShadow: `0 0 40px rgba(42,191,191,0.18), inset 0 1px 0 rgba(255,255,255,0.08)`,
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke={ACCENT} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 4 12 14.01l-3-3" stroke={ACCENT} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1
        style={{
          fontFamily: FONT_SERIF,
          fontSize: "2.25rem",
          fontWeight: 400,
          lineHeight: 1.1,
          color: "rgba(255,255,255,0.95)",
          letterSpacing: "-0.005em",
        }}
      >
        Bienvenido/a a Lidomare
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.55)",
          lineHeight: 1.55,
          maxWidth: 340,
          margin: "0 auto",
        }}
      >
        Completa tu perfil para personalizar tu experiencia. Solo tarda 2 minutos.
      </p>
    </div>
  );
}

/* ─────────────────────── Paso 2: Datos personales ─────────────────────── */

function Paso2(props: {
  nombre: string; setNombre: (v: string) => void;
  fechaNac: string; setFechaNac: (v: string) => void;
  sexo: Sexo | null; setSexo: (v: Sexo) => void;
  pesoKg: string; setPesoKg: (v: string) => void;
  alturaCm: string; setAlturaCm: (v: string) => void;
}) {
  const { nombre, setNombre, fechaNac, setFechaNac, sexo, setSexo, pesoKg, setPesoKg, alturaCm, setAlturaCm } = props;
  const sexos: Array<{ key: Sexo; label: string }> = [
    { key: "masculino", label: "Hombre" },
    { key: "femenino", label: "Mujer" },
    { key: "otro", label: "Prefiero no decirlo" },
  ];
  return (
    <div className="space-y-5">
      <div>
        <h2 style={{ fontFamily: FONT_SERIF, fontSize: "1.6rem", fontWeight: 400, color: "rgba(255,255,255,0.95)" }}>
          Tus datos
        </h2>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
          Esto nos sirve para calcular tu carga y adaptar las rutinas.
        </p>
      </div>

      <Field label="Nombre completo">
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Tu nombre"
          className="w-full"
          style={inputStyle}
        />
      </Field>

      <Field label="Fecha de nacimiento">
        <input
          type="date"
          value={fechaNac}
          onChange={(e) => setFechaNac(e.target.value)}
          className="w-full"
          style={inputStyle}
        />
      </Field>

      <div>
        <p className="mb-2" style={labelStyle}>Sexo</p>
        <div className="flex gap-2">
          {sexos.map((s) => {
            const sel = sexo === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setSexo(s.key)}
                className="flex-1 py-2.5 rounded-xl text-xs tracking-wide transition-all"
                style={{
                  background: sel ? "rgba(42,191,191,0.15)" : "rgba(255,255,255,0.04)",
                  border: `0.5px solid ${sel ? "rgba(42,191,191,0.45)" : "rgba(255,255,255,0.08)"}`,
                  color: sel ? ACCENT : "rgba(255,255,255,0.6)",
                  fontFamily: FONT_UI,
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Peso (kg)">
          <input
            type="number"
            inputMode="decimal"
            min={1}
            step={0.5}
            value={pesoKg}
            onChange={(e) => setPesoKg(e.target.value)}
            placeholder="—"
            className="w-full text-center"
            style={inputStyle}
          />
        </Field>
        <Field label="Altura (cm)">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={alturaCm}
            onChange={(e) => setAlturaCm(e.target.value)}
            placeholder="—"
            className="w-full text-center"
            style={inputStyle}
          />
        </Field>
      </div>
    </div>
  );
}

/* ─────────────────────── Paso 3: PAR-Q ─────────────────────── */

function Paso3({
  parq,
  setParq,
  algunSi,
}: {
  parq: Array<boolean | null>;
  setParq: (v: Array<boolean | null>) => void;
  algunSi: boolean;
}) {
  function set(i: number, v: boolean) {
    const next = parq.slice();
    next[i] = v;
    setParq(next);
  }
  return (
    <div className="space-y-5">
      <div>
        <h2 style={{ fontFamily: FONT_SERIF, fontSize: "1.6rem", fontWeight: 400, color: "rgba(255,255,255,0.95)" }}>
          Cuestionario de salud
        </h2>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4, lineHeight: 1.5 }}>
          Responde honestamente para que podamos adaptar tu entrenamiento.
        </p>
      </div>

      <div className="space-y-3">
        {PARQ.map((pregunta, i) => (
          <div
            key={i}
            className="rounded-2xl px-4 py-4 space-y-3"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "0.5px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="flex items-start gap-2">
              <span
                className="shrink-0 inline-flex items-center justify-center text-[9px] font-mono"
                style={{
                  width: 18, height: 18, borderRadius: 5,
                  background: "rgba(42,191,191,0.08)",
                  border: "0.5px solid rgba(42,191,191,0.25)",
                  color: ACCENT,
                }}
              >
                {i + 1}
              </span>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.45 }}>
                {pregunta}
              </p>
            </div>
            <div className="flex gap-2">
              {[
                { v: false, label: "No" },
                { v: true, label: "Sí" },
              ].map(({ v, label }) => {
                const sel = parq[i] === v;
                return (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => set(i, v)}
                    className="flex-1 py-2 rounded-xl text-xs tracking-wider uppercase font-semibold transition-all"
                    style={{
                      background: sel ? (v ? "rgba(255,176,64,0.15)" : "rgba(42,191,191,0.12)") : "rgba(255,255,255,0.04)",
                      border: `0.5px solid ${sel ? (v ? "rgba(255,176,64,0.45)" : "rgba(42,191,191,0.4)") : "rgba(255,255,255,0.08)"}`,
                      color: sel ? (v ? "#ffb040" : ACCENT) : "rgba(255,255,255,0.45)",
                      fontFamily: FONT_UI,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {algunSi && (
        <div
          className="rounded-xl px-4 py-3"
          style={{
            background: "rgba(255,176,64,0.06)",
            border: "0.5px solid rgba(255,176,64,0.30)",
          }}
        >
          <p style={{ fontSize: 12, color: "#ffb040", lineHeight: 1.5 }}>
            Te recomendamos consultar con un médico antes de empezar.
            Puedes continuar bajo tu responsabilidad.
          </p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── Paso 4: Objetivo ─────────────────────── */

function Paso4({
  objetivo,
  setObjetivo,
}: {
  objetivo: Objetivo | null;
  setObjetivo: (v: Objetivo) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 style={{ fontFamily: FONT_SERIF, fontSize: "1.6rem", fontWeight: 400, color: "rgba(255,255,255,0.95)" }}>
          ¿Cuál es tu objetivo?
        </h2>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
          Tu objetivo principal nos ayuda a personalizar la experiencia.
        </p>
      </div>

      <div className="space-y-2">
        {OBJETIVOS.map((o) => {
          const sel = objetivo === o.key;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => setObjetivo(o.key)}
              className="w-full text-left px-4 py-3.5 rounded-2xl flex items-center justify-between transition-all active:scale-[0.99]"
              style={{
                background: sel ? "rgba(42,191,191,0.10)" : "rgba(255,255,255,0.03)",
                border: `0.5px solid ${sel ? "rgba(42,191,191,0.40)" : "rgba(255,255,255,0.08)"}`,
                color: sel ? ACCENT : "rgba(255,255,255,0.85)",
                fontFamily: FONT_UI,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: sel ? 600 : 400 }}>{o.label}</span>
              {sel && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12l5 5L19 7" stroke={ACCENT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────── Paso 5: Confirmación ─────────────────────── */

function Paso5() {
  return (
    <div className="pt-12 space-y-5 text-center">
      <div
        className="mx-auto w-20 h-20 rounded-full flex items-center justify-center"
        style={{
          background: "rgba(42,191,191,0.12)",
          border: `0.5px solid rgba(42,191,191,0.45)`,
          boxShadow: `0 0 40px rgba(42,191,191,0.30), inset 0 1px 0 rgba(255,255,255,0.10)`,
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path d="M5 12l5 5L19 7" stroke={ACCENT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1
        style={{
          fontFamily: FONT_SERIF,
          fontSize: "2.25rem",
          fontWeight: 400,
          lineHeight: 1.1,
          color: "rgba(255,255,255,0.95)",
        }}
      >
        ¡Todo listo!
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.55)",
          lineHeight: 1.55,
          maxWidth: 320,
          margin: "0 auto",
        }}
      >
        Tu perfil está completo. Empieza a entrenar.
      </p>
    </div>
  );
}

/* ─────────────────────── helpers visuales ─────────────────────── */

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.20em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.45)",
  fontFamily: FONT_UI,
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "0.5px solid rgba(255,255,255,0.10)",
  borderRadius: 12,
  padding: "12px 14px",
  color: "rgba(255,255,255,0.95)",
  fontFamily: FONT_UI,
  fontSize: 15,
  outline: "none",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2" style={labelStyle}>{label}</p>
      {children}
    </div>
  );
}
