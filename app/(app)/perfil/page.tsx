"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import ProgresoSection from "@/components/ProgresoSection";

const ADMIN_EMAIL = "carlosvf42@gmail.com";

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.07)",
  backdropFilter: "blur(24px) saturate(180%)",
  WebkitBackdropFilter: "blur(24px) saturate(180%)",
  border: "0.5px solid rgba(255,255,255,0.13)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 4px 24px rgba(0,0,0,0.4)",
};

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 rounded-full animate-spin" style={{ border: "1.5px solid rgba(255,255,255,0.1)", borderTopColor: "#2abfbf" }} />
      </div>
    );
  }

  const email = user?.email ?? "";
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen pt-14 pb-[calc(80px+env(safe-area-inset-bottom))]">

      {/* Header */}
      <p className="text-[10px] tracking-[0.25em] uppercase px-6 mb-8" style={{ color: "#2abfbf" }}>
        Perfil
      </p>

      {/* Avatar + email */}
      <div className="flex items-center gap-4 mb-6 px-5">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-light shrink-0"
          style={{
            background: "rgba(42,191,191,0.12)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "0.5px solid rgba(42,191,191,0.3)",
            color: "#2abfbf",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-light truncate" style={{ color: "rgba(255,255,255,0.9)" }}>{email}</p>
          <p className="text-xs font-light mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Miembro activo</p>
        </div>
      </div>

      {/* Info row */}
      <div className="rounded-2xl overflow-hidden mb-3 mx-4" style={GLASS}>
        <div className="px-5 py-4">
          <p className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Email</p>
          <p className="text-sm font-light break-all" style={{ color: "rgba(255,255,255,0.85)" }}>{email}</p>
        </div>
      </div>

      {/* Admin link */}
      {email === ADMIN_EMAIL && (
        <Link
          href="/admin"
          className="flex items-center justify-between w-full px-5 py-4 rounded-2xl mb-3 mx-4 transition-all active:scale-[0.98]"
          style={{ ...GLASS, width: "calc(100% - 2rem)" }}
        >
          <span className="text-xs tracking-[0.15em] uppercase" style={{ color: "rgba(255,255,255,0.55)" }}>
            Panel de administración
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="rgba(255,255,255,0.3)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      )}

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="text-xs tracking-[0.15em] uppercase py-4 rounded-2xl transition-all active:scale-[0.98] mb-6 mx-4"
        style={{
          ...GLASS,
          width: "calc(100% - 2rem)",
          color: "rgba(255,100,100,0.7)",
          border: "0.5px solid rgba(255,80,80,0.2)",
        }}
      >
        Cerrar sesión
      </button>

      {/* Separador */}
      <div className="mx-4 mb-2" style={{ height: "0.5px", background: "rgba(255,255,255,0.07)" }} />

      {/* Mi Progreso */}
      <ProgresoSection />
    </div>
  );
}
