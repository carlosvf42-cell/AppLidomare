"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import GlassCard from "@/components/design/GlassCard";
import { IconArrow } from "@/components/design/icons";
import ProgresoSection from "@/components/ProgresoSection";
import { useAdminMode } from "@/lib/useAdminMode";

const ADMIN_EMAIL = "carlosvf42@gmail.com";

type HealthEstado = "ok" | "caution" | "danger";

const ESTADO_COLOR: Record<HealthEstado | "pending", string> = {
  ok: "#2abfbf",
  caution: "#ffb040",
  danger: "#ff6b6b",
  pending: "#ff9040",
};
const ESTADO_GLOW: Record<HealthEstado | "pending", string> = {
  ok: "0 0 8px rgba(42,191,191,0.6)",
  caution: "0 0 8px rgba(255,176,64,0.6)",
  danger: "0 0 8px rgba(255,107,107,0.6)",
  pending: "0 0 8px rgba(255,144,64,0.6)",
};

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [healthEstado, setHealthEstado] = useState<HealthEstado | null>(null);
  const [healthLoaded, setHealthLoaded] = useState(false);
  const [, setAdminMode] = useAdminMode();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      setLoading(false);
      if (data.user) {
        const { data: triage } = await supabase
          .from("health_assessments")
          .select("estado")
          .eq("user_id", data.user.id)
          .maybeSingle();
        setHealthEstado((triage?.estado as HealthEstado | undefined) ?? null);
      }
      setHealthLoaded(true);
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
  const estadoKey: HealthEstado | "pending" = healthEstado ?? "pending";
  const estadoLabel =
    healthEstado === "ok" ? "Apto para entrenar" :
    healthEstado === "caution" ? "Valoración recomendada" :
    healthEstado === "danger" ? "Consulta con un profesional" :
    "Completa tu perfil de salud";

  return (
    <div className="min-h-screen pt-14 pb-[calc(80px+env(safe-area-inset-bottom))]">

      {/* Mi perfil card — clickable → /perfil/salud */}
      <div className="mx-4 mb-3">
        <Link href="/perfil/salud" className="block ds-pressable active:scale-[0.98] transition-transform" style={{ textDecoration: "none" }}>
          <GlassCard variant="light" style={{ borderRadius: 20, padding: 0, cursor: "pointer" }}>
            <div style={{ position: "relative", zIndex: 1 }}>
              {/* Top row: avatar + name + email */}
              <div className="flex items-center gap-4 px-5 pt-5 pb-4">
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
                <div className="min-w-0 flex-1">
                  <h2
                    className="font-light truncate"
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "1.5rem",
                      lineHeight: 1.15,
                      color: "rgba(255,255,255,0.95)",
                    }}
                  >
                    Mi perfil
                  </h2>
                  <p
                    className="text-xs truncate mt-0.5"
                    style={{
                      fontFamily: "var(--font-condensed)",
                      color: "rgba(255,255,255,0.4)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {email}
                  </p>
                </div>
              </div>

              {/* Separator */}
              <div style={{ height: "0.5px", background: "rgba(255,255,255,0.06)" }} />

              {/* Bottom row: health estado */}
              <div className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`shrink-0 ${healthEstado === null ? "animate-pulse" : ""}`}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: ESTADO_COLOR[estadoKey],
                      boxShadow: ESTADO_GLOW[estadoKey],
                    }}
                  />
                  <span
                    className="text-sm font-light truncate"
                    style={{
                      color: !healthLoaded
                        ? "rgba(255,255,255,0.3)"
                        : healthEstado === "ok"
                        ? "#2abfbf"
                        : "var(--fg-2)",
                      fontFamily: "var(--font-condensed)",
                    }}
                  >
                    {healthLoaded ? estadoLabel : "Cargando estado…"}
                  </span>
                </div>
                <IconArrow c="rgba(255,255,255,0.3)" />
              </div>
            </div>
          </GlassCard>
        </Link>
      </div>

      {/* Admin mode toggle */}
      {email === ADMIN_EMAIL && (
        <div className="mx-4 mb-3">
          <button
            type="button"
            onClick={() => {
              setAdminMode(true);
              router.push("/admin/antifragil");
            }}
            className="block w-full ds-pressable"
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            <GlassCard variant="light" style={{ borderRadius: 16, padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                <span className="text-xs tracking-[0.15em] uppercase" style={{ color: "var(--fg-3)" }}>
                  Panel de admin
                </span>
                <IconArrow c="rgba(255,255,255,0.3)" />
              </div>
            </GlassCard>
          </button>
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
