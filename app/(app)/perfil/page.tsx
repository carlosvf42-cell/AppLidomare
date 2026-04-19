"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import GlassCard from "@/components/design/GlassCard";
import Eyebrow from "@/components/design/Eyebrow";
import MetaLabel from "@/components/design/MetaLabel";
import { IconArrow } from "@/components/design/icons";
import ProgresoSection from "@/components/ProgresoSection";

const ADMIN_EMAIL = "carlosvf42@gmail.com";

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
        <div className="w-5 h-5 rounded-full animate-spin" style={{ border: "1.5px solid rgba(255,255,255,0.1)", borderTopColor: "var(--accent)" }} />
      </div>
    );
  }

  const email = user?.email ?? "";
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen pt-14 pb-[calc(80px+env(safe-area-inset-bottom))]">

      {/* Header */}
      <Eyebrow className="px-6 mb-8">Perfil</Eyebrow>

      {/* Avatar + email */}
      <div className="flex items-center gap-4 mb-6 px-5">
        <div
          className="shrink-0"
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "rgba(42,191,191,0.12)",
            border: "2px solid rgba(42,191,191,0.35)",
            boxShadow: "0 0 0 4px rgba(42,191,191,0.06), inset 0 1px 0 rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 300,
            color: "var(--accent)",
          }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-light truncate" style={{ color: "var(--fg-2)" }}>{email}</p>
          <MetaLabel className="mt-0.5">Miembro activo</MetaLabel>
        </div>
      </div>

      {/* Email field */}
      <div className="mx-4 mb-3">
        <GlassCard variant="light" style={{ borderRadius: 16, padding: "16px 20px" }}>
          <div style={{ position: "relative", zIndex: 1 }}>
            <MetaLabel style={{ marginBottom: 4 }}>Email</MetaLabel>
            <p className="text-sm font-light break-all" style={{ color: "var(--fg-2)" }}>{email}</p>
          </div>
        </GlassCard>
      </div>

      {/* Admin link */}
      {email === ADMIN_EMAIL && (
        <div className="mx-4 mb-3">
          <Link href="/admin" className="block ds-pressable" style={{ textDecoration: "none" }}>
            <GlassCard variant="light" style={{ borderRadius: 16, padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                <span className="text-xs tracking-[0.15em] uppercase" style={{ color: "var(--fg-3)" }}>
                  Panel de administración
                </span>
                <IconArrow c="rgba(255,255,255,0.3)" />
              </div>
            </GlassCard>
          </Link>
        </div>
      )}

      {/* Sign out */}
      <div className="mx-4 mb-6">
        <button onClick={handleSignOut} className="w-full ds-pressable" style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
          <GlassCard variant="light" style={{
            borderRadius: 16,
            padding: "16px 20px",
            border: "0.5px solid var(--danger-border)",
          }}>
            <span className="text-xs tracking-[0.15em] uppercase" style={{ color: "var(--danger)", position: "relative", zIndex: 1 }}>
              Cerrar sesión
            </span>
          </GlassCard>
        </button>
      </div>

      {/* Separador */}
      <div className="mx-4 mb-2" style={{ height: "0.5px", background: "rgba(255,255,255,0.07)" }} />

      {/* Mi Progreso */}
      <ProgresoSection />
    </div>
  );
}
