"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ACCENT = "#2abfbf";
const INACTIVE = "#444444";

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

function IconClipboard({ active }: { active: boolean }) {
  const c = active ? ACCENT : INACTIVE;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="3" width="14" height="18" rx="2" stroke={c} strokeWidth="1.4"/>
      <path d="M9 3h6v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V3z" stroke={c} strokeWidth="1.4"/>
      <path d="M8 12h8M8 16h5" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isContent = pathname.startsWith("/contenido");

  const labelStyle = (active: boolean): React.CSSProperties => ({
    fontSize: 9,
    letterSpacing: "0.08em",
    color: active ? ACCENT : INACTIVE,
    marginTop: 2,
    lineHeight: 1,
  });

  // Tab wrapper — full touch target height
  const tabClass = "flex flex-col items-center justify-center flex-1 relative";
  const tabStyle: React.CSSProperties = { minHeight: 44 };

  return (
    <nav
      className="fixed left-1/2 bottom-0 w-full z-50 flex"
      style={{
        maxWidth: 430,
        transform: "translateX(-50%)",
        background: "#080808",
        borderTop: "1px solid #1a1a1a",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Home */}
      <Link href="/" className={tabClass} style={tabStyle}>
        <IconHome active={isHome} />
        <span style={labelStyle(isHome)}>home</span>
      </Link>

      {/* Contenido */}
      <Link href="/contenido" className={tabClass} style={tabStyle}>
        <IconGrid active={isContent} />
        <span style={labelStyle(isContent)}>contenido</span>
      </Link>

      {/* Cita — visually disabled */}
      <div className={tabClass} style={tabStyle}>
        <IconCalendar active={false} />
        <span style={labelStyle(false)}>cita</span>
        <span
          className="absolute top-2 right-[calc(50%-22px)] text-[8px] px-1 rounded-full leading-tight"
          style={{ background: "#1a1a1a", color: "#555", paddingTop: 1, paddingBottom: 1 }}
        >
          pronto
        </span>
      </div>

      {/* Programa — visually disabled */}
      <div className={tabClass} style={tabStyle}>
        <IconClipboard active={false} />
        <span style={labelStyle(false)}>programa</span>
        <span
          className="absolute top-2 right-[calc(50%-28px)] text-[8px] px-1 rounded-full leading-tight"
          style={{ background: "#1a1a1a", color: "#555", paddingTop: 1, paddingBottom: 1 }}
        >
          pronto
        </span>
      </div>
    </nav>
  );
}
