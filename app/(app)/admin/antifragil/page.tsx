"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const ADMIN_EMAIL = "carlosvf42@gmail.com";

type UsuarioRow = {
  id: string;
  email: string;
  full_name: string | null;
  is_antifragil: boolean;
};

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "0.5px solid rgba(255,255,255,0.08)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)",
};

function displayName(u: UsuarioRow): string {
  return u.full_name?.trim() || u.email.split("@")[0];
}

export default function AntifragilListPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [users, setUsers] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSupabase()
      .auth.getSession()
      .then(({ data }) => {
        if (data.session?.user?.email !== ADMIN_EMAIL) {
          router.replace("/");
        } else {
          setToken(data.session.access_token);
          setChecking(false);
        }
      });
  }, [router]);

  useEffect(() => {
    if (checking || !token) return;
    fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          const af = (data.users as UsuarioRow[])
            .filter((u) => u.is_antifragil)
            .sort((a, b) => displayName(a).localeCompare(displayName(b), "es"));
          setUsers(af);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [checking, token]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080808" }}>
        <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#080808" }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-6 flex items-center gap-3">
        <Link href="/admin" className="shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div>
          <p style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(42,191,191,0.7)", fontFamily: "Barlow Condensed, sans-serif" }}>
            Antifrágil
          </p>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "1.75rem", fontWeight: 300, lineHeight: 1.1, color: "rgba(255,255,255,0.95)" }}>
            Clientes Antifrágil
          </h1>
        </div>
      </div>

      <div className="px-4 pb-12">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <p className="text-xs text-center py-8" style={{ color: "#ff8080", fontFamily: "Barlow Condensed, sans-serif" }}>{error}</p>
        ) : users.length === 0 ? (
          <div className="rounded-2xl px-6 py-12 text-center" style={GLASS}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "Barlow Condensed, sans-serif", letterSpacing: "0.02em", lineHeight: 1.6 }}>
              Aún no hay clientes Antifrágil.
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontFamily: "Barlow Condensed, sans-serif", marginTop: 8 }}>
              Marca alumnos como Antifrágil desde el panel de admin.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="rounded-2xl px-5 py-4" style={GLASS}>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate" style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 18, fontWeight: 300, color: "rgba(255,255,255,0.95)" }}>
                        {displayName(u)}
                      </p>
                      <span
                        className="shrink-0 text-[9px] tracking-[0.2em] uppercase font-semibold px-2 py-0.5 rounded"
                        style={{
                          background: "rgba(42,191,191,0.12)",
                          border: "0.5px solid rgba(42,191,191,0.4)",
                          color: "#2abfbf",
                          fontFamily: "Barlow Condensed, sans-serif",
                        }}
                      >
                        Antifrágil
                      </span>
                    </div>
                    <p className="truncate mt-0.5" style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "Barlow Condensed, sans-serif", letterSpacing: "0.02em" }}>
                      {u.email}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/admin/antifragil/${u.id}`}
                  className="block w-full text-center py-2.5 rounded-xl text-xs font-semibold tracking-widest uppercase transition-colors active:scale-[0.98]"
                  style={{
                    background: "rgba(42,191,191,0.12)",
                    border: "0.5px solid rgba(42,191,191,0.35)",
                    color: "#2abfbf",
                    fontFamily: "Barlow Condensed, sans-serif",
                    textDecoration: "none",
                  }}
                >
                  Ver cliente
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
