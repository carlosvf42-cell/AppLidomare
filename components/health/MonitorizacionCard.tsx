"use client";

import { useEffect, useState } from "react";
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
  borderRadius: 16,
};

const FONT_TEXT = "Barlow Condensed, sans-serif";
const FONT_TITLE = "Cormorant Garamond, serif";

const COPY_DEFAULT =
  "El equipo clínico de Antifrágil monitorizará tu entrenamiento y recuperación regularmente.";

function diasDesde(iso: string): number {
  const d = new Date(iso);
  const ms = Date.now() - d.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
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
        .select("mensaje_usuario, created_at, fecha")
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
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return null;

  return (
    <div style={{ ...GLASS, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: "rgba(42,191,191,0.10)",
            border: "0.5px solid rgba(42,191,191,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3l8 3v6c0 4.5-3.2 8.5-8 9.5-4.8-1-8-5-8-9.5V6l8-3z"
              stroke="#2abfbf"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M9 12l2 2 4-4" stroke="#2abfbf" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 9,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(42,191,191,0.7)",
              fontFamily: FONT_TEXT,
              fontWeight: 600,
              lineHeight: 1,
            }}
          >
            Monitorización activa
          </p>
          <p
            style={{
              fontSize: 8,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.3)",
              fontFamily: FONT_TEXT,
              fontWeight: 600,
              marginTop: 3,
              lineHeight: 1,
            }}
          >
            Supervisado por Antifrágil®
          </p>

          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.85)",
              fontFamily: FONT_TITLE,
              fontWeight: 300,
              lineHeight: 1.45,
              marginTop: 10,
              letterSpacing: "0.01em",
            }}
          >
            {mensaje ?? COPY_DEFAULT}
          </p>

          {mensaje && hace != null && (
            <p
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.3)",
                fontFamily: FONT_TEXT,
                marginTop: 8,
                letterSpacing: "0.04em",
              }}
            >
              {hace === 0 ? "Último análisis: hoy" : hace === 1 ? "Último análisis: hace 1 día" : `Último análisis: hace ${hace} días`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
