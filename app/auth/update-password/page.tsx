"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const INPUT_STYLE: React.CSSProperties = {
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
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontSize: 8,
  letterSpacing: "0.25em",
  color: "rgba(255,255,255,0.25)",
  textTransform: "uppercase",
  marginBottom: 8,
};

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  async function handleUpdate() {
    setError(null);
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError("Error al actualizar la contraseña. Inténtalo de nuevo.");
    } else {
      router.push("/login");
    }
    setLoading(false);
  }

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

        {/* ── 1. Header ── */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, letterSpacing: "0.4em", color: "#333", textTransform: "uppercase" }}>
            Lidomare
          </div>
          <div style={{ fontSize: 32, letterSpacing: "0.3em", fontWeight: 300, color: "#f0f0f0", textTransform: "uppercase", fontFamily: "var(--font-cormorant), Georgia, serif", marginTop: 4 }}>
            NUEVA CONTRASEÑA
          </div>
          <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "#2abfbf", textTransform: "uppercase", marginTop: 6 }}>
            Precision Wellness
          </div>
        </div>

        {/* ── 2. Formulario ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Nueva contraseña */}
          <div>
            <label style={LABEL_STYLE}>Nueva contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              style={INPUT_STYLE}
            />
          </div>

          {/* Confirmar contraseña */}
          <div>
            <label style={LABEL_STYLE}>Confirmar contraseña</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              style={INPUT_STYLE}
            />
          </div>

          {error && (
            <p style={{ fontSize: 11, color: "rgba(255,120,120,0.8)", textAlign: "center", letterSpacing: "0.05em" }}>
              {error}
            </p>
          )}

          {/* Submit */}
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
              marginTop: 8,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {loading ? "Actualizando…" : "Actualizar"}
          </button>
        </div>

        {/* ── 3. Datos decorativos ── */}
        <div style={{ textAlign: "center", fontSize: 8, color: "#1a1a1a", letterSpacing: "0.2em" }}>
          <div>LM · PLAYAMAR · TORREMOLINOS</div>
          <div style={{ marginTop: 3 }}>SEC_CONN: ACTIVE</div>
        </div>

      </div>
    </div>
  );
}
