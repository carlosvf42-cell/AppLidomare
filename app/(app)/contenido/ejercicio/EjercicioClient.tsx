"use client";

import { useState } from "react";
import Link from "next/link";
import type { NotionExercise } from "@/lib/notion";
import VideoModal from "@/components/VideoModal";

const PROG_LABEL: Record<number, string> = { 1: "Iniciación", 2: "Intermedio", 3: "Avanzado" };

const PROG_STYLE: Record<number, { color: string; background: string }> = {
  1: { color: "#4ade80", background: "rgba(74,222,128,0.1)" },
  2: { color: "#fb923c", background: "rgba(251,146,60,0.1)" },
  3: { color: "#f87171", background: "rgba(248,113,113,0.1)" },
};

const GLASS_CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "0.5px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
  padding: 20,
  width: "100%",
  textAlign: "left",
};

function ProgBadge({ p }: { p: number }) {
  const s = PROG_STYLE[p] ?? PROG_STYLE[1];
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-full font-light shrink-0"
      style={{ color: s.color, background: s.background, border: `0.5px solid ${s.color}33` }}
    >
      P{p}
    </span>
  );
}

export default function EjercicioClient({ exercises }: { exercises: NotionExercise[] }) {
  const [zonaSeleccionada, setZonaSeleccionada] = useState<string | null>(null);
  const [progFiltro, setProgFiltro] = useState<number | null>(null);
  const [activeVideo, setActiveVideo] = useState<{ url: string; title: string } | null>(null);

  // Group by zone
  const zonaMap = exercises.reduce<Record<string, NotionExercise[]>>((acc, ej) => {
    const zona = ej.zone || "General";
    if (!acc[zona]) acc[zona] = [];
    acc[zona].push(ej);
    return acc;
  }, {});

  const zonas = Object.entries(zonaMap).map(([nombre, items]) => ({
    nombre,
    count: items.length,
    progs: [...new Set(items.map((e) => e.progression))].sort(),
  }));

  // Exercises for selected zone
  const ejerciciosZona = zonaSeleccionada ? (zonaMap[zonaSeleccionada] ?? []) : [];
  const ejerciciosFiltrados = progFiltro
    ? ejerciciosZona.filter((e) => e.progression === progFiltro)
    : ejerciciosZona;
  const progsEnZona = zonaSeleccionada
    ? [...new Set(ejerciciosZona.map((e) => e.progression))].sort()
    : [];

  function volverAZonas() {
    setZonaSeleccionada(null);
    setProgFiltro(null);
  }

  return (
    <>
      {activeVideo && (
        <VideoModal url={activeVideo.url} title={activeVideo.title} onClose={() => setActiveVideo(null)} />
      )}

      <div className="min-h-screen">

        {/* ── Header ── */}
        <div className="px-5 pt-14 pb-5 flex items-center gap-3">
          {zonaSeleccionada ? (
            <button
              type="button"
              onClick={volverAZonas}
              className="shrink-0"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ) : (
            <Link href="/contenido" className="shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          )}
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>
              {zonaSeleccionada ? "ejercicio terapéutico" : "biblioteca"}
            </p>
            <h1 className="text-xl font-light tracking-tight" style={{ color: "rgba(255,255,255,0.92)" }}>
              {zonaSeleccionada ? `Rehabilitación ${zonaSeleccionada}` : "Ejercicio Terapéutico"}
            </h1>
          </div>
        </div>

        {/* ── Vista zonas ── */}
        {!zonaSeleccionada && (
          <div className="px-4 pb-6 space-y-2">
            {zonas.map((zona) => (
              <button
                key={zona.nombre}
                type="button"
                onClick={() => setZonaSeleccionada(zona.nombre)}
                className="block transition-all active:scale-[0.98]"
                style={GLASS_CARD}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#2abfbf", textTransform: "uppercase", marginBottom: 6 }}>
                      Zona
                    </div>
                    <div className="text-base font-light" style={{ color: "rgba(255,255,255,0.92)" }}>
                      Rehabilitación {zona.nombre}
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                        {zona.count} ejercicio{zona.count !== 1 ? "s" : ""}
                      </span>
                      {zona.progs.map((p) => (
                        <span
                          key={p}
                          style={{
                            fontSize: 10,
                            color: PROG_STYLE[p]?.color ?? "#ccc",
                            background: PROG_STYLE[p]?.background ?? "transparent",
                            border: `0.5px solid ${(PROG_STYLE[p]?.color ?? "#ccc")}33`,
                            borderRadius: 99,
                            padding: "1px 7px",
                          }}
                        >
                          P{p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 16, lineHeight: 1, marginTop: 2 }}>→</span>
                </div>
              </button>
            ))}

            {zonas.length === 0 && (
              <div className="text-center py-16">
                <p className="text-sm font-light" style={{ color: "rgba(255,255,255,0.3)" }}>
                  No hay ejercicios disponibles.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Vista zona seleccionada ── */}
        {zonaSeleccionada && (
          <>
            {/* Progression pills */}
            <div className="px-4 mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {/* Todos */}
              <button
                type="button"
                onClick={() => setProgFiltro(null)}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-light tracking-wide transition-all"
                style={
                  progFiltro === null
                    ? { background: "#2abfbf", color: "#080808", border: "0.5px solid #2abfbf" }
                    : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "0.5px solid rgba(255,255,255,0.1)" }
                }
              >
                Todos
              </button>
              {progsEnZona.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProgFiltro(progFiltro === p ? null : p)}
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs font-light tracking-wide transition-all"
                  style={
                    progFiltro === p
                      ? { background: PROG_STYLE[p]?.color, color: "#080808", border: `0.5px solid ${PROG_STYLE[p]?.color}` }
                      : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "0.5px solid rgba(255,255,255,0.1)" }
                  }
                >
                  P{p} · {PROG_LABEL[p]}
                </button>
              ))}
            </div>

            {/* Count */}
            <div className="px-5 mb-3">
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                {ejerciciosFiltrados.length} ejercicio{ejerciciosFiltrados.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Exercise list */}
            <div className="px-4 space-y-2 pb-6">
              {ejerciciosFiltrados.map((ex, idx) => (
                <div
                  key={ex.id}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "0.5px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {/* Order */}
                  <span
                    className="shrink-0 font-mono text-[10px] w-5 text-right"
                    style={{ color: "rgba(255,255,255,0.2)" }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-light leading-snug" style={{ color: "rgba(255,255,255,0.88)" }}>
                      {ex.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-light"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          color: "rgba(255,255,255,0.4)",
                          border: "0.5px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        {ex.zone}
                      </span>
                      <ProgBadge p={ex.progression} />
                    </div>
                  </div>

                  {/* Video button */}
                  {ex.videoUrl && (
                    <button
                      type="button"
                      onClick={() => setActiveVideo({ url: ex.videoUrl!, title: ex.name })}
                      className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-[0.95]"
                      style={{
                        background: "rgba(42,191,191,0.12)",
                        border: "0.5px solid rgba(42,191,191,0.3)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
                      }}
                      aria-label="Ver vídeo"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#2abfbf" style={{ marginLeft: 1 }}>
                        <path d="M5 3L19 12L5 21V3Z"/>
                      </svg>
                    </button>
                  )}
                </div>
              ))}

              {ejerciciosFiltrados.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-sm font-light" style={{ color: "rgba(255,255,255,0.3)" }}>
                    No hay ejercicios con este filtro.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
