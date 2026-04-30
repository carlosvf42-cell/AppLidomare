"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

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
  fontFamily: "var(--font-serif)",
};

type Alerta = {
  id: string;
  user_id: string;
  fecha: string;
  acwr: number | null;
  wellness_score: number | null;
  nivel_riesgo: "verde" | "amarillo" | "rojo";
  categoria: string | null;
  razonamiento_ia: string | null;
  recomendacion_ia: string | null;
  mensaje_usuario: string | null;
  visto_por_fisio: boolean;
  visto_en: string | null;
  created_at: string;
  cliente_nombre: string;
  cliente_email: string;
};

const NIVEL_META: Record<Alerta["nivel_riesgo"], { label: string; color: string; bg: string; border: string; emoji: string }> = {
  verde: { label: "Sin riesgo", color: "#2abfbf", bg: "rgba(42,191,191,0.10)", border: "rgba(42,191,191,0.4)", emoji: "🟢" },
  amarillo: { label: "Precaución", color: "#EF9F27", bg: "rgba(239,159,39,0.10)", border: "rgba(239,159,39,0.4)", emoji: "🟡" },
  rojo: { label: "Alerta", color: "#E24B4A", bg: "rgba(226,75,74,0.10)", border: "rgba(226,75,74,0.4)", emoji: "🔴" },
};

const CATEGORIA_META: Record<string, { label: string; icon: string }> = {
  carga: { label: "Carga", icon: "⚡" },
  wellness: { label: "Wellness", icon: "🧠" },
  lesion: { label: "Lesión", icon: "🩹" },
  combinado: { label: "Combinado", icon: "⚙" },
  sin_datos: { label: "Sin datos", icon: "—" },
};

