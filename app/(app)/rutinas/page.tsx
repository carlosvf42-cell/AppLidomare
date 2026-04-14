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
    <div className="min-h-screen bg-[#080808]">
      {/* Header */}
      <div className="px-6 pt-14 pb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#444]">entrenamiento</p>
          <h1 className="text-xl font-light text-[#f0f0f0] tracking-tight">Rutinas</h1>
        </div>
        <Link
          href="/rutinas/nueva"
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(42,191,191,0.12)", border: "1px solid rgba(42,191,191,0.3)" }}
          aria-label="Nueva rutina"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="#2abfbf" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center pt-20">
          <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-4 pb-6 space-y-6">
          {/* Mi rutina */}
          <section>
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#444] mb-3 px-1">Mi rutina</p>
            {rutina ? (
              <div
                className="rounded-xl px-4 py-4 space-y-3"
                style={{ background: "#141414", border: "1px solid #222" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-[#f0f0f0] text-base font-light">{rutina.nombre}</h2>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ background: "rgba(42,191,191,0.12)", color: "#2abfbf", border: "1px solid rgba(42,191,191,0.2)" }}
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
                      style={{ background: "#1a1a1a", color: "#888", border: "1px solid #2a2a2a" }}
                    >
                      {d.nombre}
                    </span>
                  ))}
                </div>
                <Link
                  href="/rutinas/entrenar"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-semibold tracking-widest uppercase transition-colors hover:bg-[#25aaaa]"
                  style={{ background: "#2abfbf", color: "#080808" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M5 3l14 9-14 9V3z" fill="currentColor"/>
                  </svg>
                  Entrenar hoy
                </Link>
              </div>
            ) : (
              <div
                className="rounded-xl px-4 py-8 text-center space-y-4"
                style={{ background: "#141414", border: "1px solid #222" }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
                  style={{ background: "#111", border: "1px solid #1e1e1e" }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="10.5" width="3.5" height="3" rx="0.8" stroke="#444" strokeWidth="1.4"/>
                    <rect x="18.5" y="10.5" width="3.5" height="3" rx="0.8" stroke="#444" strokeWidth="1.4"/>
                    <rect x="4.5" y="8.5" width="3" height="7" rx="0.8" stroke="#444" strokeWidth="1.4"/>
                    <rect x="16.5" y="8.5" width="3" height="7" rx="0.8" stroke="#444" strokeWidth="1.4"/>
                    <path d="M7.5 12h9" stroke="#444" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-[#555] text-sm font-light">Aún no tienes una rutina activa</p>
                <Link
                  href="/rutinas/nueva"
                  className="inline-block px-6 py-2.5 rounded-xl text-xs font-semibold tracking-widest uppercase"
                  style={{ background: "#2abfbf", color: "#080808" }}
                >
                  Crear mi rutina
                </Link>
              </div>
            )}
          </section>

          {/* Historial */}
          {historial.length > 0 && (
            <section>
              <p className="text-[10px] tracking-[0.2em] uppercase text-[#444] mb-3 px-1">Historial</p>
              <div className="space-y-2">
                {historial.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => router.push(`/rutinas/sesion/${s.id}`)}
                    className="w-full text-left rounded-xl px-4 py-3.5 flex items-center justify-between transition-colors"
                    style={{ background: "#141414", border: "1px solid #222" }}
                  >
                    <div>
                      <p className="text-[#f0f0f0] text-sm font-light">{s.dia_nombre}</p>
                      <p className="text-[#555] text-xs mt-0.5">{formatFecha(s.fecha)}</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M9 6l6 6-6 6" stroke="#333" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
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
