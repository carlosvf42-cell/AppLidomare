"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "0.5px solid rgba(255,255,255,0.08)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)",
};

export default function NuevoEntrenoPlaceholderPage() {
  const rawParams = useParams();
  const userId =
    typeof rawParams?.userId === "string"
      ? rawParams.userId
      : Array.isArray(rawParams?.userId)
      ? rawParams.userId[0]
      : "";

  return (
    <div className="min-h-screen" style={{ background: "#080808" }}>
      <div className="px-5 pt-14 pb-6 flex items-center gap-3">
        <Link href={`/admin/antifragil/${userId}`} className="shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div>
          <p style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(42,191,191,0.7)", fontFamily: "Barlow Condensed, sans-serif" }}>
            Nuevo entreno
          </p>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "1.75rem", fontWeight: 300, lineHeight: 1.1, color: "rgba(255,255,255,0.95)" }}>
            Próximamente
          </h1>
        </div>
      </div>

      <div className="px-4">
        <div className="rounded-2xl px-5 py-10 text-center" style={GLASS}>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "Barlow Condensed, sans-serif", lineHeight: 1.6, letterSpacing: "0.02em" }}>
            Aquí podrás crear y empezar un nuevo entreno para este cliente Antifrágil.
          </p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "Barlow Condensed, sans-serif", marginTop: 8 }}>
            Pendiente de implementación.
          </p>
        </div>
      </div>
    </div>
  );
}
