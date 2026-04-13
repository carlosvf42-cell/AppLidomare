"use client";

import { useState } from "react";
import Link from "next/link";
import type { NotionWebinar } from "@/lib/notion";
import VideoModal from "@/components/VideoModal";

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

export default function WebinarsClient({ webinars }: { webinars: NotionWebinar[] }) {
  const [activeVideo, setActiveVideo] = useState<{ url: string; title: string } | null>(null);

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
            <h1 className="text-xl font-light text-[#f0f0f0] tracking-tight">Webinars</h1>
          </div>
        </div>

        <div className="px-6 mb-3">
          <p className="text-xs font-light" style={{ color: "#444" }}>{webinars.length} sesiones disponibles</p>
        </div>

        <div className="px-4 space-y-2 pb-6">
          {webinars.map((webinar, i) => (
            <div
              key={webinar.id}
              className="rounded-xl overflow-hidden"
              style={{ background: "#141414", border: "1px solid #222" }}
            >
              {/* Cover */}
              {webinar.imageUrl && (
                <div className="h-36 overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={webinar.imageUrl} alt={webinar.title} className="w-full h-full object-cover" />
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(20,20,20,0.9) 100%)" }}
                  />
                </div>
              )}

              <div className="px-4 py-3">
                <div className="flex items-start gap-3">
                  {/* Index */}
                  <span className="text-xs font-mono mt-0.5 shrink-0" style={{ color: "#444" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[#f0f0f0] text-sm font-light leading-snug flex-1">{webinar.title}</p>
                      {webinar.tag && (
                        <span
                          className="shrink-0 text-[10px] px-2 py-0.5 rounded-full font-light"
                          style={{ background: "rgba(42,191,191,0.1)", color: "#2abfbf", border: "1px solid rgba(42,191,191,0.2)" }}
                        >
                          {webinar.tag}
                        </span>
                      )}
                    </div>

                    {webinar.description && (
                      <p className="text-xs mt-1 font-light line-clamp-2 leading-relaxed" style={{ color: "#666" }}>
                        {webinar.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-2.5">
                      {webinar.date && (
                        <span className="text-xs font-light" style={{ color: "#555" }}>
                          {formatDate(webinar.date)}
                        </span>
                      )}
                      {webinar.webinarUrl && (
                        <button
                          onClick={() => setActiveVideo({ url: webinar.webinarUrl!, title: webinar.title })}
                          className="flex items-center gap-1.5 text-xs font-light transition-colors"
                          style={{ color: "#2abfbf" }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M5 3L19 12L5 21V3Z"/>
                          </svg>
                          Ver webinar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {webinars.length === 0 && (
            <div className="text-center py-16">
              <p className="text-sm font-light" style={{ color: "#444" }}>No hay webinars disponibles.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
