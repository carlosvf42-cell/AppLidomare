"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import PreestablecidaCard from "@/components/PreestablecidaCard";

type RutinaDia = { id: string; nombre: string; orden: number };
type RutinaActiva = { id: string; nombre: string; rutina_dias: RutinaDia[] };
type SesionHistorial = { id: string; fecha: string; dia_nombre: string; rutina_nombre: string };
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

const LIQUID: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "0.5px solid rgba(255,255,255,0.08)",
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      style={{ transition: "transform 0.3s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      <path d="M6 9l6 6 6-6" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function RutinasPage() {
  const router = useRouter();
  const [rutina, setRutina] = useState<RutinaActiva | null>(null);
  const [todasRutinas, setTodasRutinas] = useState<RutinaResumen[]>([]);
  const [historial, setHistorial] = useState<SesionHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activando, setActivando] = useState<string | null>(null);
  const [borrando, setBorrando] = useState<string | null>(null);
  const [historialOpen, setHistorialOpen] = useState(false);
  const [misRutinasOpen, setMisRutinasOpen] = useState(false);
  const [showDiaPicker, setShowDiaPicker] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [rutinasRes, sesionesRes] = await Promise.all([
      supabase
        .from("rutinas")
        .select("id, nombre, activa, rutina_dias(id, nombre, orden)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("sesiones")
        .select("id, fecha, dia_id, rutina_dias(nombre, rutinas(nombre))")
        .eq("user_id", user.id)
        .order("fecha", { ascending: false })
        .limit(30),
    ]);

    const todas = (rutinasRes.data ?? []) as any[];

    const activa = todas.find((r) => r.activa);
    if (activa) {
      activa.rutina_dias.sort((a: any, b: any) => a.orden - b.orden);
      setRutina(activa);
    } else {
      setRutina(null);
    }

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
          dia_nombre: s.rutina_dias?.nombre ?? "Día libre",
          rutina_nombre: s.rutina_dias?.rutinas?.nombre ?? "",
        }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

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

    const { data: dias } = await supabase
      .from("rutina_dias")
      .select("id")
      .eq("rutina_id", r.id);
    const diasIds = (dias ?? []).map((d: any) => d.id);

    if (diasIds.length > 0) {
      // Desvincular sesiones de los dias para preservar el historial
      await supabase.from("sesiones").update({ dia_id: null }).in("dia_id", diasIds);
      await supabase.from("rutina_ejercicios").delete().in("dia_id", diasIds);
    }
    await supabase.from("rutina_dias").delete().eq("rutina_id", r.id);
    await supabase.from("rutinas").delete().eq("id", r.id).eq("user_id", user.id);

    setTodasRutinas((prev) => prev.filter((x) => x.id !== r.id));
    if (rutina?.id === r.id) setRutina(null);
    setBorrando(null);
  }

  async function activarRutina(rutinaId: string) {
    setActivando(rutinaId);

    // Optimistic update: mark new rutina as active, deactivate the rest
    setTodasRutinas((prev) =>
      prev.map((r) => ({ ...r, activa: r.id === rutinaId }))
    );

    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setActivando(null); return; }

    // DB updates — scoped to this user
    await supabase.from("rutinas").update({ activa: false }).eq("user_id", user.id).neq("id", rutinaId);
    await supabase.from("rutinas").update({ activa: true }).eq("id", rutinaId).eq("user_id", user.id);

    // Fetch fresh data to get the active rutina's dias
    const { data } = await supabase
      .from("rutinas")
      .select("id, nombre, activa, rutina_dias(id, nombre, orden)")
      .eq("user_id", user.id)
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
      <div className="px-5 pt-14 pb-5 flex items-end justify-between">
        <div>
          <p style={{ fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent)", fontWeight: 700, marginBottom: 6 }}>
            Entrenamiento
          </p>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.01em", lineHeight: 1.1 }}>
            Rutinas
          </h1>
        </div>
        <Link
          href="/rutinas/nueva"
          className="rounded-full flex items-center justify-center no-min-h"
          style={{
            width: 48,
            height: 48,
            background: "rgba(42,191,191,0.15)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(42,191,191,0.40)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
          aria-label="Nueva rutina"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="#2abfbf" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center pt-20">
          <div className="w-5 h-5 rounded-full animate-spin" style={{ border: "1.5px solid rgba(255,255,255,0.1)", borderTopColor: "#2abfbf" }} />
        </div>
      ) : (
        <div className="px-4 pb-6 space-y-5">

          {/* ── Rutinas preestablecidas (colapsable) ── */}
          <PreestablecidaCard onActivated={loadData} />

          {/* ── Rutina activa ── */}
          <section>
            <p style={{ fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent)", fontWeight: 700, marginBottom: 12, paddingLeft: 4 }}>
              Mi rutina
            </p>
            {rutina ? (
              <div className="rounded-3xl space-y-4" style={{ ...GLASS, padding: 20 }}>
                <div className="flex items-start justify-between gap-2">
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.005em", lineHeight: 1.15 }}>{rutina.nombre}</h2>
                  <span
                    className="shrink-0"
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: "rgba(42,191,191,0.15)",
                      color: "#2abfbf",
                      border: "1px solid rgba(42,191,191,0.40)",
                    }}
                  >
                    activa
                  </span>
                </div>

                {/* Day chips */}
                <div className="flex gap-2 flex-wrap">
                  {rutina.rutina_dias.map((d) => (
                    <span
                      key={d.id}
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        padding: "6px 12px",
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.85)",
                        border: "1px solid rgba(255,255,255,0.12)",
                      }}
                    >
                      {d.nombre}
                    </span>
                  ))}
                </div>

                {/* Primary CTA */}
                <button
                  type="button"
                  onClick={() => setShowDiaPicker((v) => !v)}
                  className="flex items-center justify-center gap-3 w-full rounded-2xl transition-all active:scale-[0.98]"
                  style={{
                    minHeight: 64,
                    padding: "0 24px",
                    background: "#2abfbf",
                    color: "#001a1a",
                    fontSize: 17,
                    fontWeight: 800,
                    letterSpacing: "0.02em",
                    boxShadow: "0 8px 32px rgba(42,191,191,0.32), inset 0 1px 0 rgba(255,255,255,0.30)",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M5 3l14 9-14 9V3z" fill="currentColor"/>
                  </svg>
                  Entrenar hoy
                </button>

                {/* Day picker */}
                {showDiaPicker && (
                  <div className="space-y-2">
                    <p className="text-[9px] tracking-[0.15em] uppercase px-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                      ¿Qué día entrenas hoy?
                    </p>
                    {rutina.rutina_dias.map((dia) => (
                      <button
                        key={dia.id}
                        type="button"
                        onClick={() => router.push(`/rutinas/entrenar?dia=${dia.id}`)}
                        className="w-full text-left rounded-xl px-4 py-3 flex items-center justify-between gap-3 transition-all active:scale-[0.98]"
                        style={GLASS_SM}
                      >
                        <span className="text-sm font-light" style={{ color: "rgba(255,255,255,0.85)" }}>
                          {dia.nombre}
                        </span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0">
                          <path d="M9 6l6 6-6 6" stroke="#2abfbf" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    ))}

                    {/* Día libre */}
                    <button
                      type="button"
                      onClick={() => router.push("/rutinas/entrenar?modo=libre")}
                      className="w-full text-left rounded-xl px-4 py-3 flex items-center justify-between gap-3 transition-all active:scale-[0.98]"
                      style={{
                        ...GLASS_SM,
                        border: "0.5px dashed rgba(42,191,191,0.3)",
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: "rgba(42,191,191,0.12)", border: "0.5px solid rgba(42,191,191,0.25)" }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M12 5v14M5 12h14" stroke="#2abfbf" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <span className="text-sm font-light" style={{ color: "#2abfbf" }}>
                          Día libre
                        </span>
                      </div>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0">
                        <path d="M9 6l6 6-6 6" stroke="rgba(42,191,191,0.5)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                )}

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
              <div className="rounded-3xl text-center space-y-5" style={{ ...GLASS, padding: "32px 24px" }}>
                <div
                  className="rounded-2xl flex items-center justify-center mx-auto"
                  style={{ width: 64, height: 64, background: "rgba(42,191,191,0.12)", border: "1px solid rgba(42,191,191,0.30)" }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="10.5" width="3.5" height="3" rx="0.8" stroke="#2abfbf" strokeWidth="1.6"/>
                    <rect x="18.5" y="10.5" width="3.5" height="3" rx="0.8" stroke="#2abfbf" strokeWidth="1.6"/>
                    <rect x="4.5" y="8.5" width="3" height="7" rx="0.8" stroke="#2abfbf" strokeWidth="1.6"/>
                    <rect x="16.5" y="8.5" width="3" height="7" rx="0.8" stroke="#2abfbf" strokeWidth="1.6"/>
                    <path d="M7.5 12h9" stroke="#2abfbf" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", lineHeight: 1.15, letterSpacing: "-0.005em" }}>
                    Aún no tienes una rutina
                  </p>
                  <p style={{ fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.65)", marginTop: 8, lineHeight: 1.5 }}>
                    Crea la tuya o entrena ahora sin una.
                  </p>
                </div>
                <Link
                  href="/rutinas/nueva"
                  className="rounded-2xl active:scale-[0.98] transition-transform inline-flex items-center justify-center gap-3"
                  style={{
                    minHeight: 64,
                    padding: "0 28px",
                    background: "#2abfbf",
                    color: "#001a1a",
                    fontSize: 17,
                    fontWeight: 800,
                    letterSpacing: "0.02em",
                    boxShadow: "0 8px 32px rgba(42,191,191,0.32), inset 0 1px 0 rgba(255,255,255,0.30)",
                    textDecoration: "none",
                  }}
                >
                  Crear mi rutina
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
                <div style={{ height: 1, background: "rgba(255,255,255,0.10)", marginTop: 4 }} />
                <Link
                  href="/rutinas/entrenar?modo=libre"
                  className="inline-flex items-center gap-2 transition-colors active:scale-[0.98]"
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    color: "rgba(42,191,191,0.95)",
                    textDecoration: "none",
                    fontFamily: "var(--font-ui)",
                  }}
                >
                  Entrenar ahora sin rutina
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
            )}
          </section>

          {/* ── Mis rutinas (colapsable) ── */}
          {todasRutinas.length > 0 && (
            <section>
              <button
                type="button"
                onClick={() => setMisRutinasOpen((v) => !v)}
                className="w-full rounded-3xl px-4 py-4 flex items-center gap-3 transition-all active:scale-[0.99]"
                style={LIQUID}
              >
                <div className="flex-1 text-left">
                  <p className="text-[9px] tracking-[0.2em] uppercase mb-0.5" style={{ color: "#2abfbf" }}>
                    Rutinas guardadas
                  </p>
                  <p className="text-sm font-light" style={{ color: "rgba(255,255,255,0.85)" }}>
                    Mis rutinas
                  </p>
                </div>
                <span className="text-[10px] font-mono tabular-nums mr-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {todasRutinas.length}
                </span>
                <Chevron open={misRutinasOpen} />
              </button>

              {misRutinasOpen && (
                <div className="mt-3 space-y-2">
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
              )}
            </section>
          )}

          {/* ── Historial (colapsable) ── */}
          {historial.length > 0 && (
            <section>
              <button
                type="button"
                onClick={() => setHistorialOpen((v) => !v)}
                className="w-full rounded-3xl px-4 py-4 flex items-center gap-3 transition-all active:scale-[0.99]"
                style={LIQUID}
              >
                <div className="flex-1 text-left">
                  <p className="text-[9px] tracking-[0.2em] uppercase mb-0.5" style={{ color: "#2abfbf" }}>
                    Entrenamientos
                  </p>
                  <p className="text-sm font-light" style={{ color: "rgba(255,255,255,0.85)" }}>
                    Historial de entrenamientos
                  </p>
                </div>
                <span className="text-[10px] font-mono tabular-nums mr-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {historial.length}
                </span>
                <Chevron open={historialOpen} />
              </button>

              {historialOpen && (
                <div className="mt-3 space-y-2">
                  {historial.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => router.push(`/rutinas/sesion/${s.id}`)}
                      className="w-full text-left rounded-2xl px-4 py-3.5 flex items-center justify-between transition-all active:scale-[0.98]"
                      style={GLASS}
                    >
                      <div>
                        <p className="text-sm font-light" style={{ color: "rgba(255,255,255,0.85)" }}>{s.dia_nombre}</p>
                        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                          {s.rutina_nombre ? `${s.rutina_nombre} · ` : ""}{formatFecha(s.fecha)}
                        </p>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M9 6l6 6-6 6" stroke="rgba(255,255,255,0.25)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
