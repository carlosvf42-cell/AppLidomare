"use client";

import { useState } from "react";
import Link from "next/link";
import type { NotionActivacion } from "@/lib/notion";

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
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

export default function ActivacionClient({ routines }: { routines: NotionActivacion[] }) {
  const [activity, setActivity] = useState<string | null>(null);

  const activities = [...new Set(routines.map((r) => r.activity).filter(Boolean))];
  const filtered = routines.filter((r) => (activity ? r.activity === activity : true));

  return (
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
          <h1 className="text-xl font-light text-[#f0f0f0] tracking-tight">Activación y Movilidad</h1>
        </div>
      </div>

      {/* Filters */}
      {activities.length > 0 && (
        <div className="px-6 mb-5">
          <p className="text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: "#444" }}>Actividad</p>
          <div className="flex gap-2 flex-wrap">
            {activities.map((a) => (
              <Pill key={a} label={a} active={activity === a} onClick={() => setActivity(activity === a ? null : a)} />
            ))}
          </div>
        </div>
      )}

      {/* Count */}
      <div className="px-6 mb-3">
        <p className="text-xs font-light" style={{ color: "#444" }}>{filtered.length} rutinas</p>
      </div>

      {/* List */}
      <div className="px-4 space-y-2 pb-6">
        {filtered.map((routine) => (
          <div
            key={routine.id}
            className="rounded-xl overflow-hidden"
            style={{ background: "#141414", border: "1px solid #222" }}
          >
            {/* Cover image */}
            {routine.imageUrl && (
              <div className="h-32 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={routine.imageUrl} alt={routine.name} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[#f0f0f0] text-sm font-light leading-snug truncate">{routine.name}</p>
                {routine.activity && (
                  <p className="text-xs mt-0.5 font-light" style={{ color: "#666" }}>{routine.activity}</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {routine.activity && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-light"
                    style={{ background: "#1e1e1e", color: "#666", border: "1px solid #2a2a2a" }}
                  >
                    {routine.activity}
                  </span>
                )}
                {routine.url && (
                  <a
                    href={routine.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                    style={{ background: "rgba(42,191,191,0.1)", border: "1px solid rgba(42,191,191,0.2)" }}
                    aria-label="Abrir rutina"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ color: "#2abfbf" }}>
                      <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm font-light" style={{ color: "#444" }}>
              No hay rutinas con esta actividad.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
