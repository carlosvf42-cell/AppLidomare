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
      <div className="px-4 grid grid-cols-2 gap-3">
        {/* Card izquierda — Reservar cita */}
        <a
          href="https://antifragil-1.salonized.com/widget_bookings/new"
          className="block active:scale-[0.97] transition-transform"
        >
          <div
            className="flex flex-col items-center justify-center rounded-2xl p-4"
            style={{
              aspectRatio: "1 / 1",
              background: "#141414",
              border: "1px solid #222",
            }}
          >
            <img
              src="/images/antifragil-logo.png"
              alt="Antifrágil"
              width={80}
              height={80}
              style={{ objectFit: "contain", display: "block" }}
            />
            <p
              style={{
                marginTop: 14,
                color: "#f0f0f0",
                fontSize: 14,
                fontWeight: 500,
                textAlign: "center",
                lineHeight: 1.3,
              }}
            >
              Reservar cita
            </p>
          </div>
        </a>

        {/* Card derecha — Asesoramiento */}
        <button
          onClick={() => router.push("/citas/asesoramiento")}
          className="block w-full active:scale-[0.97] transition-transform"
        >
          <div
            className="flex flex-col items-center justify-center rounded-2xl p-4"
            style={{
              aspectRatio: "1 / 1",
              background: "#141414",
              border: "1px solid #222",
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
            <p
              style={{
                marginTop: 14,
                color: "#f0f0f0",
                fontSize: 14,
                fontWeight: 500,
                textAlign: "center",
                lineHeight: 1.3,
              }}
            >
              Asesoramiento
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
