"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const FONT_UI = "var(--font-ui)";
const FONT_SERIF = "var(--font-serif)";

function diasDesde(iso: string): number {
  const d = new Date(iso);
  const ms = Date.now() - d.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

function ultimoAnalisisLabel(hace: number): string {
  if (hace === 0) return "Último análisis: hoy";
  if (hace === 1) return "Último análisis: hace 1 día";
  return `Último análisis: hace ${hace} días`;
}

export default function MonitorizacionCard() {
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [hace, setHace] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const sieteDiasAtras = new Date();
      sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 7);
      const { data } = await supabase
        .from("injury_risk_assessments")
        .select("mensaje_usuario, created_at")
        .eq("user_id", user.id)
        .gte("created_at", sieteDiasAtras.toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (data?.mensaje_usuario) {
        setMensaje(data.mensaje_usuario);
        setHace(diasDesde(data.created_at));
      } else {
        setMensaje(null);
        setHace(null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return null;

  // Default state: only the two text lines, no card, no background.
  if (!mensaje) {
    return (
      <div style={{ padding: "0 4px" }}>
        <p
          style={{
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#2abfbf",
            fontFamily: FONT_UI,
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          Monitorización activa
        </p>
        <p
          style={{
            fontSize: 9,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
            fontFamily: FONT_UI,
            fontWeight: 500,
            marginTop: 4,
            lineHeight: 1,
          }}
        >
          Supervisado por Antifrágil®
        </p>
      </div>
    );
  }

  // With AI message: turquoise-tinted card.
  return (
    <div
      style={{
        background: "rgba(42, 191, 191, 0.06)",
        border: "0.5px solid rgba(42, 191, 191, 0.25)",
        borderRadius: 14,
        padding: "18px 20px",
      }}
    >
      <p
        style={{
          fontSize: 10,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#2abfbf",
          fontFamily: FONT_UI,
          fontWeight: 600,
          lineHeight: 1,
        }}
      >
        Monitorización activa
      </p>
      <p
        style={{
          fontSize: 9,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.35)",
          fontFamily: FONT_UI,
          fontWeight: 500,
          marginTop: 4,
          lineHeight: 1,
          marginBottom: 14,
        }}
      >
        Supervisado por Antifrágil®
      </p>
      <p
        style={{
          fontSize: 18,
          color: "rgba(255,255,255,0.9)",
          fontFamily: FONT_SERIF,
          fontWeight: 400,
          lineHeight: 1.4,
          letterSpacing: "0.005em",
        }}
      >
        {mensaje}
      </p>
      {hace != null && (
        <p
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.3)",
            fontFamily: FONT_UI,
            textAlign: "right",
            marginTop: 12,
            letterSpacing: "0.02em",
          }}
        >
          {ultimoAnalisisLabel(hace)}
        </p>
      )}
    </div>
  );
}
