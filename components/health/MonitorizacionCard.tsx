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

export default function MonitorizacionCard() {
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState<string | null>(null);

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
        .select("mensaje_usuario")
        .eq("user_id", user.id)
        .gte("created_at", sieteDiasAtras.toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      setMensaje(data?.mensaje_usuario ?? null);
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
    </div>
  );
}
