"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const ADMIN_EMAIL = "carlosvf42@gmail.com";
const FONT_UI = "var(--font-ui)";
const FONT_SERIF = "var(--font-serif)";

type Estado = "pendiente" | "revisado" | "resuelto";

type Reporte = {
  id: string;
  user_id: string | null;
  mensaje: string;
  pagina: string | null;
  estado: Estado;
  created_at: string;
  email: string | null;
  full_name: string | null;
};

const ESTADO_META: Record<Estado, { label: string; color: string; bg: string; border: string }> = {
  pendiente: { label: "Pendiente", color: "#ffb040", bg: "rgba(255,176,64,0.10)", border: "rgba(255,176,64,0.40)" },
  revisado:  { label: "Revisado",  color: "#7b8cff", bg: "rgba(123,140,255,0.10)", border: "rgba(123,140,255,0.40)" },
  resuelto:  { label: "Resuelto",  color: "#2abfbf", bg: "rgba(42,191,191,0.10)", border: "rgba(42,191,191,0.40)" },
};

const ESTADO_ORDER: Estado[] = ["pendiente", "revisado", "resuelto"];

function nextEstado(curr: Estado): Estado {
  const i = ESTADO_ORDER.indexOf(curr);
  return ESTADO_ORDER[(i + 1) % ESTADO_ORDER.length];
}

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function formatFecha(s: string): string {
  const d = new Date(s);
  return d.toLocaleString("es-ES", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
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
  fontFamily: FONT_UI,
};

export default function ReportesPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Estado | "all">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
    (async () => {
      const supabase = getSupabase();
      const [reportsRes, usersRes] = await Promise.all([
        supabase
          .from("bug_reports")
          .select("id, user_id, mensaje, pagina, estado, created_at")
          .order("created_at", { ascending: false }),
        fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      ]);
      if (reportsRes.error) {
        setError(reportsRes.error.message);
        setLoading(false);
        return;
      }
      const usersById = new Map<string, { email: string | null; full_name: string | null }>();
      const all = (usersRes.users ?? []) as Array<{ id: string; email: string | null; full_name: string | null }>;
      for (const u of all) usersById.set(u.id, { email: u.email, full_name: u.full_name });
      setReportes(
        ((reportsRes.data ?? []) as any[]).map((r) => ({
          id: r.id,
          user_id: r.user_id,
          mensaje: r.mensaje,
          pagina: r.pagina,
          estado: (r.estado ?? "pendiente") as Estado,
          created_at: r.created_at,
          email: r.user_id ? usersById.get(r.user_id)?.email ?? null : null,
          full_name: r.user_id ? usersById.get(r.user_id)?.full_name ?? null : null,
        }))
      );
      setLoading(false);
    })();
  }, [checking, token]);

  async function cambiarEstado(id: string, current: Estado) {
    const next = nextEstado(current);
    setUpdatingId(id);
    setReportes((prev) => prev.map((r) => (r.id === id ? { ...r, estado: next } : r)));
    const supabase = getSupabase();
    const { error: err } = await supabase.from("bug_reports").update({ estado: next }).eq("id", id);
    setUpdatingId(null);
    if (err) {
      setError(err.message);
      // revertir
      setReportes((prev) => prev.map((r) => (r.id === id ? { ...r, estado: current } : r)));
    }
  }

  if (checking || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080808" }}>
        <div className="w-5 h-5 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const visibles = filter === "all" ? reportes : reportes.filter((r) => r.estado === filter);
  const counts = {
    all: reportes.length,
    pendiente: reportes.filter((r) => r.estado === "pendiente").length,
    revisado: reportes.filter((r) => r.estado === "revisado").length,
    resuelto: reportes.filter((r) => r.estado === "resuelto").length,
  };

  return (
    <div className="min-h-screen" style={{ background: "#080808" }}>
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <Link href="/admin/ajustes" className="shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div>
          <p style={EYEBROW}>Soporte</p>
          <h1 className="mt-0.5" style={{ fontFamily: FONT_SERIF, fontSize: "1.75rem", fontWeight: 400, lineHeight: 1.1, color: "rgba(255,255,255,0.95)" }}>
            Reportes
          </h1>
        </div>
      </div>

      <div className="px-4 pb-16 space-y-4">
        {error && (
          <p className="text-xs text-center" style={{ color: "#ff8080", fontFamily: FONT_UI }}>{error}</p>
        )}

        {/* Filtros */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(
            [
              { key: "all" as const, label: `Todos (${counts.all})`, color: "rgba(255,255,255,0.6)" },
              { key: "pendiente" as const, label: `Pendientes (${counts.pendiente})`, color: ESTADO_META.pendiente.color },
              { key: "revisado" as const, label: `Revisados (${counts.revisado})`, color: ESTADO_META.revisado.color },
              { key: "resuelto" as const, label: `Resueltos (${counts.resuelto})`, color: ESTADO_META.resuelto.color },
            ]
          ).map((opt) => {
            const sel = filter === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setFilter(opt.key)}
                className="shrink-0 px-3 py-1.5 rounded-full text-[10px] tracking-wide"
                style={{
                  background: sel ? "rgba(42,191,191,0.12)" : "rgba(255,255,255,0.04)",
                  border: `0.5px solid ${sel ? "rgba(42,191,191,0.4)" : "rgba(255,255,255,0.08)"}`,
                  color: sel ? "#2abfbf" : opt.color,
                  fontFamily: FONT_UI,
                  whiteSpace: "nowrap",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {visibles.length === 0 ? (
          <div className="rounded-2xl px-5 py-10 text-center" style={GLASS}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: FONT_UI }}>
              {reportes.length === 0 ? "Aún no hay reportes." : "Sin reportes con ese estado."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibles.map((r) => {
              const meta = ESTADO_META[r.estado];
              const nombre = r.full_name?.trim() || r.email || (r.user_id ? r.user_id.slice(0, 8) : "Anónimo");
              return (
                <div key={r.id} className="rounded-2xl px-4 py-4 space-y-2.5" style={GLASS}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm truncate" style={{ color: "rgba(255,255,255,0.95)", fontFamily: FONT_UI, fontWeight: 500 }}>
                        {nombre}
                      </p>
                      {r.full_name && r.email && (
                        <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.4)", fontFamily: FONT_UI }}>
                          {r.email}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => cambiarEstado(r.id, r.estado)}
                      disabled={updatingId === r.id}
                      className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[9px] tracking-[0.2em] uppercase font-semibold disabled:opacity-50 active:scale-[0.97]"
                      style={{
                        background: meta.bg,
                        border: `0.5px solid ${meta.border}`,
                        color: meta.color,
                        fontFamily: FONT_UI,
                        cursor: updatingId === r.id ? "wait" : "pointer",
                      }}
                      aria-label="Cambiar estado"
                    >
                      {updatingId === r.id ? "…" : meta.label}
                    </button>
                  </div>

                  <div
                    className="rounded-lg px-3 py-2.5 text-xs"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "0.5px solid rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.85)",
                      fontFamily: FONT_UI,
                      lineHeight: 1.55,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {r.mensaje}
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    {r.pagina ? (
                      <span
                        className="truncate text-[11px] px-2 py-0.5 rounded"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "0.5px solid rgba(255,255,255,0.08)",
                          color: "rgba(255,255,255,0.55)",
                          fontFamily: "var(--font-mono)",
                          maxWidth: "60%",
                        }}
                      >
                        {r.pagina}
                      </span>
                    ) : <span />}
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: FONT_UI }}>
                      {formatFecha(r.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
