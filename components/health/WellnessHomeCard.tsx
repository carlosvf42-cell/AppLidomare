"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import GlassCard from "@/components/design/GlassCard";
import Eyebrow from "@/components/design/Eyebrow";
import WellnessCheckIn from "./WellnessCheckIn";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

type TodayEntry = {
  id: string;
  puntuacion_total: number | null;
  omitido: boolean;
} | null;

const WELLNESS_FIELDS: (keyof Record<"sueno" | "fatiga" | "estres" | "animo" | "dolor", number>)[] = ["sueno", "fatiga", "estres", "animo", "dolor"];

export default function WellnessHomeCard() {
  const [entry, setEntry] = useState<TodayEntry>(null);
  const [loading, setLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);

  const fetchToday = useCallback(async () => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("wellness_entries")
      .select("id, puntuacion_total, omitido, sueno, fatiga, estres, animo, dolor")
      .eq("user_id", user.id)
      .eq("fecha", today)
      .maybeSingle();
    if (data) {
      const puntuacion = data.puntuacion_total ?? WELLNESS_FIELDS.reduce((s, k) => s + (((data as Record<string, number | null>)[k] as number) || 0), 0);
      setEntry({ id: data.id as string, puntuacion_total: puntuacion, omitido: !!data.omitido });
    } else {
      setEntry(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchToday(); }, [fetchToday]);

  function handleClose() {
    setShowOverlay(false);
    setLoading(true);
    fetchToday();
  }

  if (loading) {
    return (
      <GlassCard variant="light" style={{ padding: "16px 20px" }}>
        <div style={{ height: 48 }} />
      </GlassCard>
    );
  }

  return (
    <>
      {entry === null && (
        <button type="button" onClick={() => setShowOverlay(true)} className="w-full text-left ds-pressable" style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
          <GlassCard variant="light" style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <Eyebrow style={{ marginBottom: 6 }}>Check-in de hoy</Eyebrow>
                <div style={{ fontSize: 14, color: "var(--fg-2)", fontWeight: 300 }}>¿Cómo estás antes de entrenar?</div>
              </div>
              <div className="shrink-0" style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(42,191,191,0.12)", border: "0.5px solid rgba(42,191,191,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="#2abfbf" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </GlassCard>
        </button>
      )}

      {entry && !entry.omitido && (
        <GlassCard variant="light" style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <div className="shrink-0" style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(42,191,191,0.12)", border: "0.5px solid rgba(42,191,191,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 12l5 5L20 7" stroke="#2abfbf" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <Eyebrow style={{ marginBottom: 4 }}>Wellness completado</Eyebrow>
                <div style={{ fontSize: 14, color: "var(--fg-2)", fontWeight: 300 }}>Registro de hoy guardado</div>
              </div>
            </div>
            {entry.puntuacion_total !== null && (
              <div className="shrink-0" style={{ fontSize: 16, fontWeight: 300, color: "var(--accent)", fontFamily: "var(--font-ui)", fontFeatureSettings: "'tnum'" }}>
                {entry.puntuacion_total}/25
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {entry && entry.omitido && (
        <GlassCard variant="light" style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <div className="shrink-0" style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14" stroke="rgba(255,255,255,0.45)" strokeWidth="1.6" strokeLinecap="round"/></svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <Eyebrow style={{ marginBottom: 4 }}>Omitido hoy</Eyebrow>
                <div style={{ fontSize: 14, color: "var(--fg-2)", fontWeight: 300 }}>Check-in no registrado</div>
              </div>
            </div>
            <button type="button" onClick={() => setShowOverlay(true)} className="shrink-0 text-[10px] tracking-[0.15em] uppercase" style={{ color: "var(--accent)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-condensed)" }}>
              Completar ahora
            </button>
          </div>
        </GlassCard>
      )}

      {showOverlay && (
        <WellnessCheckIn
          onComplete={handleClose}
          onSkip={handleClose}
          ctaLabel="Guardar check-in"
        />
      )}
    </>
  );
}
