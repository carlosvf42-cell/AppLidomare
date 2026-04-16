export default function CitasPage() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      padding: "16px",
      gap: "12px",
    }}>

      {/* Tarjeta 1 — Reservar cita */}
      <a
        href="https://lidomare.salonized.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          height: "45vh",
          borderRadius: 20,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "28px 24px",
          background: "#0a0a0a",
          textDecoration: "none",
        }}
      >
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 30% 50%, rgba(42,191,191,0.08) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />
        <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#2abfbf", textTransform: "uppercase", marginBottom: 8 }}>
          Salonized
        </div>
        <div style={{ fontSize: 36, fontWeight: 800, color: "#f0f0f0", lineHeight: 1, textTransform: "uppercase", fontFamily: "Barlow Condensed, sans-serif" }}>
          Reservar<br />cita
        </div>
        <div style={{ fontSize: 12, color: "#333", marginTop: 10 }}>
          Gestiona tus reservas online →
        </div>
      </a>

      {/* Tarjeta 2 — Asesoramiento */}
      <a
        href="https://wa.me/34611057973"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          height: "45vh",
          borderRadius: 20,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "28px 24px",
          background: "#080808",
          textDecoration: "none",
        }}
      >
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 70% 50%, rgba(42,191,191,0.05) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />
        <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#2abfbf", textTransform: "uppercase", marginBottom: 8 }}>
          WhatsApp
        </div>
        <div style={{ fontSize: 36, fontWeight: 800, color: "#f0f0f0", lineHeight: 1, textTransform: "uppercase", fontFamily: "Barlow Condensed, sans-serif" }}>
          Asesoramiento<br />personal
        </div>
        <div style={{ fontSize: 12, color: "#333", marginTop: 10 }}>
          +34 611 057 973 →
        </div>
      </a>

    </div>
  );
}