function formatFecha(s: string): string {
  const d = new Date(s);
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

export default function AlertasPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<"pendientes" | "revisadas">("pendientes");
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marcando, setMarcando] = useState<string | null>(null);
  const [analizando, setAnalizando] = useState<{ activo: boolean; current: number; total: number; mensaje: string }>({
    activo: false,
    current: 0,
    total: 0,
    mensaje: "",
  });

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

  async function loadAlertas() {
    if (!token) return;
    setLoading(true);
    setError(null);
    const supabase = getSupabase();
    const { data: rows, error: err } = await supabase
      .from("injury_risk_assessments")
      .select("id, user_id, fecha, acwr, wellness_score, nivel_riesgo, categoria, razonamiento_ia, recomendacion_ia, mensaje_usuario, visto_por_fisio, visto_en, created_at")
      .eq("visto_por_fisio", tab === "revisadas")
      .order("created_at", { ascending: false })
      .limit(50);
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    const userIds = Array.from(new Set((rows ?? []).map((r: any) => r.user_id)));
    const usersById = new Map<string, { full_name: string | null; email: string }>();
    if (userIds.length > 0) {
      const res = await fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } });
      const j = await res.json();
      const all = (j.users ?? []) as Array<{ id: string; email: string; full_name: string | null }>;
      for (const u of all) usersById.set(u.id, { email: u.email, full_name: u.full_name });
    }

    const list: Alerta[] = (rows ?? []).map((r: any) => {
      const u = usersById.get(r.user_id);
      return {
        ...r,
        cliente_nombre: u?.full_name?.trim() || u?.email?.split("@")[0] || "—",
        cliente_email: u?.email ?? "",
      };
    });
    setAlertas(list);
    setLoading(false);
  }

  useEffect(() => {
    if (!checking && token) loadAlertas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, token, tab]);

  async function marcarRevisada(id: string) {
    if (!token) return;
    setMarcando(id);
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    const { error: err } = await supabase
      .from("injury_risk_assessments")
      .update({
        visto_por_fisio: true,
        visto_en: new Date().toISOString(),
        revisada_por: session?.user?.id ?? null,
      })
      .eq("id", id);
    setMarcando(null);
    if (err) {
      setError(err.message);
      return;
    }
    await loadAlertas();
  }

  async function analizarTodos() {
    if (!token) return;
    setError(null);
    const res = await fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } });
    const j = await res.json();
    const targets = (j.users ?? []).filter((u: any) => u.is_antifragil);
    if (targets.length === 0) {
      setError("No hay clientes Antifrágil");
      return;
    }
    setAnalizando({ activo: true, current: 0, total: targets.length, mensaje: "" });
    const supabase = getSupabase();
    for (let i = 0; i < targets.length; i++) {
      const u = targets[i];
      setAnalizando({ activo: true, current: i + 1, total: targets.length, mensaje: u.full_name ?? u.email });
      try {
        const { error: fnErr } = await supabase.functions.invoke("analizar-usuario", {
          body: { user_id: u.id },
        });
        if (fnErr) console.error("[analizar-usuario]", u.id, fnErr);
      } catch (e: any) {
        console.error("[analizar-usuario]", u.id, e);
      }
    }
    setAnalizando({ activo: false, current: 0, total: 0, mensaje: "" });
    await loadAlertas();
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080808" }}>
        <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#080808" }}>
      <div className="px-5 pt-14 pb-6">
        <p style={EYEBROW}>Supervisión clínica · Antifrágil</p>
        <h1
          className="mt-0.5"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "1.75rem",
            fontWeight: 300,
            lineHeight: 1.1,
            color: "rgba(255,255,255,0.95)",
          }}
        >
          Alertas
        </h1>
      </div>

      <div className="px-4 pb-16 space-y-4">
        {/* Analizar todos */}
        <button
          type="button"
          onClick={analizarTodos}
          disabled={analizando.activo}
          className="w-full py-3 rounded-2xl text-xs font-semibold tracking-widest uppercase active:scale-[0.98] disabled:opacity-60"
          style={{
            background: "rgba(42,191,191,0.08)",
            border: "0.5px dashed rgba(42,191,191,0.4)",
            color: "#2abfbf",
            fontFamily: "var(--font-serif)",
          }}
        >
          {analizando.activo
            ? `Analizando ${analizando.current} de ${analizando.total}${analizando.mensaje ? ` · ${analizando.mensaje}` : ""}…`
            : "Analizar todos los Antifrágil"}
        </button>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1.5">
          {(["pendientes", "revisadas"] as const).map((t) => {
            const sel = tab === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className="py-2.5 rounded-xl text-[10px] tracking-[0.18em] uppercase font-semibold"
                style={{
                  background: sel ? "rgba(42,191,191,0.15)" : "rgba(255,255,255,0.04)",
                  border: `0.5px solid ${sel ? "rgba(42,191,191,0.4)" : "rgba(255,255,255,0.08)"}`,
                  color: sel ? "#2abfbf" : "rgba(255,255,255,0.5)",
                  fontFamily: "var(--font-serif)",
                }}
              >
                {t === "pendientes" ? "Pendientes" : "Revisadas"}
              </button>
            );
          })}
        </div>

        {error && (
          <div
            className="rounded-2xl px-4 py-3"
            style={{ background: "rgba(255,128,128,0.08)", border: "0.5px solid rgba(255,128,128,0.35)" }}
          >
            <p className="text-xs" style={{ color: "rgba(255,200,200,0.95)", fontFamily: "var(--font-serif)" }}>
              {error}
            </p>
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : alertas.length === 0 ? (
          <div className="rounded-2xl px-6 py-10 text-center" style={GLASS}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-serif)", lineHeight: 1.6 }}>
              {tab === "pendientes" ? "No hay alertas pendientes" : "Sin alertas revisadas todavía"}
            </p>
            {tab === "pendientes" && (
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-serif)", marginTop: 8 }}>
                Pulsa "Analizar todos" para generar nuevos análisis con la IA.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {alertas.map((a) => {
              const meta = NIVEL_META[a.nivel_riesgo];
              const cat = a.categoria ? CATEGORIA_META[a.categoria] ?? { label: a.categoria, icon: "•" } : null;
              return (
                <div key={a.id} className="rounded-2xl px-4 py-4 space-y-3" style={GLASS}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span style={{ fontSize: 14 }}>{meta.emoji}</span>
                      <Link
                        href={`/admin/antifragil/${a.user_id}`}
                        className="truncate"
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: 18,
                          fontWeight: 300,
                          color: "rgba(255,255,255,0.95)",
                          textDecoration: "none",
                        }}
                      >
                        {a.cliente_nombre}
                      </Link>
                    </div>
                    <span
                      className="shrink-0 px-2 py-0.5 rounded text-[9px] tracking-[0.2em] uppercase font-semibold"
                      style={{
                        background: meta.bg,
                        border: `0.5px solid ${meta.border}`,
                        color: meta.color,
                        fontFamily: "var(--font-serif)",
                      }}
                    >
                      {meta.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px]" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-serif)", letterSpacing: "0.04em" }}>
                    {cat && <span>{cat.icon} {cat.label}</span>}
                    {a.acwr != null && <span>ACWR {Number(a.acwr).toFixed(2)}</span>}
                    {a.wellness_score != null && <span>Wellness {a.wellness_score}/25</span>}
                    <span>{formatFecha(a.fecha)}</span>
                  </div>

                  {a.razonamiento_ia && (
                    <div>
                      <p className="text-[9px] tracking-[0.2em] uppercase mb-1" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-serif)" }}>
                        Razonamiento clínico
                      </p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.85)", fontFamily: "var(--font-serif)", lineHeight: 1.5, letterSpacing: "0.02em" }}>
                        {a.razonamiento_ia}
                      </p>
                    </div>
                  )}

                  {a.recomendacion_ia && (
                    <div>
                      <p className="text-[9px] tracking-[0.2em] uppercase mb-1" style={{ color: "rgba(42,191,191,0.7)", fontFamily: "var(--font-serif)" }}>
                        Recomendación
                      </p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.85)", fontFamily: "var(--font-serif)", lineHeight: 1.5, letterSpacing: "0.02em" }}>
                        {a.recomendacion_ia}
                      </p>
                    </div>
                  )}

                  {tab === "pendientes" && (
                    <button
                      type="button"
                      onClick={() => marcarRevisada(a.id)}
                      disabled={marcando === a.id}
                      className="w-full py-2 rounded-xl text-[10px] tracking-[0.18em] uppercase font-semibold active:scale-[0.98] disabled:opacity-60"
                      style={{
                        background: "rgba(42,191,191,0.12)",
                        border: "0.5px solid rgba(42,191,191,0.35)",
                        color: "#2abfbf",
                        fontFamily: "var(--font-serif)",
                      }}
                    >
                      {marcando === a.id ? "Marcando…" : "Marcar revisada"}
                    </button>
                  )}

                  {tab === "revisadas" && a.visto_en && (
                    <p className="text-[10px] text-right" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-serif)" }}>
                      Revisada · {formatFecha(a.visto_en.split("T")[0])}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
