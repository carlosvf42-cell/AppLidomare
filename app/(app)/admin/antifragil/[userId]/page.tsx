"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const ADMIN_EMAIL = "carlosvf42@gmail.com";

type ClienteData = {
  user: { id: string; email: string; full_name: string | null; is_antifragil: boolean };
  entrenos: Array<{
    id: string;
    tipo: "fuerza" | "cardio" | "funcional" | string;
    nombre: string | null;
    estado: string;
    created_at: string;
  }>;
  sesiones: Array<{
    id: string;
    fecha: string;
    completada: boolean;
    duracion_minutos: number | null;
    rpe: number | null;
    comentario: string | null;
    entreno_id: string;
    entrenos_antifragil: { tipo: string; nombre: string | null } | null;
  }>;
};

const TIPO_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  fuerza: { label: "Fuerza", color: "#ff8060", bg: "rgba(255,128,96,0.1)", border: "rgba(255,128,96,0.35)" },
  cardio: { label: "Cardio", color: "#ffb040", bg: "rgba(255,176,64,0.1)", border: "rgba(255,176,64,0.35)" },
  funcional: { label: "Funcional", color: "#2abfbf", bg: "rgba(42,191,191,0.12)", border: "rgba(42,191,191,0.4)" },
};

function tipoMeta(tipo: string) {
  return TIPO_META[tipo] ?? { label: tipo, color: "rgba(255,255,255,0.55)", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.15)" };
}

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
  fontFamily: "Barlow Condensed, sans-serif",
};

function TipoIcon({ tipo, color }: { tipo: string; color: string }) {
  if (tipo === "fuerza") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M6 9h2v6H6zM16 9h2v6h-2zM4 11h2v2H4zM18 11h2v2h-2zM8 11h8v2H8z" fill={color}/>
      </svg>
    );
  }
  if (tipo === "cardio") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M12 21s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.5-7 10-7 10z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  if (tipo === "funcional") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="6" r="2" stroke={color} strokeWidth="1.5"/>
        <path d="M12 8v6M9 14l3-2 3 2M9 20l3-6 3 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="1.5"/>
    </svg>
  );
}

