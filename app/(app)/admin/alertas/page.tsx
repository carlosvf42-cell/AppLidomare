"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const ADMIN_EMAIL = "carlosvf42@gmail.com";

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

const EYEBROW: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.25em",
  textTransform: "uppercase",
  color: "rgba(42,191,191,0.7)",
  fontFamily: "Barlow Condensed, sans-serif",
};

export default function AlertasPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getSupabase()
      .auth.getSession()
      .then(({ data }) => {
        if (data.session?.user?.email !== ADMIN_EMAIL) {
          router.replace("/");
        } else {
          setChecking(false);
        }
      });
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080808" }}>
        <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#080808" }}>
      <div className="px-5 pt-14 pb-6">
        <p style={EYEBROW}>Supervisión clínica · Antifrágil</p>
        <h1
          className="mt-0.5"
          style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "1.75rem",
            fontWeight: 300,
            lineHeight: 1.1,
            color: "rgba(255,255,255,0.95)",
          }}
        >
          Alertas
        </h1>
      </div>

      <div className="px-4 pb-12">
        <div className="rounded-2xl px-6 py-12 text-center space-y-5" style={GLASS}>
          <div className="flex justify-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "rgba(42,191,191,0.08)",
                border: "0.5px solid rgba(42,191,191,0.25)",
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3l8 3v6c0 4.5-3.2 8.5-8 9.5-4.8-1-8-5-8-9.5V6l8-3z"
                  stroke="rgba(42,191,191,0.85)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M12 9v3M12 14.5v.01" stroke="rgba(42,191,191,0.85)" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <div className="space-y-2">
            <p
              style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: "1.25rem",
                fontWeight: 300,
                lineHeight: 1.3,
                color: "rgba(255,255,255,0.9)",
              }}
            >
              Motor clínico en desarrollo
            </p>
            <p
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.45)",
                fontFamily: "Barlow Condensed, sans-serif",
                lineHeight: 1.6,
                letterSpacing: "0.02em",
                maxWidth: 320,
                margin: "0 auto",
              }}
            >
              Aquí aparecerán las alertas de riesgo de lesión generadas por la IA
              para cada alumno: ACWR alto, baja recuperación, dolor recurrente, y
              fatiga acumulada.
            </p>
          </div>

          <div className="flex justify-center pt-2">
            <span
              className="text-[9px] tracking-[0.25em] uppercase font-semibold px-3 py-1.5 rounded"
              style={{
                background: "rgba(255,176,64,0.08)",
                border: "0.5px solid rgba(255,176,64,0.3)",
                color: "rgba(255,176,64,0.85)",
                fontFamily: "Barlow Condensed, sans-serif",
              }}
            >
              Próximamente
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
