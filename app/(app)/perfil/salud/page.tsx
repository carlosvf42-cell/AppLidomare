"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import HealthTriageFlow from "@/components/health/HealthTriageFlow";

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

const SEXO_OPTIONS = [
  { value: "masculino", label: "Masculino" },
  { value: "femenino", label: "Femenino" },
];

const OBJETIVO_OPTIONS = [
  { value: "perder_peso", label: "Perder peso" },
  { value: "ganar_musculo", label: "Ganar músculo" },
  { value: "mejorar_rendimiento", label: "Mejorar rendimiento" },
  { value: "salud_general", label: "Salud general" },
  { value: "rehabilitacion", label: "Rehabilitación" },
];

type Estado = "ok" | "caution" | "danger";

type Profile = {
  fecha_nacimiento: string;
  peso_kg: string;
  altura_cm: string;
  sexo: string;
  objetivo: string;
  zona_molestia: string;
};

const EMPTY_PROFILE: Profile = {
  fecha_nacimiento: "",
  peso_kg: "",
  altura_cm: "",
  sexo: "",
  objetivo: "",
  zona_molestia: "",
};

export default function SaludPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasAssessment, setHasAssessment] = useState(false);
  const [forceTriage, setForceTriage] = useState(false);
  const [estado, setEstado] = useState<Estado | null>(null);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [isSaving, startSave] = useTransition();
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const [triageRes, profileRes] = await Promise.all([
        supabase.from("health_assessments").select("estado").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_profiles").select("fecha_nacimiento, peso_kg, altura_cm, sexo, objetivo, zona_molestia").eq("user_id", user.id).maybeSingle(),
      ]);
      if (triageRes.data) {
        setHasAssessment(true);
        setEstado((triageRes.data.estado as Estado | undefined) ?? null);
      }
      if (profileRes.data) {
        const p = profileRes.data as Partial<Record<keyof Profile, string | number | null>>;
        setProfile({
          fecha_nacimiento: (p.fecha_nacimiento as string) ?? "",
          peso_kg: p.peso_kg != null ? String(p.peso_kg) : "",
          altura_cm: p.altura_cm != null ? String(p.altura_cm) : "",
          sexo: (p.sexo as string) ?? "",
          objetivo: (p.objetivo as string) ?? "",
          zona_molestia: (p.zona_molestia as string) ?? "",
        });
      }
      setLoading(false);
    })();
  }, []);

  function handleSave() {
    setSaveMsg(null);
    startSave(async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("user_profiles").upsert({
        user_id: user.id,
        fecha_nacimiento: profile.fecha_nacimiento || null,
        peso_kg: profile.peso_kg ? parseFloat(profile.peso_kg) : null,
        altura_cm: profile.altura_cm ? parseFloat(profile.altura_cm) : null,
        sexo: profile.sexo || null,
        objetivo: profile.objetivo || null,
        zona_molestia: profile.zona_molestia || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      if (error) { setSaveMsg("Error al guardar."); return; }
      setSaveMsg("Cambios guardados");
      setTimeout(() => setSaveMsg(null), 2000);
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080808" }}>
        <div className="w-5 h-5 rounded-full animate-spin" style={{ border: "1.5px solid rgba(255,255,255,0.1)", borderTopColor: "#2abfbf" }} />
      </div>
    );
  }

  if (!hasAssessment || forceTriage) {
    return <HealthTriageFlow onComplete={() => router.push("/perfil")} />;
  }

  const estadoColor =
    estado === "danger" ? "#ff8080" :
    estado === "caution" ? "#ffb040" : "#2abfbf";
  const estadoBg =
    estado === "danger" ? "rgba(255,128,128,0.08)" :
    estado === "caution" ? "rgba(255,176,64,0.08)" :
    "rgba(42,191,191,0.08)";
  const estadoBorder =
    estado === "danger" ? "rgba(255,128,128,0.3)" :
    estado === "caution" ? "rgba(255,176,64,0.3)" :
    "rgba(42,191,191,0.3)";
  const estadoLabel =
    estado === "danger" ? "Consulta con un profesional" :
    estado === "caution" ? "Valoración recomendada" :
    "Apto para entrenar";

  return (
    <div className="min-h-screen" style={{ background: "#080808" }}>
      <div className="max-w-[430px] mx-auto px-4 pt-14 pb-12">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/perfil" className="shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <div>
            <p style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(42,191,191,0.7)", fontFamily: "var(--font-ui)" }}>Perfil de salud</p>
            <h1 style={{ fontSize: "2rem", fontWeight: 600, lineHeight: 1.1, color: "rgba(255,255,255,0.95)", fontFamily: "var(--font-serif)" }}>Mi perfil</h1>
          </div>
        </div>

        {/* Estado badge */}
        <div className="rounded-2xl p-4 mb-5" style={{ background: estadoBg, border: `0.5px solid ${estadoBorder}` }}>
          <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-ui)", marginBottom: 4 }}>Estado actual</p>
          <p style={{ fontSize: "1.25rem", fontWeight: 600, fontFamily: "var(--font-serif)", color: estadoColor }}>{estadoLabel}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block mb-2" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-ui)" }}>Fecha de nacimiento</label>
            <input type="date" value={profile.fecha_nacimiento} onChange={(e) => setProfile((p) => ({ ...p, fecha_nacimiento: e.target.value }))} className="w-full px-4 py-3 rounded-2xl text-sm outline-none" style={{ ...GLASS, color: "rgba(255,255,255,0.9)", fontFamily: "var(--font-ui)", colorScheme: "dark" }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-2" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-ui)" }}>Peso (kg)</label>
              <input type="number" value={profile.peso_kg} onChange={(e) => setProfile((p) => ({ ...p, peso_kg: e.target.value }))} className="w-full px-4 py-3 rounded-2xl text-sm outline-none" style={{ ...GLASS, color: "rgba(255,255,255,0.9)", fontFamily: "var(--font-ui)" }} />
            </div>
            <div>
              <label className="block mb-2" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-ui)" }}>Altura (cm)</label>
              <input type="number" value={profile.altura_cm} onChange={(e) => setProfile((p) => ({ ...p, altura_cm: e.target.value }))} className="w-full px-4 py-3 rounded-2xl text-sm outline-none" style={{ ...GLASS, color: "rgba(255,255,255,0.9)", fontFamily: "var(--font-ui)" }} />
            </div>
          </div>

          <div>
            <label className="block mb-2" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-ui)" }}>Sexo biológico</label>
            <div className="grid grid-cols-2 gap-2">
              {SEXO_OPTIONS.map((o) => (
                <button key={o.value} type="button" onClick={() => setProfile((p) => ({ ...p, sexo: o.value }))} className="py-3 rounded-2xl text-xs transition-all" style={profile.sexo === o.value ? GLASS_ACTIVE : GLASS}>
                  <span style={{ color: profile.sexo === o.value ? "#2abfbf" : "rgba(255,255,255,0.5)", fontFamily: "var(--font-ui)" }}>{o.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-2" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-ui)" }}>Objetivo principal</label>
            <div className="grid grid-cols-2 gap-2">
              {OBJETIVO_OPTIONS.map((o) => (
                <button key={o.value} type="button" onClick={() => setProfile((p) => ({ ...p, objetivo: o.value }))} className="py-3 px-4 rounded-2xl text-xs text-left transition-all" style={profile.objetivo === o.value ? GLASS_ACTIVE : GLASS}>
                  <span style={{ color: profile.objetivo === o.value ? "#2abfbf" : "rgba(255,255,255,0.5)", fontFamily: "var(--font-ui)" }}>{o.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-2" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-ui)" }}>Zona de molestia o lesión <span style={{ color: "rgba(255,255,255,0.2)" }}>(opcional)</span></label>
            <textarea value={profile.zona_molestia} onChange={(e) => setProfile((p) => ({ ...p, zona_molestia: e.target.value }))} placeholder="Ej: rodilla derecha, lumbar..." rows={2} className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none" style={{ ...GLASS, color: "rgba(255,255,255,0.9)", fontFamily: "var(--font-ui)" }} />
          </div>

          {saveMsg && <p className="text-xs text-center" style={{ color: saveMsg === "Cambios guardados" ? "#2abfbf" : "#ff8080", fontFamily: "var(--font-ui)" }}>{saveMsg}</p>}

          <button type="button" onClick={handleSave} disabled={isSaving} className="w-full py-4 rounded-2xl text-sm font-semibold tracking-widest uppercase transition-all disabled:opacity-30" style={{ background: "#2abfbf", color: "#000", fontFamily: "var(--font-ui)", boxShadow: "0 4px 24px rgba(42,191,191,0.3)" }}>
            {isSaving ? "Guardando…" : "Guardar cambios"}
          </button>

          <button type="button" onClick={() => setForceTriage(true)} className="w-full pt-4 text-[10px] tracking-[0.2em] uppercase transition-colors" style={{ color: "rgba(255,255,255,0.35)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-ui)" }}>
            Repetir cuestionario PAR-Q
          </button>
        </div>
      </div>
    </div>
  );
}
