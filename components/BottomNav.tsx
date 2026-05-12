"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { IconHome, IconGrid, IconCal, IconUser } from "@/components/design/icons";
import LensSheen from "@/components/design/LensSheen";
import { useAdminMode } from "@/lib/useAdminMode";

const ADMIN_EMAIL = "carlosvf42@gmail.com";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

type IconProps = { active: boolean };

type Tab = {
  href: string;
  label: string;
  Icon: (props: IconProps) => React.ReactNode;
  match: (p: string) => boolean;
};

const USER_TABS: readonly Tab[] = [
  { href: "/",          label: "home",      Icon: IconHome,  match: (p) => p === "/" },
  { href: "/contenido", label: "contenido", Icon: IconGrid,  match: (p) => p.startsWith("/contenido") },
  { href: "/citas",     label: "citas",     Icon: IconCal,   match: (p) => p.startsWith("/citas") },
  { href: "/perfil",    label: "perfil",    Icon: IconUser,  match: (p) => p.startsWith("/perfil") },
] as const;

const ADMIN_TABS: readonly Tab[] = [
  {
    href: "/admin/antifragil",
    label: "entrenos",
    Icon: IconDumbbell,
    match: (p) => p.startsWith("/admin/antifragil") || p.startsWith("/admin/entrenos"),
  },
  {
    href: "/admin/alertas",
    label: "alertas",
    Icon: IconShield,
    match: (p) => p.startsWith("/admin/alertas"),
  },
  {
    href: "/admin",
    label: "alumnos",
    Icon: IconUsers,
    match: (p) => p === "/admin" || p.startsWith("/admin/alumnos"),
  },
  {
    href: "/admin/ajustes",
    label: "ajustes",
    Icon: IconGear,
    match: (p) => p.startsWith("/admin/ajustes"),
  },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminMode] = useAdminMode();

  useEffect(() => {
    let cancelled = false;
    getSupabase().auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setIsAdmin(data.session?.user?.email === ADMIN_EMAIL);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Hide on antifragil entreno workflows (builder, edit, live) so the fixed
  // bottom action bar (save/finalize) doesn't get covered by the nav.
  if (pathname?.startsWith("/admin/antifragil/") && pathname.includes("/entreno/")) {
    return null;
  }

  if (isAdmin === null) return null; // wait for session
  // Single source of truth: adminMode from useAdminMode hook (synced via
  // storage + custom events). Non-admin users always see USER_TABS.
  const tabs = isAdmin && adminMode ? ADMIN_TABS : USER_TABS;
  return <NavShell tabs={tabs} pathname={pathname} />;
}

function NavShell({ tabs, pathname }: { tabs: readonly Tab[]; pathname: string }) {
  const activeIndex = tabs.findIndex((t) => t.match(pathname));

  return (
    <nav
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: "calc(12px + env(safe-area-inset-bottom))",
        maxWidth: 406,
        margin: "0 auto",
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
      <LensSheen />

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 8,
          bottom: 8,
          left: `calc(${(activeIndex / tabs.length) * 100}% + 6px)`,
          width: `calc(${100 / tabs.length}% - 12px)`,
          borderRadius: 22,
          background: "rgba(42,191,191,0.10)",
          border: "0.5px solid rgba(42,191,191,0.30)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 18px rgba(42,191,191,0.18)",
          transition: "left 0.38s cubic-bezier(0.4, 0.0, 0.2, 1)",
          pointerEvents: "none",
          opacity: activeIndex < 0 ? 0 : 1,
        }}
      />

      <div className="flex" style={{ position: "relative", zIndex: 1, width: "100%" }}>
        {tabs.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
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

/* ── Admin-tab icons ────────────────────────────────────────────── */

function IconDumbbell({ active }: IconProps) {
  const c = active ? "var(--accent)" : "var(--muted-2)";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 9v6M8 7v10M16 7v10M19 9v6M8 12h8"
        stroke={c}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconShield({ active }: IconProps) {
  const c = active ? "var(--accent)" : "var(--muted-2)";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3l8 3v6c0 4.5-3.2 8.5-8 9.5-4.8-1-8-5-8-9.5V6l8-3z"
        stroke={c}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 9v3M12 14.5v.01" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconUsers({ active }: IconProps) {
  const c = active ? "var(--accent)" : "var(--muted-2)";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3" stroke={c} strokeWidth="1.5" />
      <circle cx="17" cy="9" r="2" stroke={c} strokeWidth="1.5" />
      <path
        d="M3 19c0-2.8 2.7-5 6-5s6 2.2 6 5M15 19c0-1.9 1.8-3.5 4-3.5"
        stroke={c}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconGear({ active }: IconProps) {
  const c = active ? "var(--accent)" : "var(--muted-2)";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke={c} strokeWidth="1.5" />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h0a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51h0a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke={c}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
