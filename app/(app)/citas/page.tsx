"use client";

import { useRouter } from "next/navigation";

export default function CitasPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Header */}
      <div className="px-6 pt-14 pb-6">
        <p className="text-[#444] text-[10px] tracking-[0.25em] uppercase mb-1">reservas</p>
        <h1 className="text-2xl font-light text-[#f0f0f0] tracking-tight">Citas</h1>
      </div>

      {/* 2-column square grid */}
      <div style={{ padding: "0 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

        {/* Card izquierda — Reservar cita */}
        <a
          href="https://antifragil-1.salonized.com/widget_bookings/new"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "block", cursor: "pointer" }}
        >
          <div
            style={{
              aspectRatio: "1 / 1",
              background: "#141414",
              border: "1px solid #222",
              borderRadius: 16,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: 20,
              width: "100%",
            }}
          >
            <img
              src="/images/antifragil-logo.png"
              alt="Antifrágil"
              style={{ width: 72, height: 72, objectFit: "contain", display: "block" }}
            />
            <p style={{ color: "#f0f0f0", fontSize: 15, fontWeight: 500, textAlign: "center", margin: 0 }}>
              Reservar cita
            </p>
          </div>
        </a>

        {/* Card derecha — Asesoramiento */}
        <button
          onClick={() => router.push("/citas/asesoramiento")}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            width: "100%",
            display: "block",
          }}
        >
          <div
            style={{
              aspectRatio: "1 / 1",
              borderRadius: 16,
              overflow: "hidden",
              position: "relative",
              width: "100%",
              border: "1px solid #222",
            }}
          >
            {/* Background image */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: "url(https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            {/* Dark overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(8,8,8,0.72)",
              }}
            />
            {/* Content */}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: 20,
              }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
                  stroke="#2abfbf"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p style={{ color: "#f0f0f0", fontSize: 15, fontWeight: 500, textAlign: "center", margin: 0 }}>
                Asesoramiento
              </p>
            </div>
          </div>
        </button>

      </div>
    </div>
  );
}
