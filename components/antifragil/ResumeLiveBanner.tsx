"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LIVE_ACTIVE_EVENT, loadLiveActive, type LiveActive } from "@/lib/liveDraft";

// Aviso global "Entreno en curso · Reanudar". Si iOS descarga la PWA a
// mitad de un entreno en vivo y la reabre en otra pantalla, desde aquí
// se vuelve al entreno con todo lo marcado (ver lib/liveDraft.ts).
export default function ResumeLiveBanner() {
  const pathname = usePathname() || "";
  const [active, setActive] = useState<LiveActive | null>(null);

  useEffect(() => {
    const refresh = () => setActive(loadLiveActive());
    refresh();
    window.addEventListener(LIVE_ACTIVE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(LIVE_ACTIVE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [pathname]);

  if (!active) return null;
  const href = `/admin/antifragil/${active.userId}/entreno/${active.entrenoId}/live`;
  if (pathname === href) return null;

  return (
    <div
      className="fixed left-0 right-0 flex justify-center pointer-events-none"
      style={{ top: "calc(8px + env(safe-area-inset-top))", zIndex: 60 }}
    >
      <Link
        href={href}
        className="pointer-events-auto mx-4 w-full max-w-[398px] rounded-2xl px-4 py-3 flex items-center justify-between gap-3 active:scale-[0.98]"
        style={{
          background: "rgba(8,8,8,0.85)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: "0.5px solid rgba(42,191,191,0.45)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
          textDecoration: "none",
          fontFamily: "var(--font-ui)",
        }}
      >
        <span className="min-w-0">
          <span className="block text-[9px] tracking-[0.2em] uppercase" style={{ color: "rgba(42,191,191,0.8)" }}>
            Entreno en curso
          </span>
          <span className="block text-xs truncate" style={{ color: "rgba(255,255,255,0.85)" }}>
            {active.nombre || "Tienes un entreno sin guardar"}
          </span>
        </span>
        <span
          className="shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-semibold tracking-widest uppercase"
          style={{ background: "#2abfbf", color: "#000" }}
        >
          Reanudar
        </span>
      </Link>
    </div>
  );
}
