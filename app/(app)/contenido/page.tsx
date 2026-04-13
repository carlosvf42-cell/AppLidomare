import Link from "next/link";

const sections = [
  {
    id: "ejercicio",
    title: "Ejercicio Terapéutico",
    subtitle: "Protocolos de rehabilitación",
    href: "/contenido/ejercicio",
    disabled: false,
    image: "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=600&q=80",
  },
  {
    id: "activacion",
    title: "Activación y Movilidad",
    subtitle: "Calentamiento y preparación",
    href: "/contenido/activacion",
    disabled: false,
    image: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&q=80",
  },
  {
    id: "webinars",
    title: "Webinars",
    subtitle: "Sesiones formativas en directo",
    href: "/contenido/webinars",
    disabled: false,
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80",
  },
  {
    id: "podcast",
    title: "Podcast",
    subtitle: "Episodios de salud y movimiento",
    href: "/contenido/podcast",
    disabled: false,
    image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&q=80",
  },
  {
    id: "asesoramiento",
    title: "Asesoramiento",
    subtitle: "Consulta personalizada",
    href: "#",
    disabled: true,
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=80",
    badge: "Próximamente",
  },
];

export default function ContenidoPage() {
  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Header */}
      <div className="px-6 pt-14 pb-6">
        <p className="text-[#444] text-[10px] tracking-[0.25em] uppercase mb-1">biblioteca</p>
        <h1 className="text-2xl font-light text-[#f0f0f0] tracking-tight">Contenido</h1>
      </div>

      {/* Section cards */}
      <div className="px-4 flex flex-col gap-3 pb-6">
        {sections.map((section) => {
          const card = (
            <div
              key={section.id}
              className="relative overflow-hidden rounded-xl"
              style={{ height: 140 }}
            >
              {/* Background image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500"
                style={{
                  backgroundImage: `url(${section.image})`,
                  opacity: section.disabled ? 0.35 : 1,
                }}
                aria-hidden="true"
              />

              {/* Dark gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(to bottom, rgba(8,8,8,0.1) 0%, rgba(8,8,8,0.65) 60%, rgba(8,8,8,0.9) 100%)",
                }}
                aria-hidden="true"
              />

              {/* Content */}
              <div className="relative z-10 flex items-end justify-between h-full px-5 pb-4">
                <div>
                  <h2 className="text-[#f0f0f0] text-base font-light leading-tight tracking-wide">
                    {section.title}
                  </h2>
                  <p className="text-[#888] text-xs mt-0.5 font-light">
                    {section.subtitle}
                  </p>
                </div>

                {section.badge ? (
                  <span
                    className="text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full border font-light"
                    style={{ color: "#2abfbf", borderColor: "#2abfbf33", background: "rgba(42,191,191,0.1)" }}
                  >
                    {section.badge}
                  </span>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#666]">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
          );

          if (section.disabled) return card;
          return (
            <Link href={section.href} key={section.id} className="block active:scale-[0.98] transition-transform">
              {card}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
