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

type SesionReciente = {
  id: string;
  user_id: string;
  fecha: string;
  rpe: number | null;
  duracion_minutos: number | null;
  tipo_resumen: string | null;
  entreno_nombre: string | null;
  cliente_email: string;
  cliente_nombre: string | null;
};

const TIPO_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  fuerza: { label: "Fuerza", color: "#ff8060", bg: "rgba(255,128,96,0.1)", border: "rgba(255,128,96,0.35)" },
  cardio: { label: "Cardio", color: "#ffb040", bg: "rgba(255,176,64,0.1)", border: "rgba(255,176,64,0.35)" },
  funcional: { label: "Funcional", color: "#2abfbf", bg: "rgba(42,191,191,0.12)", border: "rgba(42,191,191,0.4)" },
  mixto: { label: "Mixto", color: "rgba(255,255,255,0.7)", bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.18)" },
};

function tipoMeta(t: string | null) {
  if (!t) return null;
  return TIPO_META[t] ?? null;
}

function formatFecha(s: string): string {
  const d = new Date(s + "T12:00:00");
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
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
  const [sesiones, setSesiones] = useState<SesionReciente[]>([]);
  const [iniciandoUserId, setIniciandoUserId] = useState<string | null>(null);

  async function entrenarAhora(userId: string) {
    if (!token) return;
    setIniciandoUserId(userId);
    setError(null);
    const res = await fetch(`/api/admin/antifragil/${userId}/entrenos`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nombre: null, estado: "programado", bloques: [] }),
    });
    const j = await res.json();
    if (!res.ok) {
      setIniciandoUserId(null);
      setError(j.error ?? "No se pudo iniciar el entreno");
      return;
    }
    router.push(`/admin/antifragil/${userId}/entreno/${j.id}/live`);
  }

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
    Promise.all([
      fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch("/api/admin/antifragil/sesiones-recientes", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ])
      .then(([userData, sesionData]) => {
        if (userData.error) {
          setError(userData.error);
        } else {
          const af = (userData.users as UsuarioRow[])
            .filter((u) => u.is_antifragil)
            .sort((a, b) => displayName(a).localeCompare(displayName(b), "es"));
          setUsers(af);
        }
        if (!sesionData.error && Array.isArray(sesionData.sesiones)) {
          setSesiones(sesionData.sesiones as SesionReciente[]);
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

  const EYEBROW: React.CSSProperties = {
    fontSize: 10,
    letterSpacing: "0.25em",
    textTransform: "uppercase",
    color: "rgba(42,191,191,0.7)",
    fontFamily: "Barlow Condensed, sans-serif",
  };

  return (
    <div className="min-h-screen" style={{ background: "#080808" }}>
      <div className="px-5 pt-14 pb-6">
        <p style={EYEBROW}>Antifrágil · Admin</p>
        <h1
          className="mt-0.5"
          style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "1.75rem", fontWeight: 300, lineHeight: 1.1, color: "rgba(255,255,255,0.95)" }}
        >
          Entrenos
        </h1>
      </div>

      <div className="px-4 pb-16 space-y-6">
        {/* CTA: Nueva rutina */}
        <Link
          href="/rutinas/nueva"
          className="block w-full text-center py-3.5 rounded-2xl text-xs font-semibold tracking-widest uppercase transition-all active:scale-[0.98]"
          style={{
            background: "rgba(42,191,191,0.08)",
            border: "0.5px dashed rgba(42,191,191,0.4)",
            color: "#2abfbf",
            fontFamily: "Barlow Condensed, sans-serif",
            textDecoration: "none",
          }}
        >
          + Nueva rutina
        </Link>

        {error && (
          <p className="text-xs text-center" style={{ color: "#ff8080", fontFamily: "Barlow Condensed, sans-serif" }}>{error}</p>
        )}

        {/* Clientes Antifrágil */}
        <section>
          <p className="mb-3 px-1" style={EYEBROW}>Clientes Antifrágil</p>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-2xl px-6 py-10 text-center" style={GLASS}>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "Barlow Condensed, sans-serif", letterSpacing: "0.02em", lineHeight: 1.6 }}>
                Aún no hay clientes Antifrágil.
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontFamily: "Barlow Condensed, sans-serif", marginTop: 8 }}>
                Marca alumnos como Antifrágil desde la pestaña Alumnos.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u.id} className="rounded-2xl px-5 py-4" style={GLASS}>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="truncate min-w-0 flex-1" style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 18, fontWeight: 300, color: "rgba(255,255,255,0.95)" }}>
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
                  <p className="truncate mb-3" style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "Barlow Condensed, sans-serif", letterSpacing: "0.02em" }}>
                    {u.email}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => entrenarAhora(u.id)}
                      disabled={iniciandoUserId === u.id}
                      className="flex-1 py-2.5 rounded-xl text-[10px] font-semibold tracking-widest uppercase transition-all active:scale-[0.98] disabled:opacity-60"
                      style={{
                        background: "#2abfbf",
                        color: "#000",
                        fontFamily: "Barlow Condensed, sans-serif",
                        boxShadow: "0 4px 16px rgba(42,191,191,0.3), inset 0 1px 0 rgba(255,255,255,0.25)",
                        border: "none",
                        cursor: iniciandoUserId === u.id ? "wait" : "pointer",
                      }}
                    >
                      {iniciandoUserId === u.id ? "Iniciando…" : "Entrenar ahora"}
                    </button>
                    <Link
                      href={`/admin/antifragil/${u.id}`}
                      className="flex-1 text-center py-2.5 rounded-xl text-[10px] font-semibold tracking-widest uppercase transition-colors active:scale-[0.98]"
                      style={{
                        background: "rgba(42,191,191,0.08)",
                        border: "0.5px solid rgba(42,191,191,0.3)",
                        color: "#2abfbf",
                        fontFamily: "Barlow Condensed, sans-serif",
                        textDecoration: "none",
                      }}
                    >
                      Ver cliente
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sesiones recientes */}
        <section>
          <p className="mb-3 px-1" style={EYEBROW}>Sesiones recientes</p>
          {sesiones.length === 0 ? (
            <div className="rounded-2xl px-6 py-8 text-center" style={GLASS}>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "Barlow Condensed, sans-serif", letterSpacing: "0.02em", lineHeight: 1.6 }}>
                Sin sesiones recientes
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sesiones.map((s) => {
                const meta = tipoMeta(s.tipo_resumen);
                const nombre = s.cliente_nombre?.trim() || s.cliente_email.split("@")[0];
                return (
                  <Link
                    key={s.id}
                    href={`/admin/antifragil/${s.user_id}`}
                    className="block rounded-2xl px-4 py-3.5"
                    style={{ ...GLASS, textDecoration: "none" }}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        {meta && (
                          <span
                            className="shrink-0 text-[9px] tracking-[0.2em] uppercase font-semibold px-2 py-0.5 rounded"
                            style={{
                              background: meta.bg,
                              border: `0.5px solid ${meta.border}`,
                              color: meta.color,
                              fontFamily: "Barlow Condensed, sans-serif",
                            }}
                          >
                            {meta.label}
                          </span>
                        )}
                        <p className="truncate" style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", fontFamily: "Barlow Condensed, sans-serif", letterSpacing: "0.02em" }}>
                          {nombre}
                        </p>
                      </div>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "Barlow Condensed, sans-serif", letterSpacing: "0.02em" }}>
                        {formatFecha(s.fecha)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3" style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "Barlow Condensed, sans-serif", letterSpacing: "0.02em" }}>
                      {s.entreno_nombre && <span className="truncate">{s.entreno_nombre}</span>}
                      {s.duracion_minutos != null && <span>{s.duracion_minutos} min</span>}
                      {s.rpe != null && <span>RPE {s.rpe}/10</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
