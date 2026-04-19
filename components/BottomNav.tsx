"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconGrid, IconCal, IconUser } from "@/components/design/icons";
import LensSheen from "@/components/design/LensSheen";

const TABS = [
  { href: "/",          label: "home",      Icon: IconHome,  match: (p: string) => p === "/" },
  { href: "/contenido", label: "contenido", Icon: IconGrid,  match: (p: string) => p.startsWith("/contenido") },
  { href: "/citas",     label: "citas",     Icon: IconCal,   match: (p: string) => p.startsWith("/citas") },
  { href: "/perfil",    label: "perfil",    Icon: IconUser,  match: (p: string) => p.startsWith("/perfil") },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const activeIndex = TABS.findIndex((t) => t.match(pathname));

  return (
    <nav
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: "calc(12px + env(safe-area-inset-bottom))",
        zIndex: 50,
        height: 64,
        borderRadius: 28,
        display: "flex",
        alignItems: "center",
        overflow: "hidden",

        background: "rgba(255,255,255,0.045)",
        backdropFilter: "blur(30px) saturate(200%)",
        WebkitBackdropFilter: "blur(30px) saturate(200%)",
        border: "0.5px solid rgba(255,255,255,0.14)",
        boxShadow: [
          "inset 0 1px 0 rgba(255,255,255,0.18)",
          "inset 0 -1px 0 rgba(0,0,0,0.25)",
          "inset 1px 0 0 rgba(42,191,191,0.05)",
          "inset -1px 0 0 rgba(123,140,255,0.05)",
          "0 10px 40px rgba(0,0,0,0.55)",
        ].join(", "),
      }}
    >
      {/* Lens sheen — reflejo diagonal sutil */}
      <LensSheen />

      {/* Animated capsule */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 8,
          bottom: 8,
          left: `calc(${(activeIndex / TABS.length) * 100}% + 6px)`,
          width: `calc(${100 / TABS.length}% - 12px)`,
          borderRadius: 22,
          background: "rgba(42,191,191,0.10)",
          border: "0.5px solid rgba(42,191,191,0.30)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 18px rgba(42,191,191,0.18)",
          transition: "left 0.38s cubic-bezier(0.4, 0.0, 0.2, 1)",
          pointerEvents: "none",
        }}
      />

      <div className="flex" style={{ position: "relative", width: "100%" }}>
        {TABS.map(({ href, label, Icon }) => {
          const active = TABS.find((t) => t.match(pathname))?.href === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center flex-1"
              style={{ minHeight: 52, textDecoration: "none" }}
            >
              <Icon active={active} />
              <span
                style={{
                  fontSize: 9,
                  letterSpacing: "0.06em",
                  color: active ? "var(--accent)" : "var(--muted-2)",
                  marginTop: 3,
                  lineHeight: 1,
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
