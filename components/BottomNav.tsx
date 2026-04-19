"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconGrid, IconCal, IconUser } from "@/components/design/icons";

const TABS = [
  { href: "/",          label: "home",      Icon: IconHome,  match: (p: string) => p === "/" },
  { href: "/contenido", label: "contenido", Icon: IconGrid,  match: (p: string) => p.startsWith("/contenido") },
  { href: "/citas",     label: "citas",     Icon: IconCal,   match: (p: string) => p.startsWith("/citas") },
  { href: "/perfil",    label: "perfil",    Icon: IconUser,  match: (p: string) => p.startsWith("/perfil") },
] as const;

const TAB_WIDTH_PERCENT = 25;

export default function BottomNav() {
  const pathname = usePathname();
  const activeIndex = TABS.findIndex((t) => t.match(pathname));

  return (
    <nav
      className="fixed left-1/2 bottom-0 w-full z-50"
      style={{
        maxWidth: 430,
        transform: "translateX(-50%)",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "var(--glass-blur-nav)",
        WebkitBackdropFilter: "var(--glass-blur-nav)",
        borderTop: "0.5px solid rgba(255,255,255,0.12)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Animated capsule */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 6,
          height: 40,
          width: `calc(${TAB_WIDTH_PERCENT}% - 16px)`,
          left: `calc(${activeIndex * TAB_WIDTH_PERCENT}% + 8px)`,
          borderRadius: 20,
          background: "rgba(42,191,191,0.10)",
          border: "0.5px solid rgba(42,191,191,0.20)",
          transition: "left 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          pointerEvents: "none",
        }}
      />

      <div className="flex" style={{ position: "relative" }}>
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
