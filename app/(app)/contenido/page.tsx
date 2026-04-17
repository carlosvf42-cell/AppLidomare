import Link from "next/link";

const sections = [
  {
    id: "rutina",
    categoria: "Entrenamiento",
    title: "Mi Rutina",
    subtitle: "Tu plan de entrenamiento personalizado",
    href: "/rutinas",
  },
  {
    id: "ejercicio",
    categoria: "Ejercicio",
    title: "Ejercicio Terapéutico",
    subtitle: "Protocolos de rehabilitación",
    href: "/contenido/ejercicio",
  },
  {
    id: "activacion",
    categoria: "Activación",
    title: "Activación y Movilidad",
    subtitle: "Calentamiento y preparación",
    href: "/contenido/activacion",
  },
  {
    id: "webinars",
    categoria: "Webinar",
    title: "Webinars",
    subtitle: "Sesiones formativas en directo",
    href: "/contenido/webinars",
  },
];

export default function ContenidoPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-5 pt-14 pb-6">
        <p className="text-[10px] tracking-[0.25em] uppercase mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>
          biblioteca
        </p>
        <h1 className="text-2xl font-light tracking-tight" style={{ color: "rgba(255,255,255,0.92)" }}>
          Contenido
        </h1>
      </div>

      {/* Section cards */}
      <div className="px-4 flex flex-col gap-3 pb-6">
        {sections.map((section) => {
          const isLocked = section.id === "webinars";
          return (
            <Link
              key={section.id}
              href={section.href}
              className="block active:scale-[0.98] transition-transform"
              style={{
                textDecoration: "none",
                pointerEvents: isLocked ? "none" : undefined,
                opacity: isLocked ? 0.5 : 1,
                position: "relative",
              }}
            >
              {isLocked && (
                <div style={{
                  position: "absolute", top: 12, right: 12, zIndex: 1,
                  background: "rgba(42,191,191,0.1)",
                  border: "0.5px solid #2abfbf",
                  color: "#2abfbf",
                  fontSize: 9, letterSpacing: "0.2em",
                  borderRadius: 6, padding: "4px 10px",
                  textTransform: "uppercase",
                }}>
                  Próximamente
                </div>
              )}
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "0.5px solid rgba(255,255,255,0.08)",
                  borderRadius: 20,
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  minHeight: 110,
                }}
              >
                {/* Categoría */}
                <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#2abfbf", textTransform: "uppercase" }}>
                  {section.categoria}
                </div>

                {/* Título */}
                <div style={{ fontSize: 18, fontWeight: 600, color: "#f0f0f0", letterSpacing: "0.05em" }}>
                  {section.title}
                </div>

                {/* Descripción */}
                <div style={{ fontSize: 12, color: "#444", lineHeight: 1.5 }}>
                  {section.subtitle}
                </div>

                {/* Indicador */}
                <div style={{ fontSize: 10, color: "#2abfbf", marginTop: "auto", letterSpacing: "0.1em" }}>
                  VER →
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
