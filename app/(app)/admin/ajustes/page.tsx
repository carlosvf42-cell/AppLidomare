"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useAdminMode } from "@/lib/useAdminMode";

const ADMIN_EMAIL = "carlosvf42@gmail.com";

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

const EYEBROW: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.25em",
  textTransform: "uppercase",
  color: "rgba(42,191,191,0.7)",
  fontFamily: "var(--font-ui)",
};

const APP_VERSION = "0.1.0";

export default function AjustesPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState<string>("");
  const [fullName, setFullName] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [, setAdminMode] = useAdminMode();

  useEffect(() => {
    getSupabase()
      .auth.getSession()
      .then(({ data }) => {
        if (data.session?.user?.email !== ADMIN_EMAIL) {
          router.replace("/");
        } else {
          setEmail(data.session.user.email ?? "");
          setFullName((data.session.user.user_metadata?.full_name as string | undefined) ?? null);
          setChecking(false);
        }
      });
  }, [router]);

  async function handleSignOut() {
    setSigningOut(true);
    await getSupabase().auth.signOut();
    router.replace("/login");
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080808" }}>
        <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayName = fullName?.trim() || email.split("@")[0];

  return (
    <div className="min-h-screen" style={{ background: "#080808" }}>
      <div className="px-5 pt-14 pb-6">
        <p style={EYEBROW}>Configuración</p>
        <h1
          className="mt-0.5"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "1.75rem",
            fontWeight: 400,
            lineHeight: 1.1,
            color: "rgba(255,255,255,0.95)",
          }}
        >
          Ajustes
        </h1>
      </div>

      <div className="px-4 pb-16 space-y-6">
        {/* Panel de usuario toggle */}
        <button
          type="button"
          onClick={() => {
            setAdminMode(false);
            router.push("/");
          }}
          className="w-full rounded-2xl px-5 py-4 flex items-center justify-between active:scale-[0.99]"
          style={{
            ...GLASS,
            background: "rgba(42,191,191,0.06)",
            border: "0.5px solid rgba(42,191,191,0.25)",
            cursor: "pointer",
          }}
        >
          <span className="text-xs tracking-[0.15em] uppercase" style={{ color: "#2abfbf", fontFamily: "var(--font-ui)" }}>
            Panel de usuario
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="rgba(42,191,191,0.7)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Mi cuenta */}
        <section>
          <p className="mb-3 px-1" style={EYEBROW}>Mi cuenta</p>
          <div className="rounded-2xl px-5 py-5 space-y-4" style={GLASS}>
            <div>
              <p className="text-[10px] tracking-wider uppercase mb-1" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-ui)" }}>
                Nombre
              </p>
              <p className="text-base" style={{ color: "rgba(255,255,255,0.95)", fontFamily: "var(--font-ui)", fontWeight: 300 }}>
                {displayName}
              </p>
            </div>
            <div>
              <p className="text-[10px] tracking-wider uppercase mb-1" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-ui)" }}>
                Email
              </p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-ui)", letterSpacing: "0.02em" }}>
                {email}
              </p>
            </div>
            <div>
              <p className="text-[10px] tracking-wider uppercase mb-1" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-ui)" }}>
                Rol
              </p>
              <span
                className="inline-block text-[9px] tracking-[0.2em] uppercase font-semibold px-2 py-0.5 rounded"
                style={{
                  background: "rgba(42,191,191,0.12)",
                  border: "0.5px solid rgba(42,191,191,0.4)",
                  color: "#2abfbf",
                  fontFamily: "var(--font-ui)",
                }}
              >
                Admin
              </span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full mt-2 py-3 rounded-xl text-xs font-semibold tracking-widest uppercase active:scale-[0.98] disabled:opacity-50"
              style={{
                background: "rgba(255,128,128,0.06)",
                border: "0.5px solid rgba(255,128,128,0.25)",
                color: "rgba(255,128,128,0.85)",
                fontFamily: "var(--font-ui)",
              }}
            >
              {signingOut ? "Cerrando sesión…" : "Cerrar sesión"}
            </button>
          </div>
        </section>

        {/* Equipo */}
        <section>
          <p className="mb-3 px-1" style={EYEBROW}>Equipo</p>
          <div className="rounded-2xl px-5 py-5 space-y-3" style={GLASS}>
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: "rgba(42,191,191,0.12)",
                  border: "0.5px solid rgba(42,191,191,0.3)",
                }}
              >
                <span style={{ fontSize: 12, color: "#2abfbf", fontFamily: "var(--font-ui)", fontWeight: 600 }}>
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ color: "rgba(255,255,255,0.9)", fontFamily: "var(--font-ui)", letterSpacing: "0.02em" }}>
                  {displayName}
                </p>
                <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-ui)" }}>
                  Admin · Acceso total
                </p>
              </div>
            </div>
            <p
              className="text-[11px] pt-2"
              style={{
                color: "rgba(255,255,255,0.35)",
                fontFamily: "var(--font-ui)",
                lineHeight: 1.6,
                letterSpacing: "0.02em",
                borderTop: "0.5px solid rgba(255,255,255,0.06)",
              }}
            >
              Próximamente: roles de fisio y entrenador con accesos diferenciados.
            </p>
          </div>
        </section>

        {/* App */}
        <section>
          <p className="mb-3 px-1" style={EYEBROW}>App</p>
          <div className="rounded-2xl px-5 py-4 flex items-center justify-between" style={GLASS}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-ui)", letterSpacing: "0.02em" }}>
              Versión
            </span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontFamily: "var(--font-ui)", letterSpacing: "0.05em" }}>
              {APP_VERSION}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
