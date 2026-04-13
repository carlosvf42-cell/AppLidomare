"use client";

import { useState } from "react";
import Link from "next/link";
import type { NotionExercise } from "@/lib/notion";
import VideoModal from "@/components/VideoModal";

const ZONES = ["Cadera", "Rodilla", "Hombro", "Lumbar", "Cervical"] as const;
const PROGRESSIONS = [1, 2, 3] as const;
const PROG_LABEL: Record<number, string> = { 1: "Iniciación", 2: "Intermedio", 3: "Avanzado" };

const PROG_STYLE: Record<number, { bg: string; text: string }> = {
  1: { bg: "#0d2416", text: "#4ade80" },
  2: { bg: "#1f1705", text: "#f59e0b" },
  3: { bg: "#1f0e05", text: "#f97316" },
};

function Pill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 px-3 py-1.5 rounded-full text-xs font-light tracking-wide transition-all"
      style={
        active
          ? { background: "#2abfbf", color: "#080808", border: "1px solid #2abfbf" }
          : { background: "#141414", color: "#666", border: "1px solid #222" }
      }
    >
      {label}
    </button>
  );
}

export default function EjercicioClient({ exercises }: { exercises: NotionExercise[] }) {
  const [zone, setZone] = useState<string | null>(null);
  const [prog, setProg] = useState<number | null>(null);
  const [activeVideo, setActiveVideo] = useState<{ url: string; title: string } | null>(null);

  const availableZones = ZONES.filter((z) => exercises.some((e) => e.zone === z));

  const filtered = exercises.filter((e) => {
    if (zone && e.zone !== zone) return false;
    if (prog && e.progression !== prog) return false;
    return true;
  });

  return (
    <>
      {activeVideo && (
        <VideoModal url={activeVideo.url} title={activeVideo.title} onClose={() => setActiveVideo(null)} />
      )}

      <div className="min-h-screen bg-[#080808]">
        {/* Header */}
        <div className="px-6 pt-14 pb-4 flex items-center gap-3">
          <Link href="/contenido" className="transition-colors" style={{ color: "#444" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "#444" }}>biblioteca</p>
            <h1 className="text-xl font-light text-[#f0f0f0] tracking-tight">Ejercicio Terapéutico</h1>
          </div>
        </div>

        {/* Zone pills */}
        <div className="px-6 mb-3">
          <p className="text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: "#444" }}>Zona</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {availableZones.map((z) => (
              <Pill key={z} label={z} active={zone === z} onClick={() => setZone(zone === z ? null : z)} />
            ))}
          </div>
        </div>

        {/* Progression pills */}
        <div className="px-6 mb-5">
          <p className="text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: "#444" }}>Progresión</p>
          <div className="flex gap-2 flex-wrap">
            {PROGRESSIONS.map((p) => (
              <Pill
                key={p}
                label={`P${p} · ${PROG_LABEL[p]}`}
                active={prog === p}
                onClick={() => setProg(prog === p ? null : p)}
              />
            ))}
          </div>
        </div>

        {/* Count */}
        <div className="px-6 mb-3">
          <p className="text-xs font-light" style={{ color: "#444" }}>{filtered.length} ejercicios</p>
        </div>

        {/* List */}
        <div className="px-4 space-y-2 pb-6">
          {filtered.map((ex) => {
            const ps = PROG_STYLE[ex.progression] ?? PROG_STYLE[1];
            return (
              <div
                key={ex.id}
                className="flex items-stretch rounded-xl overflow-hidden"
                style={{ background: "#141414", border: "1px solid #222", height: 80 }}
              >
                {/* Image */}
                <div className="w-20 shrink-0 bg-[#1a1a1a] overflow-hidden">
                  {ex.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ex.imageUrl} alt={ex.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xl font-light" style={{ color: "#333" }}>
                        {ex.progression}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 px-3 py-2.5 flex flex-col justify-between">
                  <p className="text-[#f0f0f0] text-sm font-light leading-snug line-clamp-2">{ex.name}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {ex.zone && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-light"
                        style={{ background: "#1a1a1a", color: "#666", border: "1px solid #2a2a2a" }}
                      >
                        {ex.zone}
                      </span>
                    )}
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-light"
                      style={{ background: ps.bg, color: ps.text }}
                    >
                      P{ex.progression}
                    </span>
                  </div>
                </div>

                {/* Video button */}
                {ex.videoUrl && (
                  <button
                    onClick={() => setActiveVideo({ url: ex.videoUrl!, title: ex.name })}
                    className="w-12 shrink-0 flex items-center justify-center transition-colors"
                    style={{ borderLeft: "1px solid #222" }}
                    aria-label="Ver vídeo"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(42,191,191,0.12)", border: "1px solid rgba(42,191,191,0.25)" }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#2abfbf" className="ml-0.5">
                        <path d="M5 3L19 12L5 21V3Z"/>
                      </svg>
                    </div>
                  </button>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-sm font-light" style={{ color: "#444" }}>
                No hay ejercicios con estos filtros.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
