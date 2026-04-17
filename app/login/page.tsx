"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"checking" | "form">("checking");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const access_token  = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    const type          = params.get("type");

    if (access_token && refresh_token && type === "invite") {
      const supabase = createClient();
      supabase.auth
        .setSession({ access_token, refresh_token })
        .then(({ error }) => {
          if (error) setPhase("form");
          else router.replace("/auth/set-password");
        });
      return;
    }

    setPhase("form");
  }, [router]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email    = (form.elements.namedItem("email")    as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError("Email o contraseña incorrectos."); return; }
      router.push("/");
      router.refresh();
    });
  }

  // ── Spinner ────────────────────────────────────────────────────────────────
  if (phase === "checking") {
    return (
      <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="w-5 h-5 rounded-full animate-spin" style={{ border: "1.5px solid rgba(255,255,255,0.08)", borderTopColor: "#2abfbf" }} />
      </div>
    );
  }

  // ── Login form ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#080808", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>

      {/* Ambient blobs */}
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "-15%", left: "-20%",
          width: "65%", height: "65%", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(42,191,191,0.13) 0%, transparent 70%)",
          filter: "blur(80px)",
        }} />
        <div style={{
          position: "absolute", bottom: "5%", right: "-15%",
          width: "55%", height: "50%", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(42,191,191,0.08) 0%, transparent 70%)",
          filter: "blur(100px)",
        }} />
        <div style={{
          position: "absolute", top: "40%", left: "20%",
          width: "60%", height: "40%", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(42,191,191,0.05) 0%, transparent 70%)",
          filter: "blur(120px)",
        }} />
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 390, padding: "0 32px", display: "flex", flexDirection: "column", gap: 48 }}>

        {/* ── 1. Logo / nombre ── */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.4em", color: "#333", textTransform: "uppercase" }}>
            Lidomare
          </div>
          <div style={{ fontSize: 32, letterSpacing: "0.3em", fontWeight: 300, color: "#f0f0f0", textTransform: "uppercase", fontFamily: "var(--font-cormorant), Georgia, serif", marginTop: 4 }}>
            HEALTH APP
          </div>
          <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "#2abfbf", textTransform: "uppercase", marginTop: 6 }}>
            Precision Wellness
          </div>
        </div>

        {/* ── 2. Formulario ── */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Email */}
          <div>
            <label style={{ display: "block", fontSize: 8, letterSpacing: "0.25em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 8 }}>
              Identifier
            </label>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              style={{
                background: "transparent",
                border: "none",
                borderBottom: "0.5px solid rgba(255,255,255,0.15)",
                borderRadius: 0,
                color: "#f0f0f0",
                fontSize: 12,
                letterSpacing: "0.15em",
                padding: "12px 0",
                width: "100%",
                outline: "none",
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: "block", fontSize: 8, letterSpacing: "0.25em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 8 }}>
              Verification
            </label>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              style={{
                background: "transparent",
                border: "none",
                borderBottom: "0.5px solid rgba(255,255,255,0.15)",
                borderRadius: 0,
                color: "#f0f0f0",
                fontSize: 12,
                letterSpacing: "0.15em",
                padding: "12px 0",
                width: "100%",
                outline: "none",
              }}
            />
          </div>

          {error && (
            <p style={{ fontSize: 11, color: "rgba(255,120,120,0.8)", textAlign: "center", letterSpacing: "0.05em" }}>
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.2)",
              borderRadius: 4,
              color: "#f0f0f0",
              fontSize: 10,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              padding: 16,
              width: "100%",
              marginTop: 8,
              cursor: isPending ? "not-allowed" : "pointer",
              opacity: isPending ? 0.5 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {isPending ? "Accediendo…" : "Acceder"}
          </button>
        </form>

        {/* ── 3. Links ── */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            type="button"
            onClick={() => router.push("/auth/reset-password")}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: 9,
              letterSpacing: "0.2em",
              color: "#333",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Olvidé mi acceso
          </button>
        </div>

        {/* ── 4. Datos decorativos ── */}
        <div style={{ textAlign: "center", fontSize: 8, color: "#1a1a1a", letterSpacing: "0.2em" }}>
          <div>LM · PLAYAMAR · TORREMOLINOS</div>
          <div style={{ marginTop: 3 }}>SEC_CONN: ACTIVE</div>
        </div>

      </div>
    </div>
  );
}
