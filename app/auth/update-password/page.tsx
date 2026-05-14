"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10;

    const checkSession = async () => {
      attempts++;
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setReady(true);
        return;
      }

      if (attempts < maxAttempts) {
        setTimeout(checkSession, 500);
      } else {
        setError("Link inválido o expirado. Solicita uno nuevo.");
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setReady(true);
      }
    });

    checkSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpdate() {
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setError("Mínimo 6 caracteres.");
      return;
    }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError("Error al actualizar. Intenta de nuevo.");
    } else {
      await supabase.auth.signOut();
      router.push("/login?reset=success");
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080808",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
    }}>

      {/* Ambient blobs */}
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
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

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 390, padding: "0 32px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 18, letterSpacing: "0.4em", color: "#333", textTransform: "uppercase" }}>
            Lidomare
          </div>
          <div style={{ fontSize: 28, letterSpacing: "0.2em", fontWeight: 600, color: "#f0f0f0", textTransform: "uppercase", fontFamily: "var(--font-cormorant), Georgia, serif", marginTop: 4 }}>
            NUEVA CONTRASEÑA
          </div>
          <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "#2abfbf", textTransform: "uppercase", marginTop: 6 }}>
            Precision Wellness
          </div>
        </div>

        {/* Verificando */}
        {!ready && !error && (
          <div style={{ textAlign: "center", color: "#444", fontSize: 12, letterSpacing: "0.1em" }}>
            Verificando enlace...
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ color: "rgba(255,85,85,0.8)", fontSize: 11, letterSpacing: "0.1em", textAlign: "center", marginBottom: 24 }}>
            {error}
          </div>
        )}

        {/* Form */}
        {ready && (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 8, letterSpacing: "0.25em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 8 }}>
                Nueva contraseña
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
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

            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 8, letterSpacing: "0.25em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 8 }}>
                Confirmar contraseña
              </div>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
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

            <button
              type="button"
              onClick={handleUpdate}
              disabled={loading}
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
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.5 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {loading ? "Actualizando…" : "Actualizar contraseña"}
            </button>
          </>
        )}

        {/* Volver al login (solo cuando hay error) */}
        {!ready && error && (
          <button
            type="button"
            onClick={() => router.push("/login")}
            style={{
              width: "100%",
              marginTop: 24,
              background: "transparent",
              border: "none",
              color: "#333",
              fontSize: 9,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Volver al login
          </button>
        )}

        {/* Footer decorativo */}
        <div style={{ textAlign: "center", fontSize: 8, color: "#1a1a1a", letterSpacing: "0.2em", marginTop: 48 }}>
          <div>LM · PLAYAMAR · TORREMOLINOS</div>
          <div style={{ marginTop: 3 }}>SEC_CONN: ACTIVE</div>
        </div>

      </div>
    </div>
  );
}
