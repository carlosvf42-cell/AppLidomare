"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const FONT_UI = "var(--font-ui)";
const ACCENT = "#2abfbf";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function ReportBugButton() {
  const pathname = usePathname() || "";
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saving, startSave] = useTransition();

  useEffect(() => { setMounted(true); }, []);

  // Oculto en panel admin y onboarding (el onboarding ya está fuera del
  // (app) layout pero por si acaso). No queremos un botón de bug encima
  // del flujo del admin.
  if (pathname.startsWith("/admin")) return null;
  if (pathname.startsWith("/onboarding")) return null;

  function close() {
    if (saving) return;
    setOpen(false);
    setMensaje("");
    setError(null);
    setDone(false);
  }

  function send() {
    const texto = mensaje.trim();
    if (!texto) { setError("Escribe una breve descripción."); return; }
    setError(null);
    startSave(async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Sesión no válida."); return; }
      const paginaCanonica = !pathname || pathname === "/" ? "/home" : pathname;
      const { error: err } = await supabase.from("bug_reports").insert({
        user_id: user.id,
        mensaje: texto,
        pagina: paginaCanonica,
      });
      if (err) { setError(err.message); return; }
      setDone(true);
      setTimeout(() => close(), 1400);
    });
  }

  return (
    <>
      {/* Botón flotante esquina inferior derecha, encima del BottomNav */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Reportar un problema"
        className="no-min-h"
        style={{
          position: "fixed",
          right: 16,
          bottom: "calc(96px + env(safe-area-inset-bottom))",
          width: 40,
          height: 40,
          borderRadius: 20,
          background: "rgba(255,255,255,0.06)",
          border: "0.5px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          color: "rgba(255,255,255,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 40,
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          {/* Bug icon */}
          <path d="M9 8a3 3 0 016 0v1H9V8z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 13a7 7 0 0114 0v3a7 7 0 01-14 0v-3z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 10l3 1.5M21 10l-3 1.5M3 17l3-1M21 17l-3-1M12 7v10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Bottom sheet — porteado a body para escapar el stacking context */}
      {mounted && open && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        >
          <button
            type="button"
            aria-label="Cerrar"
            onClick={close}
            className="absolute inset-0 no-min-h"
            style={{ background: "transparent", border: "none", cursor: "pointer" }}
          />
          <div
            className="relative w-full"
            style={{
              maxWidth: 430,
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              background: "rgba(15,15,15,0.95)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "0.5px solid rgba(255,255,255,0.1)",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
            }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
            </div>

            <div className="flex items-center justify-between px-5 pt-3 pb-3">
              <h2
                style={{
                  fontFamily: FONT_UI,
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.95)",
                }}
              >
                Reportar un problema
              </h2>
              <button
                type="button"
                onClick={close}
                disabled={saving}
                aria-label="Cerrar"
                className="no-min-h"
                style={{
                  width: 32, height: 32, borderRadius: 16,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(255,255,255,0.06)",
                  border: "0.5px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.6)",
                  cursor: saving ? "wait" : "pointer",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
              {!done ? (
                <>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.5, fontFamily: FONT_UI }}>
                    Cuéntanos qué ha fallado para que podamos arreglarlo.
                  </p>

                  <div>
                    <p
                      className="mb-1.5"
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.35)",
                        fontFamily: FONT_UI,
                      }}
                    >
                      Página
                    </p>
                    <p
                      className="px-3 py-2 rounded-lg truncate"
                      style={{
                        fontSize: 12,
                        background: "rgba(255,255,255,0.04)",
                        border: "0.5px solid rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.5)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {!pathname || pathname === "/" ? "/home" : pathname}
                    </p>
                  </div>

                  <div>
                    <p
                      className="mb-1.5"
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.35)",
                        fontFamily: FONT_UI,
                      }}
                    >
                      Descripción
                    </p>
                    <textarea
                      value={mensaje}
                      onChange={(e) => setMensaje(e.target.value)}
                      placeholder="Describe el problema..."
                      rows={5}
                      autoFocus
                      className="w-full outline-none resize-none"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "0.5px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                        padding: "12px 14px",
                        color: "rgba(255,255,255,0.95)",
                        fontFamily: FONT_UI,
                        fontSize: 14,
                        lineHeight: 1.5,
                      }}
                    />
                  </div>

                  {error && (
                    <p style={{ fontSize: 12, color: "#ff8080", fontFamily: FONT_UI }}>{error}</p>
                  )}
                </>
              ) : (
                <div className="py-8 text-center space-y-3">
                  <div
                    className="mx-auto w-14 h-14 rounded-full flex items-center justify-center"
                    style={{
                      background: "rgba(42,191,191,0.12)",
                      border: `0.5px solid rgba(42,191,191,0.4)`,
                      boxShadow: `0 0 24px rgba(42,191,191,0.20)`,
                    }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l5 5L19 7" stroke={ACCENT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p style={{ fontSize: 16, color: "rgba(255,255,255,0.95)", fontFamily: FONT_UI, fontWeight: 500 }}>
                    Reporte enviado
                  </p>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontFamily: FONT_UI }}>¡Gracias!</p>
                </div>
              )}
            </div>

            {!done && (
              <div className="px-5 pt-2 pb-[calc(20px+env(safe-area-inset-bottom))] space-y-2">
                <button
                  type="button"
                  onClick={send}
                  disabled={saving || !mensaje.trim()}
                  className="w-full py-3.5 rounded-2xl text-sm font-semibold tracking-widest uppercase transition-all disabled:opacity-30"
                  style={{
                    background: ACCENT,
                    color: "#080808",
                    fontFamily: FONT_UI,
                    boxShadow: "0 4px 24px rgba(42,191,191,0.35)",
                    cursor: saving || !mensaje.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "Enviando…" : "Enviar reporte"}
                </button>
                <button
                  type="button"
                  onClick={close}
                  disabled={saving}
                  className="w-full py-3 rounded-2xl text-xs tracking-widest uppercase transition-colors disabled:opacity-40"
                  style={{
                    background: "transparent",
                    border: "0.5px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.55)",
                    fontFamily: FONT_UI,
                  }}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
