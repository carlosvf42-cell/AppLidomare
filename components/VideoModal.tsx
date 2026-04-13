"use client";

import { useEffect, useCallback } from "react";

interface VideoModalProps {
  url: string;
  title: string;
  onClose: () => void;
}

function getEmbedUrl(url: string): { type: "youtube" | "file"; src: string } | null {
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return { type: "youtube", src: `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1&rel=0` };

  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) return { type: "youtube", src: `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=1&rel=0` };

  const liveMatch = url.match(/youtube\.com\/live\/([a-zA-Z0-9_-]+)/);
  if (liveMatch) return { type: "youtube", src: `https://www.youtube.com/embed/${liveMatch[1]}?autoplay=1&rel=0` };

  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  if (embedMatch) return { type: "youtube", src: url };

  if (
    url.includes("amazonaws.com") ||
    url.includes("notion.so") ||
    url.includes("prod-files-secure") ||
    /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url)
  ) {
    return { type: "file", src: url };
  }

  return null;
}

export default function VideoModal({ url, title, onClose }: VideoModalProps) {
  const embed = getEmbedUrl(url);

  const handleKey = useCallback(
    (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4"
      style={{ background: "rgba(8,8,8,0.96)" }}
      onClick={onClose}
    >
      <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-sm font-light truncate pr-4" style={{ color: "#888" }}>{title}</p>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            aria-label="Cerrar"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="#666" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Player */}
        <div
          className="relative w-full rounded-xl overflow-hidden"
          style={{ aspectRatio: "16/9", background: "#0a0a0a", border: "1px solid #222" }}
        >
          {embed?.type === "youtube" && (
            <iframe
              src={embed.src}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          )}
          {embed?.type === "file" && (
            <video src={embed.src} controls autoPlay className="absolute inset-0 w-full h-full" />
          )}
          {!embed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ color: "#444" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"
                  stroke="currentColor" strokeWidth="1.4"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <p className="text-sm font-light" style={{ color: "#555" }}>Formato no compatible</p>
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="text-xs underline" style={{ color: "#2abfbf" }}>
                Abrir en nueva pestaña
              </a>
            </div>
          )}
        </div>

        <p className="text-[10px] text-center mt-3 font-light tracking-wider" style={{ color: "#333" }}>
          toca fuera para cerrar · esc
        </p>
      </div>
    </div>
  );
}
