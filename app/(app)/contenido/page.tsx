import Link from "next/link";

const sections = [
  {
    id: "rutina",
    title: "Mi Rutina",
    subtitle: "Tu plan de entrenamiento personalizado",
    href: "/rutinas",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80",
  },
  {
    id: "ejercicio",
    title: "Ejercicio Terapéutico",
    subtitle: "Protocolos de rehabilitación",
    href: "/contenido/ejercicio",
    image: "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=600&q=80",
  },
  {
    id: "activacion",
    title: "Activación y Movilidad",
    subtitle: "Calentamiento y preparación",
    href: "/contenido/activacion",
    image: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&q=80",
  },
  {
    id: "webinars",
    title: "Webinars",
    subtitle: "Sesiones formativas en directo",
    href: "/contenido/webinars",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80",
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
        {sections.map((section) => (
          <Link
            key={section.id}
            href={section.href}
            className="block active:scale-[0.98] transition-transform"
          >
            <div
              className="relative overflow-hidden rounded-3xl"
              style={{
                height: 148,
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
                border: "0.5px solid rgba(255,255,255,0.15)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.3)",
              }}
            >
              {/* Photo */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${section.image})` }}
                aria-hidden="true"
              />
              {/* Glass overlay */}
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.85) 100%)" }}
                aria-hidden="true"
              />
              {/* Glass bottom bar */}
              <div
                className="absolute inset-x-0 bottom-0 px-5 pb-4 pt-8"
                style={{
                  backdropFilter: "blur(0px)",
                  WebkitBackdropFilter: "blur(0px)",
                }}
              >
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-base font-light leading-tight" style={{ color: "rgba(255,255,255,0.95)" }}>
                      {section.title}
                    </h2>
                    <p className="text-xs mt-0.5 font-light" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {section.subtitle}
                    </p>
                  </div>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 ml-3"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      backdropFilter: "blur(20px) saturate(180%)",
                      WebkitBackdropFilter: "blur(20px) saturate(180%)",
                      border: "0.5px solid rgba(255,255,255,0.15)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2)",
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18l6-6-6-6" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
