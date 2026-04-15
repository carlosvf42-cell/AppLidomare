"use client";

export default function CitasPage() {
  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Header */}
      <div className="px-6 pt-14 pb-6">
        <p className="text-[#444] text-[10px] tracking-[0.25em] uppercase mb-1">reservas</p>
        <h1 className="text-2xl font-light text-[#f0f0f0] tracking-tight">Citas</h1>
      </div>

      <div className="px-4 flex flex-col gap-3 pb-6">
        {/* Card 1 — Reservar cita */}
        <a
          href="https://antifragil-1.salonized.com/widget_bookings/new"
          className="block active:scale-[0.98] transition-transform"
        >
          <div
            className="rounded-xl px-5 py-5 flex items-center gap-4"
            style={{ background: "#141414", border: "1px solid #222" }}
          >
            {/* Logo */}
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            >
              <img
                src="/images/antifragil-logo.png"
                alt="Antifrágil"
                className="w-10 h-10 object-contain"
              />
            </div>
            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-[#f0f0f0] text-base font-light leading-tight">Reservar mi cita</p>
              <p className="text-[#555] text-xs mt-0.5 font-light">Reserva tu sesión online</p>
            </div>
            {/* Arrow */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
              <path d="M9 18l6-6-6-6" stroke="#444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </a>

        {/* Card 2 — Asesoramiento */}
        <a
          href="https://wa.me/34611057973?text=Hola,%20necesito%20asesoramiento%20en%20Lidomare"
          className="block active:scale-[0.98] transition-transform"
        >
          <div
            className="rounded-xl px-5 py-5 flex items-center gap-4"
            style={{ background: "#141414", border: "1px solid #222" }}
          >
            {/* Icon */}
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(42,191,191,0.08)", border: "1px solid rgba(42,191,191,0.15)" }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
                  stroke="#2abfbf"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-[#f0f0f0] text-base font-light leading-tight">Asesoramiento</p>
              <p className="text-[#555] text-xs mt-0.5 font-light leading-relaxed">
                ¿Tienes alguna lesión?<br />¿No sabes cómo empezar?
              </p>
            </div>
            {/* Arrow */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
              <path d="M9 18l6-6-6-6" stroke="#444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </a>
      </div>
    </div>
  );
}