function formatFecha(fecha: string): string {
  const d = new Date(fecha + "T12:00:00");
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

export default function ClienteDetailPage() {
  const router = useRouter();
  const rawParams = useParams();
  const userId =
    typeof rawParams?.userId === "string"
      ? rawParams.userId
      : Array.isArray(rawParams?.userId)
      ? rawParams.userId[0]
      : "";

  const [checking, setChecking] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<ClienteData | null>(null);
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
    if (checking || !token || !userId) return;
    fetch(`/api/admin/antifragil/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((res) => {
        if (res.error) setError(res.error);
        else setData(res as ClienteData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [checking, token, userId]);

  if (checking || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080808" }}>
        <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen" style={{ background: "#080808" }}>
        <div className="px-5 pt-14 pb-6 flex items-center gap-3">
          <Link href="/admin/antifragil" className="shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <h1 className="text-lg font-light" style={{ color: "rgba(255,255,255,0.9)", fontFamily: "Cormorant Garamond, serif" }}>Cliente</h1>
        </div>
        <p className="text-xs text-center py-8" style={{ color: "#ff8080", fontFamily: "Barlow Condensed, sans-serif" }}>{error ?? "No se pudo cargar"}</p>
      </div>
    );
  }

  const nombre = data.user.full_name?.trim() || data.user.email.split("@")[0];

  return (
    <div className="min-h-screen" style={{ background: "#080808" }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-6 flex items-center gap-3">
        <Link href="/admin/antifragil" className="shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div className="min-w-0">
          <p style={EYEBROW}>Cliente</p>
          <div className="flex items-center gap-2 mt-0.5">
            <h1
              className="truncate"
              style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "1.75rem", fontWeight: 300, lineHeight: 1.1, color: "rgba(255,255,255,0.95)" }}
            >
              {nombre}
            </h1>
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
          <p className="truncate mt-1" style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "Barlow Condensed, sans-serif" }}>
            {data.user.email}
          </p>
        </div>
      </div>

      <div className="px-4 pb-16 space-y-6">
        {/* CTA: Entrenar ahora */}
        <Link
          href={`/admin/antifragil/${data.user.id}/entreno/nuevo`}
          className="block w-full py-4 rounded-2xl text-sm font-semibold tracking-widest uppercase transition-all active:scale-[0.98] text-center"
          style={{
            background: "#2abfbf",
            color: "#000",
            fontFamily: "Barlow Condensed, sans-serif",
            boxShadow: "0 4px 24px rgba(42,191,191,0.4), inset 0 1px 0 rgba(255,255,255,0.25)",
            textDecoration: "none",
          }}
        >
          Entrenar ahora
        </Link>

        {/* Siguientes entrenos */}
        <section>
          <p className="mb-3 px-1" style={EYEBROW}>Siguientes entrenos</p>
          {data.entrenos.length === 0 ? (
            <div className="rounded-2xl px-5 py-8 text-center" style={GLASS}>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "Barlow Condensed, sans-serif", lineHeight: 1.5 }}>
                Sin entrenos programados
              </p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "Barlow Condensed, sans-serif", marginTop: 6, letterSpacing: "0.02em" }}>
                Programa el próximo entreno desde "Entrenar ahora"
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.entrenos.map((e) => {
                const meta = tipoMeta(e.tipo);
                return (
                  <div key={e.id} className="rounded-2xl px-4 py-4 flex items-center justify-between gap-3" style={GLASS}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] tracking-[0.2em] uppercase font-semibold"
                          style={{
                            background: meta.bg,
                            border: `0.5px solid ${meta.border}`,
                            color: meta.color,
                            fontFamily: "Barlow Condensed, sans-serif",
                          }}
                        >
                          <TipoIcon tipo={e.tipo} color={meta.color} />
                          {meta.label}
                        </span>
                      </div>
                      <p
                        className="truncate"
                        style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", fontFamily: "Barlow Condensed, sans-serif", letterSpacing: "0.02em" }}
                      >
                        {e.nombre || "Sin nombre"}
                      </p>
                    </div>
                    <Link
                      href={`/admin/antifragil/${data.user.id}/entreno/${e.id}`}
                      className="shrink-0 px-4 py-2 rounded-xl text-[10px] font-semibold tracking-widest uppercase transition-colors active:scale-[0.98]"
                      style={{
                        background: "rgba(42,191,191,0.12)",
                        border: "0.5px solid rgba(42,191,191,0.35)",
                        color: "#2abfbf",
                        fontFamily: "Barlow Condensed, sans-serif",
                        textDecoration: "none",
                      }}
                    >
                      Iniciar
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Historial */}
        <section>
          <p className="mb-3 px-1" style={EYEBROW}>Historial</p>
          {data.sesiones.length === 0 ? (
            <div className="rounded-2xl px-5 py-8 text-center" style={GLASS}>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "Barlow Condensed, sans-serif", lineHeight: 1.5 }}>
                Sin sesiones completadas todavía
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.sesiones.map((s) => {
                const tipo = s.entrenos_antifragil?.tipo ?? "";
                const meta = tipoMeta(tipo);
                const nombreEntreno = s.entrenos_antifragil?.nombre || "Sin nombre";
                return (
                  <div key={s.id} className="rounded-2xl px-4 py-3.5" style={GLASS}>
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span
                        className="shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] tracking-[0.2em] uppercase font-semibold"
                        style={{
                          background: meta.bg,
                          border: `0.5px solid ${meta.border}`,
                          color: meta.color,
                          fontFamily: "Barlow Condensed, sans-serif",
                        }}
                      >
                        <TipoIcon tipo={tipo} color={meta.color} />
                        {meta.label || "—"}
                      </span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "Barlow Condensed, sans-serif", letterSpacing: "0.02em" }}>
                        {formatFecha(s.fecha)}
                      </span>
                    </div>
                    <p className="truncate mb-1" style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "Barlow Condensed, sans-serif", letterSpacing: "0.02em" }}>
                      {nombreEntreno}
                    </p>
                    <div className="flex items-center gap-3" style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "Barlow Condensed, sans-serif", letterSpacing: "0.02em" }}>
                      {s.duracion_minutos != null && (
                        <span>{s.duracion_minutos} min</span>
                      )}
                      {s.rpe != null && (
                        <span>RPE {s.rpe}/10</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
