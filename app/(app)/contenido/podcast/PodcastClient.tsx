"use client";

import { useState } from "react";
import Link from "next/link";
import type { NotionPodcast } from "@/lib/notion";
import VideoModal from "@/components/VideoModal";

export default function PodcastClient({ episodes }: { episodes: NotionPodcast[] }) {
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
            <h1 className="text-xl font-light text-[#f0f0f0] tracking-tight">Podcast</h1>
          </div>
        </div>

        {/* Show identity card */}
        <div className="px-4 mb-4">
          <div
            className="rounded-xl px-4 py-3 flex items-center gap-4"
            style={{ background: "#141414", border: "1px solid #222" }}
          >
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "#1e1e1e", border: "1px solid #2a2a2a" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="3.5" stroke="#2abfbf" strokeWidth="1.4"/>
                <path d="M7 8c0-2.761 2.239-5 5-5s5 2.239 5 5v1c0 2.761-2.239 5-5 5s-5-2.239-5-5V8z"
                  stroke="#2abfbf" strokeWidth="1.4"/>
                <path d="M12 17v4M8 21h8" stroke="#2abfbf" strokeWidth="1.4" strokeLinecap="round"/>
                <path d="M5 10c0 3.866 3.134 7 7 7s7-3.134 7-7" stroke="#2abfbf" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="text-[#f0f0f0] text-sm font-light">Lidomare Podcast</p>
              <p className="text-xs font-light mt-0.5" style={{ color: "#555" }}>
                by Antifrágil® · {episodes.length} episodios
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 mb-3">
          <p className="text-xs font-light" style={{ color: "#444" }}>{episodes.length} episodios</p>
        </div>

        <div className="px-4 space-y-2 pb-6">
          {episodes.map((ep, i) => (
            <div
              key={ep.id}
              className="flex items-center gap-3 rounded-xl px-3 py-3"
              style={{ background: "#141414", border: "1px solid #222" }}
            >
              {/* Cover or icon */}
              {ep.imageUrl ? (
                <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ep.imageUrl} alt={ep.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "#1e1e1e", border: "1px solid #2a2a2a" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#444">
                    <path d="M5 3L19 12L5 21V3Z"/>
                  </svg>
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] font-mono shrink-0" style={{ color: "#444" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[#f0f0f0] text-sm font-light leading-snug truncate">{ep.title}</p>
                </div>
              </div>

              {/* Play button */}
              {ep.url && (
                <button
                  onClick={() => setActiveVideo({ url: ep.url!, title: ep.title })}
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors"
                  style={{ background: "rgba(42,191,191,0.1)", border: "1px solid rgba(42,191,191,0.2)" }}
                  aria-label={`Reproducir ${ep.title}`}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="#2abfbf" className="ml-0.5">
                    <path d="M5 3L19 12L5 21V3Z"/>
                  </svg>
                </button>
              )}
            </div>
          ))}

          {episodes.length === 0 && (
            <div className="text-center py-16">
              <p className="text-sm font-light" style={{ color: "#444" }}>No hay episodios disponibles.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
