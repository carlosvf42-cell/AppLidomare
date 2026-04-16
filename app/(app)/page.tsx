import Link from "next/link";
import Logo from "@/components/Logo";

const HERO_BG = "/images/hero-home.jpg";

const bullets = [
  "Contenido nuevo cada semana",
  "Adaptado a cada perfil",
  "Enfocado en mejorar tu salud",
];

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.07)",
  backdropFilter: "blur(24px) saturate(180%)",
  WebkitBackdropFilter: "blur(24px) saturate(180%)",
  border: "0.5px solid rgba(255,255,255,0.13)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 8px 40px rgba(0,0,0,0.5)",
};

export default function HomePage() {
  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <div className="relative" style={{ height: "70vh", minHeight: 420 }}>
        {/* Photo */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${HERO_BG})` }}
          aria-hidden="true"
        />
        {/* Dark vignette */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.75) 100%)" }}
          aria-hidden="true"
        />

        {/* Glass pill — top */}
        <div
          className="absolute top-14 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full"
          style={{
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "0.5px solid rgba(255,255,255,0.25)",
          }}
        >
          <p style={{ fontSize: 10, color: "#2abfbf", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Powered by Antifrágil®
          </p>
        </div>

        {/* Hero content */}
        <div className="absolute inset-x-0 bottom-0 px-5 pb-8">
          <Logo className="w-[180px] mb-5 opacity-90" />
          <h1 className="text-[2.4rem] font-light leading-tight tracking-tight mb-1" style={{ color: "rgba(255,255,255,0.95)" }}>
            Lidomare Health App
          </h1>
          <p className="text-sm font-light" style={{ color: "rgba(255,255,255,0.5)" }}>
            Biblioteca de salud
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 py-6 space-y-3">

        {/* Bullets — glass card */}
        <div className="rounded-3xl px-5 py-5" style={GLASS}>
          <ul className="space-y-4">
            {bullets.map((text) => (
              <li key={text} className="flex items-center gap-3">
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: "#2abfbf", boxShadow: "0 0 6px rgba(42,191,191,0.6)" }}
                  aria-hidden="true"
                />
                <span className="text-sm font-light" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA — glass button */}
        <Link
          href="/contenido"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-sm font-light tracking-widest uppercase transition-all active:scale-[0.98]"
          style={{
            background: "rgba(42,191,191,0.15)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "0.5px solid rgba(42,191,191,0.35)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 20px rgba(42,191,191,0.12)",
            color: "#2abfbf",
          }}
        >
          Acceder a la biblioteca
          <span aria-hidden="true">→</span>
        </Link>

        {/* Footer */}
        <p className="text-center pt-4" style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", letterSpacing: "0.1em" }}>
          © {new Date().getFullYear()} Lidomare · Playamar, Torremolinos
        </p>
      </div>
    </div>
  );
}
