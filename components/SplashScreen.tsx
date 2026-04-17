"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("splash_shown")) return;
    setVisible(true);
    sessionStorage.setItem("splash_shown", "1");

    const timer = setTimeout(() => setFadeOut(true), 1200);
    const remove = setTimeout(() => setVisible(false), 1800);
    return () => { clearTimeout(timer); clearTimeout(remove); };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#080808",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.6s ease-out",
        pointerEvents: fadeOut ? "none" : "auto",
      }}
    >
      {/* Blobs turquesa */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute", top: "-20%", left: "-20%",
            width: "70%", height: "70%", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(42,191,191,0.12) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          style={{
            position: "absolute", bottom: "5%", right: "-10%",
            width: "55%", height: "55%", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(42,191,191,0.07) 0%, transparent 70%)",
            filter: "blur(100px)",
          }}
        />
      </div>

      {/* Tarjeta liquid glass central */}
      <div
        style={{
          position: "relative", zIndex: 1,
          background: "rgba(255,255,255,0.04)",
          border: "0.5px solid rgba(255,255,255,0.1)",
          borderRadius: 24,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          padding: "40px 48px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 11, letterSpacing: "0.4em",
            color: "rgba(255,255,255,0.3)",
            textTransform: "uppercase",
          }}
        >
          Lidomare
        </div>
        <div
          style={{
            fontSize: 26, letterSpacing: "0.25em",
            fontWeight: 300, color: "#f0f0f0",
            textTransform: "uppercase",
            fontFamily: "var(--font-cormorant, Georgia, serif)",
          }}
        >
          HEALTH APP
        </div>
        <div
          style={{
            fontSize: 9, letterSpacing: "0.3em",
            color: "#2abfbf", textTransform: "uppercase",
            marginTop: 4,
          }}
        >
          Precision Wellness
        </div>

        {/* Linea de carga animada */}
        <div
          style={{
            marginTop: 28, width: 100, height: "0.5px",
            background: "rgba(255,255,255,0.06)",
            borderRadius: 2, overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute", top: 0, left: "-40%",
              height: "100%", width: "40%",
              background: "linear-gradient(90deg, transparent, #2abfbf, transparent)",
              animation: "splash-shimmer 1.4s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes splash-shimmer {
          0% { left: -40%; }
          100% { left: 140%; }
        }
      `}</style>
    </div>
  );
}
