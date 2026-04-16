"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ACCENT = "#2abfbf";
const INACTIVE = "rgba(255,255,255,0.35)";

function IconHome({ active }: { active: boolean }) {
  const c = active ? ACCENT : INACTIVE;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H15v-5H9v5H4a1 1 0 01-1-1V10.5z"
        stroke={c} strokeWidth="1.4" strokeLinejoin="round"
      />
    </svg>
  );
}

function IconGrid({ active }: { active: boolean }) {
  const c = active ? ACCENT : INACTIVE;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" stroke={c} strokeWidth="1.4"/>
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" stroke={c} strokeWidth="1.4"/>
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" stroke={c} strokeWidth="1.4"/>
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" stroke={c} strokeWidth="1.4"/>
    </svg>
  );
}

function IconCalendar({ active }: { active: boolean }) {
  const c = active ? ACCENT : INACTIVE;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke={c} strokeWidth="1.4"/>
      <path d="M3 10h18M8 3v4M16 3v4" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function IconUser({ active }: { active: boolean }) {
  const c = active ? ACCENT : INACTIVE;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={c} strokeWidth="1.4"/>
      <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isContent = pathname.startsWith("/contenido");
  const isCitas = pathname.startsWith("/citas");
  const isPerfil = pathname.startsWith("/perfil");

  const labelStyle = (active: boolean): React.CSSProperties => ({
    fontSize: 9,
    letterSpacing: "0.06em",
    color: active ? ACCENT : INACTIVE,
    marginTop: 3,
    lineHeight: 1,
  });

  const tabClass = "flex flex-col items-center justify-center flex-1 relative";
  const tabStyle: React.CSSProperties = { minHeight: 44 };

  return (
    <nav
      className="fixed left-1/2 bottom-0 w-full z-50 flex"
      style={{
        maxWidth: 430,
        transform: "translateX(-50%)",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
        borderTop: "0.5px solid rgba(255,255,255,0.15)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <Link href="/" className={tabClass} style={tabStyle}>
        <IconHome active={isHome} />
        <span style={labelStyle(isHome)}>home</span>
      </Link>
      <Link href="/contenido" className={tabClass} style={tabStyle}>
        <IconGrid active={isContent} />
        <span style={labelStyle(isContent)}>contenido</span>
      </Link>
      <Link href="/citas" className={tabClass} style={tabStyle}>
        <IconCalendar active={isCitas} />
        <span style={labelStyle(isCitas)}>citas</span>
      </Link>
      <Link href="/perfil" className={tabClass} style={tabStyle}>
        <IconUser active={isPerfil} />
        <span style={labelStyle(isPerfil)}>perfil</span>
      </Link>
    </nav>
  );
}
