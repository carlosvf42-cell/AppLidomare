export default function CitasPage() {
  return (
    <div style={{ background: "#080808", minHeight: "100vh", paddingBottom: 40 }}>

      {/* ── 1. Header — Quiénes somos ── */}
      <div style={{ padding: "48px 20px 0" }}>
        <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#2abfbf", textTransform: "uppercase", marginBottom: 6 }}>
          Quiénes somos
        </div>
        <div style={{
          fontSize: 32,
          fontWeight: 300,
          color: "#f0f0f0",
          textTransform: "uppercase",
          fontFamily: "var(--font-cormorant), Cormorant Garamond, Georgia, serif",
          letterSpacing: "0.05em",
          lineHeight: 1.1,
        }}>
          Antifrágil
        </div>
        <div style={{ fontSize: 13, color: "#555", marginTop: 6 }}>
          Tu equipo de salud en Lidomare
        </div>
      </div>

      <div style={{ padding: "16px 20px 0" }}>
        <p style={{ fontSize: 13, color: "#666", lineHeight: 1.7, margin: 0, padding: "4px 0" }}>
          Somos el equipo de salud que trabaja junto a Lidomare Health &amp; Fitness Club para que tu experiencia en el gimnasio vaya mucho más allá del entrenamiento. Fisioterapeutas, entrenadores personales y nutricionistas que comparten un mismo objetivo: que te muevas mejor, te recuperes más rápido y construyas una salud que dure.
        </p>
      </div>

      {/* Separador */}
      <div style={{ margin: "28px 20px", height: 0.5, background: "rgba(255,255,255,0.08)" }} />

      {/* ── 2. Servicios ── */}
      <div>
        <div style={{ padding: "0 20px", marginBottom: 14 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#2abfbf", textTransform: "uppercase" }}>
            Nuestros servicios
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10,
          margin: "0 16px",
        }}>
          {/* Fisioterapia */}
          <div style={{
            background: "rgba(42,191,191,0.06)",
            border: "0.5px solid rgba(42,191,191,0.25)",
            borderRadius: 16,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            padding: "20px 14px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            textAlign: "center",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "rgba(42,191,191,0.1)", border: "0.5px solid rgba(42,191,191,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2abfbf" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12h4l2-7 4 14 2-7h4"/>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#2abfbf" }}>Fisioterapia</div>
            <div style={{ fontSize: 11, color: "rgba(240,236,228,0.4)", lineHeight: 1.5 }}>
              Tratamos el origen de tu dolor, no solo los síntomas.
            </div>
          </div>

          {/* Readaptación */}
          <div style={{
            background: "rgba(42,191,191,0.06)",
            border: "0.5px solid rgba(42,191,191,0.25)",
            borderRadius: 16,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            padding: "20px 14px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            textAlign: "center",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "rgba(42,191,191,0.1)", border: "0.5px solid rgba(42,191,191,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2abfbf" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12h2"/>
                <path d="M20 12h2"/>
                <path d="M6 8v8"/>
                <path d="M18 8v8"/>
                <path d="M4 9v6a1 1 0 0 0 1 1h1V8H5a1 1 0 0 0-1 1z"/>
                <path d="M20 9a1 1 0 0 0-1-1h-1v8h1a1 1 0 0 0 1-1V9z"/>
                <path d="M7 12h10"/>
              </svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#2abfbf" }}>Readaptación</div>
            <div style={{ fontSize: 11, color: "rgba(240,236,228,0.4)", lineHeight: 1.5 }}>
              Vuelve al movimiento de forma segura y progresiva.
            </div>
          </div>

          {/* Nutrición */}
          <div style={{
            background: "rgba(42,191,191,0.06)",
            border: "0.5px solid rgba(42,191,191,0.25)",
            borderRadius: 16,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            padding: "20px 14px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            textAlign: "center",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "rgba(42,191,191,0.1)", border: "0.5px solid rgba(42,191,191,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2abfbf" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
              </svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#2abfbf" }}>Nutrición</div>
            <div style={{ fontSize: 11, color: "rgba(240,236,228,0.4)", lineHeight: 1.5 }}>
              Hábitos reales, sin dietas restrictivas ni soluciones milagrosas.
            </div>
          </div>
        </div>
      </div>

      {/* Separador */}
      <div style={{ margin: "18px 20px 28px", height: 0.5, background: "rgba(255,255,255,0.08)" }} />

      {/* ── 3. CTAs — Reserva tu cita ── */}
      <div>
        <div style={{ padding: "0 20px", marginBottom: 14 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#2abfbf", textTransform: "uppercase" }}>
            Reserva tu cita
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "0 16px" }}>
          {/* Tarjeta 1 — Reservar cita */}
          <a
            href="https://antifragil-1.salonized.com/widget_bookings/new"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: "relative",
              minHeight: 160,
              borderRadius: 20,
              overflow: "hidden",
              border: "0.5px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.2)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: "20px 16px",
              textDecoration: "none",
            }}
          >
            {/* Reflejo superior */}
            <div style={{
              position: "absolute",
              top: 0, left: 0, right: 0,
              height: "40%",
              background: "linear-gradient(to bottom, rgba(255,255,255,0.05), transparent)",
              pointerEvents: "none",
              borderRadius: "20px 20px 0 0",
            }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#2abfbf", textTransform: "uppercase", marginBottom: 8 }}>
                Antifrágil
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#f0f0f0", lineHeight: 1.2, textTransform: "uppercase", fontFamily: "Barlow Condensed, sans-serif", letterSpacing: "-0.5px" }}>
                Reservar<br />cita
              </div>
              <div style={{ fontSize: 12, color: "#333", marginTop: 10 }}>
                Gestiona tus reservas online →
              </div>
            </div>
          </a>

          {/* Tarjeta 2 — Asesoramiento */}
          <a
            href="https://wa.me/34611057973?text=Hola%2C%20me%20gustar%C3%ADa%20recibir%20asesoramiento%20personalizado%20en%20Lidomare%20Health%20%26%20Fitness%20Club"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: "relative",
              minHeight: 160,
              borderRadius: 20,
              overflow: "hidden",
              border: "0.5px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.2)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: "20px 16px",
              textDecoration: "none",
            }}
          >
            {/* Reflejo superior */}
            <div style={{
              position: "absolute",
              top: 0, left: 0, right: 0,
              height: "40%",
              background: "linear-gradient(to bottom, rgba(255,255,255,0.05), transparent)",
              pointerEvents: "none",
              borderRadius: "20px 20px 0 0",
            }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#2abfbf", textTransform: "uppercase", marginBottom: 8 }}>
                WhatsApp
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#f0f0f0", lineHeight: 1.2, textTransform: "uppercase", fontFamily: "Barlow Condensed, sans-serif", letterSpacing: "-0.5px" }}>
                <div>Asesoramiento</div>
                <div>personal</div>
              </div>
              <div style={{ fontSize: 12, color: "#333", marginTop: 10 }}>
                Contacta con tu entrenador →
              </div>
            </div>
          </a>
        </div>
      </div>

    </div>
  );
}
