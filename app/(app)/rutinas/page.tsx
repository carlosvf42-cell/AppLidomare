"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import PresetRoutines from "@/components/PresetRoutines";

type RutinaDia = { id: string; nombre: string; orden: number };
type RutinaActiva = { id: string; nombre: string; rutina_dias: RutinaDia[] };
type SesionHistorial = { id: string; fecha: string; dia_nombre: string };
type RutinaResumen = { id: string; nombre: string; activa: boolean; num_dias: number };

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

const GLASS_SM: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  border: "0.5px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
};

export default function RutinasPage() {
  const router = useRouter();
  const [rutina, setRutina] = useState<RutinaActiva | null>(null);
  const [todasRutinas, setTodasRutinas] = useState<RutinaResumen[]>([]);
  const [historial, setHistorial] = useState<SesionHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activando, setActivando] = useState<string | null>(null);
  const [borrando, setBorrando] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    Promise.all([
      supabase
        .from("rutinas")
        .select("id, nombre, activa, rutina_dias(id, nombre, orden)")
        .order("created_at", { ascending: false }),
      supabase
        .from("sesiones")
        .select("id, fecha, rutina_dias(nombre)")
        .order("fecha", { ascending: false })
        .limit(30),
    ]).then(([rutinasRes, sesionesRes]) => {
      const todas = (rutinasRes.data ?? []) as any[];

      // Set active rutina
      const activa = todas.find((r) => r.activa);
      if (activa) {
        activa.rutina_dias.sort((a: any, b: any) => a.orden - b.orden);
        setRutina(activa);
      }

      // Build summary list
      setTodasRutinas(
        todas.map((r) => ({
          id: r.id,
          nombre: r.nombre,
          activa: r.activa,
          num_dias: r.rutina_dias?.length ?? 0,
        }))
      );

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

  async function borrarRutina(r: RutinaResumen) {
    if (r.activa) {
      alert("Desactiva la rutina antes de eliminarla.");
      return;
    }
    if (!confirm(`¿Eliminar "${r.nombre}"? El historial de entrenamientos se conservará.`)) return;

    setBorrando(r.id);
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBorrando(null); return; }

    // 1. Obtener ids de los días
    const { data: dias } = await supabase
      .from("rutina_dias")
      .select("id")
      .eq("rutina_id", r.id);
    const diasIds = (dias ?? []).map((d: any) => d.id);

    // 2. Borrar ejercicios de todos los días
    if (diasIds.length > 0) {
      await supabase.from("rutina_ejercicios").delete().in("dia_id", diasIds);
    }

    // 3. Borrar los días
    await supabase.from("rutina_dias").delete().eq("rutina_id", r.id);

    // 4. Borrar la rutina
    await supabase.from("rutinas").delete().eq("id", r.id).eq("user_id", user.id);

    // Actualizar estado local
    setTodasRutinas((prev) => prev.filter((x) => x.id !== r.id));
    if (rutina?.id === r.id) setRutina(null);
    setBorrando(null);
  }

  async function activarRutina(rutinaId: string) {
    setActivando(rutinaId);
    const supabase = getSupabase();
    await supabase.from("rutinas").update({ activa: false }).neq("id", rutinaId);
    await supabase.from("rutinas").update({ activa: true }).eq("id", rutinaId);

    // Refresh local state
    const { data } = await supabase
      .from("rutinas")
      .select("id, nombre, activa, rutina_dias(id, nombre, orden)")
      .order("created_at", { ascending: false });

    const todas = (data ?? []) as any[];
    const activa = todas.find((r) => r.activa);
    if (activa) {
      activa.rutina_dias.sort((a: any, b: any) => a.orden - b.orden);
      setRutina(activa);
    }
    setTodasRutinas(
      todas.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        activa: r.activa,
        num_dias: r.rutina_dias?.length ?? 0,
      }))
    );
    setActivando(null);
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
            entrenamiento
          </p>
          <h1 className="text-xl font-light tracking-tight" style={{ color: "rgba(255,255,255,0.92)" }}>
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

          {/* ── Rutina activa ── */}
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

                {/* Primary CTA */}
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

                {/* Secondary actions */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => router.push(`/rutinas/${rutina.id}/editar`)}
                    className="flex-1 py-2.5 text-xs tracking-widest uppercase transition-all active:scale-[0.98]"
                    style={{ ...GLASS_SM, color: "rgba(255,255,255,0.6)" }}
                  >
                    Editar rutina
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/rutinas/nueva")}
                    className="flex-1 py-2.5 text-xs tracking-widest uppercase transition-all active:scale-[0.98]"
                    style={{ ...GLASS_SM, color: "rgba(255,255,255,0.6)" }}
                  >
                    + Nueva rutina
                  </button>
                </div>
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

          {/* ── Mis rutinas ── */}
          {todasRutinas.length > 0 && (
            <section>
              <p className="text-[10px] tracking-[0.2em] uppercase mb-3 px-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                Mis rutinas
              </p>
              <div className="space-y-2">
                {todasRutinas.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-2xl px-4 py-3.5 flex items-center gap-3"
                    style={GLASS}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-light truncate" style={{ color: "rgba(255,255,255,0.85)" }}>
                          {r.nombre}
                        </p>
                        {r.activa && (
                          <span
                            className="text-[8px] px-1.5 py-0.5 rounded-full shrink-0"
                            style={{
                              background: "rgba(42,191,191,0.12)",
                              color: "#2abfbf",
                              border: "0.5px solid rgba(42,191,191,0.25)",
                            }}
                          >
                            activa
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {r.num_dias} {r.num_dias === 1 ? "día" : "días"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!r.activa && (
                        <button
                          type="button"
                          disabled={activando === r.id}
                          onClick={() => activarRutina(r.id)}
                          className="px-3 py-1.5 rounded-xl text-[10px] tracking-widest uppercase transition-all active:scale-[0.97] disabled:opacity-50"
                          style={{
                            background: "rgba(42,191,191,0.1)",
                            border: "0.5px solid rgba(42,191,191,0.25)",
                            color: "#2abfbf",
                          }}
                        >
                          {activando === r.id ? "…" : "Activar"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => router.push(`/rutinas/${r.id}/editar`)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl transition-all active:scale-[0.97]"
                        style={GLASS_SM}
                        aria-label="Editar"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        disabled={borrando === r.id}
                        onClick={() => borrarRutina(r)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl transition-all active:scale-[0.97] disabled:opacity-50"
                        style={{
                          background: "rgba(255,80,80,0.07)",
                          backdropFilter: "blur(10px)",
                          WebkitBackdropFilter: "blur(10px)",
                          border: "0.5px solid rgba(255,80,80,0.15)",
                          borderRadius: 12,
                        }}
                        aria-label="Eliminar"
                      >
                        {borrando === r.id ? (
                          <div className="w-3 h-3 rounded-full animate-spin" style={{ border: "1.5px solid rgba(255,100,100,0.2)", borderTopColor: "rgba(255,100,100,0.7)" }} />
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="rgba(255,100,100,0.6)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Rutinas preestablecidas ── */}
          <PresetRoutines />

          {/* ── Historial ── */}
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
