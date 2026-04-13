import Link from "next/link";
import Logo from "@/components/Logo";
import { logoutAction } from "@/app/login/actions";

const HERO_BG = "/images/hero-home.jpg";

const bullets = [
  "Contenido nuevo cada semana",
  "Adaptado a cada perfil",
  "Enfocado en mejorar tu salud",
];

export default function HomePage() {
  return (
    <div className="bg-[#080808] min-h-screen">

      {/* ── Hero ── */}
      <div
        className="relative"
        style={{ minHeight: "65vh" }}
      >
        {/* BG image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${HERO_BG})` }}
          aria-hidden="true"
        />
        {/* Gradient: transparent → #080808 */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(8,8,8,0.2) 0%, rgba(8,8,8,0.55) 50%, #080808 100%)" }}
          aria-hidden="true"
        />

        {/* Logout — top right */}
        <div className="absolute top-0 right-0 z-10 p-5">
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-[#555] text-xs tracking-wider hover:text-[#888] transition-colors"
            >
              salir
            </button>
          </form>
        </div>

        {/* Hero content — bottom of hero */}
        <div className="relative z-10 flex flex-col justify-end h-full px-6 pb-10" style={{ minHeight: "65vh" }}>
          {/* Logo */}
          <Logo className="w-[200px] mb-8" />

          {/* Label */}
          <p
            className="text-xs tracking-[0.25em] uppercase mb-3"
            style={{ color: "#2abfbf" }}
          >
            Powered by Antifrágil®
          </p>

          {/* Title */}
          <h1 className="text-[2.2rem] font-light text-[#f0f0f0] leading-tight tracking-tight mb-1">
            Lidomare Health App
          </h1>
          <p className="text-[#888] text-sm font-light tracking-wider">
            Biblioteca de salud
          </p>
        </div>
      </div>

      {/* ── Content below hero ── */}
      <div className="px-6 py-8">

        {/* Bullets */}
        <ul className="space-y-4 mb-10">
          {bullets.map((text) => (
            <li key={text} className="flex items-start gap-3">
              <span
                className="mt-[3px] w-0.5 h-4 rounded-full shrink-0"
                style={{ background: "#2abfbf" }}
                aria-hidden="true"
              />
              <span className="text-[#888] text-sm font-light leading-relaxed">
                {text}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link
          href="/contenido"
          className="flex items-center justify-center gap-2 w-full border border-[#f0f0f0] text-[#f0f0f0] text-sm font-light tracking-widest uppercase py-4 rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors"
        >
          Acceder a la biblioteca
          <span aria-hidden="true">→</span>
        </Link>

        {/* Footer */}
        <p className="text-[#2a2a2a] text-[10px] text-center mt-12 tracking-wider">
          © {new Date().getFullYear()} Lidomare · Playamar, Torremolinos
        </p>
      </div>
    </div>
  );
}
