import Link from "next/link";
import GlassCard from "@/components/design/GlassCard";
import LensSheen from "@/components/design/LensSheen";
import Eyebrow from "@/components/design/Eyebrow";
import { IconArrow, IconLock, IconPlay } from "@/components/design/icons";

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

const ICON_STYLES: Record<string, { bg: string; accent: string }> = {
  ejercicio:  { bg: "rgba(42,191,191,0.14)",  accent: "#2abfbf" },
  activacion: { bg: "rgba(123,140,255,0.14)", accent: "#7b8cff" },
  webinars:   { bg: "rgba(255,255,255,0.04)", accent: "rgba(255,255,255,0.35)" },
};

function SectionIcon({ id }: { id: string }) {
  const s = ICON_STYLES[id];
  if (!s) return null;
  if (id === "webinars") return <IconLock c={s.accent} size={26} />;
  if (id === "ejercicio") {
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={s.accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12h4l2-6 4 12 2-6h4" />
      </svg>
    );
  }
  // activacion — target/diana
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={s.accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
    </svg>
  );
}

export default function ContenidoPage() {
  const featured = sections[0];
  const listSections = sections.slice(1);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div style={{ padding: "56px 20px 8px" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>
          Biblioteca
        </div>
        <h1 style={{
          fontFamily: "var(--font-serif)",
          fontSize: 40,
          fontWeight: 200,
          letterSpacing: "-0.02em",
          color: "#fff",
          lineHeight: 1.1,
        }}>
          Contenido
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.5, marginTop: 8 }}>
          Tus rutinas, protocolos y formación — todo en un sitio.
        </p>
      </div>

      {/* Featured card — Mi Rutina */}
      <div style={{ padding: "16px 16px 0" }}>
        <Link href={featured.href} style={{ textDecoration: "none", display: "block" }} className="ds-pressable">
          <GlassCard variant="lens" style={{ height: 220, position: "relative" }}>
            {/* Background gradient */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute", inset: 0, borderRadius: "inherit",
                background: "linear-gradient(135deg, #1a3a3a 0%, #0a1a20 50%, #0a0a1a 100%)",
              }}
            />
            <LensSheen angle={130} />
            {/* Turquoise blob */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(circle at 75% 25%, rgba(42,191,191,0.35) 0%, transparent 55%)",
              }}
            />
            {/* Bottom overlay */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 55%)",
              }}
            />
            {/* Play button */}
            <div
              style={{
                position: "absolute", top: 16, left: 16,
                width: 46, height: 46, borderRadius: "50%",
                background: "rgba(0,0,0,0.4)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "0.5px solid rgba(255,255,255,0.18)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <IconPlay c="rgba(255,255,255,0.9)" size={18} />
            </div>
            {/* Bottom content */}
            <div style={{ position: "absolute", left: 20, right: 20, bottom: 18, zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{
                  fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase",
                  padding: "2px 7px", borderRadius: 4,
                  background: "rgba(42,191,191,0.15)", color: "#2abfbf",
                  border: "0.5px solid rgba(42,191,191,0.3)",
                }}>
                  Destacado
                </span>
                <Eyebrow>{featured.categoria}</Eyebrow>
              </div>
              <div style={{
                fontFamily: "var(--font-serif)",
                fontSize: 28,
                fontWeight: 600,
                color: "#fff",
                lineHeight: 1.15,
              }}>
                {featured.title}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>
                {featured.subtitle}
              </div>
            </div>
          </GlassCard>
        </Link>
      </div>

      {/* List cards */}
      <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {listSections.map((section) => {
          const isLocked = section.id === "webinars";
          const iconStyle = ICON_STYLES[section.id];

          return (
            <Link
              key={section.id}
              href={section.href}
              className="ds-pressable"
              style={{
                textDecoration: "none",
                pointerEvents: isLocked ? "none" : undefined,
                opacity: isLocked ? 0.55 : 1,
                cursor: isLocked ? "default" : undefined,
              }}
            >
              <GlassCard variant="light" style={{ borderRadius: 22, padding: "16px 18px" }}>
                <LensSheen />
                <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 1 }}>
                  {/* Icon square */}
                  {iconStyle && (
                    <div style={{
                      width: 56, height: 56, borderRadius: 18, flexShrink: 0,
                      background: iconStyle.bg,
                      border: `0.5px solid ${iconStyle.accent}44`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <SectionIcon id={section.id} />
                    </div>
                  )}

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Eyebrow color={iconStyle?.accent}>{section.categoria}</Eyebrow>
                      {isLocked && (
                        <span style={{
                          fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase",
                          padding: "2px 6px", borderRadius: 4,
                          border: "0.5px solid rgba(42,191,191,0.3)", color: "#2abfbf",
                        }}>
                          Próximamente
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: "#fff", marginTop: 4 }}>
                      {section.title}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                      {section.subtitle}
                    </div>
                  </div>

                  {/* Arrow */}
                  {!isLocked && <IconArrow c="rgba(255,255,255,0.4)" />}
                </div>
              </GlassCard>
            </Link>
          );
        })}
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}
