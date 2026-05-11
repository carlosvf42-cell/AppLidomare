const ACTIVE = "#2abfbf";
const INACTIVE = "rgba(255,255,255,0.35)";

interface IconProps {
  active?: boolean;
}

interface ColorIconProps {
  c?: string;
  size?: number;
}

export function IconHome({ active }: IconProps) {
  const c = active ? ACTIVE : INACTIVE;
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H15v-5H9v5H4a1 1 0 01-1-1V10.5z" stroke={c} strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function IconGrid({ active }: IconProps) {
  const c = active ? ACTIVE : INACTIVE;
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" stroke={c} strokeWidth="1.4" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" stroke={c} strokeWidth="1.4" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" stroke={c} strokeWidth="1.4" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" stroke={c} strokeWidth="1.4" />
    </svg>
  );
}

export function IconCal({ active }: IconProps) {
  const c = active ? ACTIVE : INACTIVE;
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke={c} strokeWidth="1.4" />
      <path d="M3 10h18M8 3v4M16 3v4" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconUser({ active }: IconProps) {
  const c = active ? ACTIVE : INACTIVE;
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={c} strokeWidth="1.4" />
      <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconPlay({ c = "#000", size = 18 }: ColorIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={c}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function IconArrow({ c = ACTIVE, size = 14 }: ColorIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14M13 5l7 7-7 7" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCheck({ c = ACTIVE, size = 10 }: ColorIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 12l5 5L19 7" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconFlame() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 2s4 4.5 4 9a4 4 0 01-8 0c0-2 1-3 1-5-2 1-5 4-5 8a8 8 0 0016 0c0-6-8-12-8-12z" stroke={ACTIVE} strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

export function IconLock({ c = ACTIVE, size = 11 }: ColorIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="5" y="10" width="14" height="10" rx="2" stroke={c} strokeWidth="1.4" />
      <path d="M8 10V7a4 4 0 018 0v3" stroke={c} strokeWidth="1.4" />
    </svg>
  );
}

export function IconBolt() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke={ACTIVE} strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}
