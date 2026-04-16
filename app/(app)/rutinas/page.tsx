"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type RutinaDia = { id: string; nombre: string; orden: number };
type RutinaActiva = { id: string; nombre: string; rutina_dias: RutinaDia[] };
type SesionHistorial = { id: string; fecha: string; dia_nombre: string };

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function formatFecha(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
}

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.07)",
  backdropFilter: "blur(24px) saturate(180%)",
  WebkitBackdropFilter: "blur(24px) saturate(180%)",
  border: "0.5px solid rgba(255,255,255,0.13)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 4px 24px rgba(0,0,0,0.4)",
};

export default function RutinasPage() {
  const router = useRouter();
  const [rutina, setRutina] = useState<RutinaActiva | null>(null);
  const [historial, setHistorial] = useState<SesionHistorial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    Promise.all([
      supabase
        .from("rutinas")
        .select("id, nombre, rutina_dias(id, nombre, orden)")
        .eq("activa", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("sesiones")
        .select("id, fecha, rutina_dias(nombre)")
        .order("fecha", { ascending: false })
        .limit(30),
    ]).then(([rutinaRes, sesionesRes]) => {
      if (rutinaRes.data) {
        const r = rutinaRes.data as any;
        r.rutina_dias.sort((a: any, b: any) => a.orden - b.orden);
        setRutina(r);
      }
      if (sesionesRes.data) {
        setHistorial(
          (sesionesRes.data as any[]).map((s) => ({
            id: s.id,
            fecha: s.fecha,
            dia_nombre: s.rutina_dias?.nombre ?? "—",
          }))
        );
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
            entrenamiento
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 300, fontSize: "1.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.92)" }}>
            Rutinas
          </h1>
        </div>
        <Link
          href="/rutinas/nueva"
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(42,191,191,0.12)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "0.5px solid rgba(42,191,191,0.3)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
          aria-label="Nueva rutina"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="#2abfbf" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center pt-20">
          <div className="w-5 h-5 rounded-full animate-spin" style={{ border: "1.5px solid rgba(255,255,255,0.1)", borderTopColor: "#2abfbf" }} />
        </div>
      ) : (
        <div className="px-4 pb-6 space-y-5">

          {/* Mi rutina */}
          <section>
            <p className="text-[10px] tracking-[0.2em] uppercase mb-3 px-1" style={{ color: "rgba(255,255,255,0.3)" }}>
              Mi rutina
            </p>
            {rutina ? (
              <div className="rounded-3xl px-4 py-4 space-y-3" style={GLASS}>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base font-light" style={{ color: "rgba(255,255,255,0.9)" }}>{rutina.nombre}</h2>
                  <span
                    className="text-[9px] px-2 py-0.5 rounded-full shrink-0"
                    style={{
                      background: "rgba(42,191,191,0.12)",
                      color: "#2abfbf",
                      border: "0.5px solid rgba(42,191,191,0.25)",
                    }}
                  >
                    activa
                  </span>
                </div>
                {/* Day chips */}
                <div className="flex gap-1.5 flex-wrap">
                  {rutina.rutina_dias.map((d) => (
                    <span
                      key={d.id}
                      className="text-[10px] px-2.5 py-1 rounded-full"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.5)",
                        border: "0.5px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      {d.nombre}
                    </span>
                  ))}
                </div>
                <Link
                  href="/rutinas/entrenar"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-semibold tracking-widest uppercase transition-all active:scale-[0.98]"
                  style={{
                    background: "#2abfbf",
                    color: "#000",
                    boxShadow: "0 4px 20px rgba(42,191,191,0.35), inset 0 1px 0 rgba(255,255,255,0.25)",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M5 3l14 9-14 9V3z" fill="currentColor"/>
                  </svg>
                  Entrenar hoy
                </Link>
              </div>
            ) : (
              <div className="rounded-3xl px-4 py-8 text-center space-y-4" style={GLASS}>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
                  style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)" }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="10.5" width="3.5" height="3" rx="0.8" stroke="rgba(255,255,255,0.3)" strokeWidth="1.4"/>
                    <rect x="18.5" y="10.5" width="3.5" height="3" rx="0.8" stroke="rgba(255,255,255,0.3)" strokeWidth="1.4"/>
                    <rect x="4.5" y="8.5" width="3" height="7" rx="0.8" stroke="rgba(255,255,255,0.3)" strokeWidth="1.4"/>
                    <rect x="16.5" y="8.5" width="3" height="7" rx="0.8" stroke="rgba(255,255,255,0.3)" strokeWidth="1.4"/>
                    <path d="M7.5 12h9" stroke="rgba(255,255,255,0.3)" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-sm font-light" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Aún no tienes una rutina activa
                </p>
                <Link
                  href="/rutinas/nueva"
                  className="inline-block px-6 py-2.5 rounded-2xl text-xs font-semibold tracking-widest uppercase active:scale-[0.98] transition-transform"
                  style={{
                    background: "#2abfbf",
                    color: "#000",
                    boxShadow: "0 4px 20px rgba(42,191,191,0.3)",
                  }}
                >
                  Crear mi rutina
                </Link>
              </div>
            )}
          </section>

          {/* Historial */}
          {historial.length > 0 && (
            <section>
              <p className="text-[10px] tracking-[0.2em] uppercase mb-3 px-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                Historial
              </p>
              <div className="space-y-2">
                {historial.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => router.push(`/rutinas/sesion/${s.id}`)}
                    className="w-full text-left rounded-2xl px-4 py-3.5 flex items-center justify-between transition-all active:scale-[0.98]"
                    style={GLASS}
                  >
                    <div>
                      <p className="text-sm font-light" style={{ color: "rgba(255,255,255,0.85)" }}>{s.dia_nombre}</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{formatFecha(s.fecha)}</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M9 6l6 6-6 6" stroke="rgba(255,255,255,0.25)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
