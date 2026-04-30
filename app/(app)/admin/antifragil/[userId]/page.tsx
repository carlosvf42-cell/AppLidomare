"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import WorkloadChart from "@/components/health/WorkloadChart";
import WellnessChart from "@/components/WellnessChart";

const ADMIN_EMAIL = "carlosvf42@gmail.com";

type ClienteData = {
  user: {
    id: string;
    email: string;
    full_name: string | null;
    is_antifragil: boolean;
    peso_kg: number | null;
    altura_cm: number | null;
    fecha_nacimiento: string | null;
    sexo: string | null;
  };
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
  fontFamily: "var(--font-serif)",
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

function DatoPersonal({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] tracking-[0.18em] uppercase mb-0.5" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-serif)" }}>
        {label}
      </p>
      <p className="text-sm" style={{ color: "rgba(255,255,255,0.9)", fontFamily: "var(--font-serif)", letterSpacing: "0.02em" }}>
        {value}
      </p>
    </div>
  );
}

function capital(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatNacimiento(s: string): string {
  const d = new Date(s + "T12:00:00");
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      style={{ transition: "transform 0.3s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      <path d="M6 9l6 6 6-6" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
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
  const [duplicandoId, setDuplicandoId] = useState<string | null>(null);
  const [borrandoId, setBorrandoId] = useState<string | null>(null);
  const [iniciandoVacio, setIniciandoVacio] = useState(false);
  const [analizando, setAnalizando] = useState(false);
  const [analisis, setAnalisis] = useState<{
    nivel_riesgo: string;
    mensaje_usuario: string | null;
    razonamiento: string | null;
    recomendacion: string | null;
    categoria: string | null;
  } | null>(null);

  async function analizarAhora() {
    if (!token || !userId) return;
    setAnalizando(true);
    setError(null);
    setAnalisis(null);
    try {
      const supabase = getSupabase();
      const { data, error: fnErr } = await supabase.functions.invoke("analizar-usuario", {
        body: { user_id: userId },
      });
      if (fnErr) {
        setError(fnErr.message ?? "No se pudo ejecutar el análisis");
      } else if ((data as any)?.error) {
        setError((data as any).error);
      } else {
        setAnalisis(data as any);
      }
    } catch (e: any) {
      setError(e?.message ?? "Error de red al analizar");
    } finally {
      setAnalizando(false);
    }
  }
  const [siguientesOpen, setSiguientesOpen] = useState(true);
  const [historialOpen, setHistorialOpen] = useState(false);
  const [rutinaActiva, setRutinaActiva] = useState<{ id: string; nombre: string } | null>(null);
  const [rutinaLoading, setRutinaLoading] = useState(true);

  async function iniciarEntrenoVacio() {
    if (!token || !userId) return;
    setIniciandoVacio(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/antifragil/${userId}/entrenos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre: null, estado: "programado", bloques: [] }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error ?? `No se pudo iniciar el entreno (HTTP ${res.status})`);
        setIniciandoVacio(false);
        return;
      }
      router.push(`/admin/antifragil/${userId}/entreno/${j.id}/live`);
    } catch (err: any) {
      setError(err?.message ?? "Error de red al iniciar el entreno");
      setIniciandoVacio(false);
    }
  }

  async function borrarEntreno(entrenoId: string) {
    if (!token || !userId) return;
    if (!confirm("¿Borrar este entreno? Esta acción no se puede deshacer.")) return;
    setBorrandoId(entrenoId);
    setError(null);
    const res = await fetch(`/api/admin/antifragil/${userId}/entrenos/${entrenoId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setBorrandoId(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "No se pudo borrar el entreno");
      return;
    }
    const refreshed = await fetch(`/api/admin/antifragil/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());
    if (refreshed.error) setError(refreshed.error);
    else setData(refreshed as ClienteData);
  }

  async function duplicar(entrenoId: string) {
    if (!token || !userId) return;
    setDuplicandoId(entrenoId);
    const res = await fetch(`/api/admin/antifragil/${userId}/entrenos/${entrenoId}/duplicar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    setDuplicandoId(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "No se pudo duplicar");
      return;
    }
    const refreshed = await fetch(`/api/admin/antifragil/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());
    if (refreshed.error) setError(refreshed.error);
    else setData(refreshed as ClienteData);
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

  useEffect(() => {
    if (checking || !userId) return;
    setRutinaLoading(true);
    const supabase = getSupabase();
    supabase
      .from("rutinas")
      .select("id, nombre")
      .eq("user_id", userId)
      .eq("activa", true)
      .maybeSingle()
      .then(({ data }) => {
        setRutinaActiva(data ? { id: data.id, nombre: data.nombre } : null);
        setRutinaLoading(false);
      });
  }, [checking, userId]);

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
          <h1 className="text-lg font-light" style={{ color: "rgba(255,255,255,0.9)", fontFamily: "var(--font-serif)" }}>Cliente</h1>
        </div>
        <p className="text-xs text-center py-8" style={{ color: "#ff8080", fontFamily: "var(--font-serif)" }}>{error ?? "No se pudo cargar"}</p>
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
              style={{ fontFamily: "var(--font-serif)", fontSize: "1.9rem", fontWeight: 500, lineHeight: 1.1, letterSpacing: "-0.005em", color: "rgba(255,255,255,0.95)" }}
            >
              {nombre}
            </h1>
            <span
              className="shrink-0 text-[9px] tracking-[0.2em] uppercase font-semibold px-2 py-0.5 rounded"
              style={{
                background: "rgba(42,191,191,0.12)",
                border: "0.5px solid rgba(42,191,191,0.4)",
                color: "#2abfbf",
                fontFamily: "var(--font-serif)",
              }}
            >
              Antifrágil
            </span>
          </div>
          <p className="truncate mt-1" style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-serif)" }}>
            {data.user.email}
          </p>
        </div>
      </div>

      <div className="px-4 pb-16 space-y-6">
        {/* Datos personales */}
        {(data.user.peso_kg != null || data.user.altura_cm != null || data.user.fecha_nacimiento || data.user.sexo) && (
          <section>
            <p className="mb-3 px-1" style={EYEBROW}>Datos personales</p>
            <div className="rounded-2xl px-4 py-3 grid grid-cols-2 gap-x-3 gap-y-3" style={GLASS}>
              {data.user.peso_kg != null && (
                <DatoPersonal label="Peso" value={`${data.user.peso_kg} kg`} />
              )}
              {data.user.altura_cm != null && (
                <DatoPersonal label="Altura" value={`${data.user.altura_cm} cm`} />
              )}
              {data.user.fecha_nacimiento && (
                <DatoPersonal label="Nacimiento" value={formatNacimiento(data.user.fecha_nacimiento)} />
              )}
              {data.user.sexo && (
                <DatoPersonal label="Sexo" value={capital(data.user.sexo)} />
              )}
            </div>
          </section>
        )}

        {/* Carga de entrenamiento */}
        <section>
          <p className="mb-3 px-1" style={EYEBROW}>Carga de entrenamiento</p>
          <WorkloadChart userId={data.user.id} />
        </section>

        {/* Wellness */}
        <section>
          <p className="mb-3 px-1" style={EYEBROW}>Wellness</p>
          <WellnessChart userId={data.user.id} />
        </section>

        {/* Rutina de usuario */}
        <section>
          <p className="mb-3 px-1" style={EYEBROW}>Rutina de usuario</p>
          {rutinaLoading ? (
            <div className="rounded-2xl px-6 py-8 flex items-center justify-center" style={GLASS}>
              <div className="w-4 h-4 border border-[#2abfbf] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : rutinaActiva ? (
            <div className="rounded-2xl px-5 py-5 space-y-3" style={GLASS}>
              <div>
                <p className="text-[10px] tracking-[0.18em] uppercase mb-1" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-serif)" }}>
                  Rutina activa
                </p>
                <p
                  className="truncate"
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 20,
                    fontWeight: 300,
                    color: "rgba(255,255,255,0.95)",
                    letterSpacing: "0.01em",
                  }}
                >
                  {rutinaActiva.nombre}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/antifragil/${data.user.id}/rutina/${rutinaActiva.id}`}
                  className="flex-1 text-center py-2.5 rounded-xl text-[10px] font-semibold tracking-widest uppercase active:scale-[0.98]"
                  style={{
                    background: "rgba(42,191,191,0.12)",
                    border: "0.5px solid rgba(42,191,191,0.35)",
                    color: "#2abfbf",
                    fontFamily: "var(--font-serif)",
                    textDecoration: "none",
                  }}
                >
                  Ver / editar rutina
                </Link>
                <Link
                  href={`/admin/antifragil/${data.user.id}/rutina/nueva`}
                  className="flex-1 text-center py-2.5 rounded-xl text-[10px] font-semibold tracking-widest uppercase active:scale-[0.98]"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "0.5px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.85)",
                    fontFamily: "var(--font-serif)",
                    textDecoration: "none",
                  }}
                >
                  Nueva rutina
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl px-5 py-6 text-center space-y-3" style={GLASS}>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-serif)", lineHeight: 1.5 }}>
                Este cliente no tiene rutina asignada
              </p>
              <Link
                href={`/admin/antifragil/${data.user.id}/rutina/nueva`}
                className="inline-block px-5 py-2.5 rounded-xl text-[10px] font-semibold tracking-widest uppercase active:scale-[0.98]"
                style={{
                  background: "rgba(42,191,191,0.12)",
                  border: "0.5px solid rgba(42,191,191,0.35)",
                  color: "#2abfbf",
                  fontFamily: "var(--font-serif)",
                  textDecoration: "none",
                }}
              >
                Crear rutina
              </Link>
            </div>
          )}
        </section>

        {/* CTA: Entrenar ahora — crea entreno vacío y entra DIRECTAMENTE en modo en vivo */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={iniciarEntrenoVacio}
            disabled={iniciandoVacio}
            className="w-full py-4 rounded-2xl text-sm font-semibold tracking-widest uppercase transition-all active:scale-[0.98] text-center disabled:opacity-60"
            style={{
              background: "#2abfbf",
              color: "#000",
              fontFamily: "var(--font-serif)",
              boxShadow: "0 4px 24px rgba(42,191,191,0.4), inset 0 1px 0 rgba(255,255,255,0.25)",
              border: "none",
              cursor: iniciandoVacio ? "wait" : "pointer",
            }}
          >
            {iniciandoVacio ? "Iniciando…" : "Entrenar ahora"}
          </button>
          <Link
            href={`/admin/antifragil/${data.user.id}/entreno/nuevo`}
            className="block w-full py-2.5 rounded-xl text-[10px] font-semibold tracking-widest uppercase transition-all text-center"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.6)",
              fontFamily: "var(--font-serif)",
              textDecoration: "none",
            }}
          >
            Programar nuevo entreno
          </Link>
        </div>

        {/* Analizar ahora — IA */}
        <section>
          <p className="mb-3 px-1" style={EYEBROW}>Análisis IA</p>
          <button
            type="button"
            onClick={analizarAhora}
            disabled={analizando}
            className="w-full py-3 rounded-2xl text-xs font-semibold tracking-widest uppercase active:scale-[0.98] disabled:opacity-60"
            style={{
              background: "rgba(42,191,191,0.08)",
              border: "0.5px dashed rgba(42,191,191,0.4)",
              color: "#2abfbf",
              fontFamily: "var(--font-serif)",
            }}
          >
            {analizando ? "Analizando…" : "Analizar ahora"}
          </button>

          {analisis && (() => {
            const NIVEL: Record<string, { label: string; color: string; bg: string; border: string; emoji: string }> = {
              verde: { label: "Sin riesgo", color: "#2abfbf", bg: "rgba(42,191,191,0.10)", border: "rgba(42,191,191,0.4)", emoji: "🟢" },
              amarillo: { label: "Precaución", color: "#EF9F27", bg: "rgba(239,159,39,0.10)", border: "rgba(239,159,39,0.4)", emoji: "🟡" },
              rojo: { label: "Alerta", color: "#E24B4A", bg: "rgba(226,75,74,0.10)", border: "rgba(226,75,74,0.4)", emoji: "🔴" },
            };
            const m = NIVEL[analisis.nivel_riesgo] ?? NIVEL.verde;
            return (
              <div className="mt-3 rounded-2xl px-4 py-4 space-y-3" style={GLASS}>
                <div className="flex items-center justify-between gap-2">
                  <span style={{ fontSize: 16 }}>{m.emoji}</span>
                  <span
                    className="px-2 py-0.5 rounded text-[9px] tracking-[0.2em] uppercase font-semibold"
                    style={{ background: m.bg, border: `0.5px solid ${m.border}`, color: m.color, fontFamily: "var(--font-serif)" }}
                  >
                    {m.label}
                  </span>
                </div>
                {analisis.razonamiento && (
                  <div>
                    <p className="text-[9px] tracking-[0.2em] uppercase mb-1" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-serif)" }}>
                      Razonamiento
                    </p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.85)", fontFamily: "var(--font-serif)", lineHeight: 1.5, letterSpacing: "0.02em" }}>
                      {analisis.razonamiento}
                    </p>
                  </div>
                )}
                {analisis.recomendacion && (
                  <div>
                    <p className="text-[9px] tracking-[0.2em] uppercase mb-1" style={{ color: "rgba(42,191,191,0.7)", fontFamily: "var(--font-serif)" }}>
                      Recomendación
                    </p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.85)", fontFamily: "var(--font-serif)", lineHeight: 1.5, letterSpacing: "0.02em" }}>
                      {analisis.recomendacion}
                    </p>
                  </div>
                )}
                {analisis.mensaje_usuario && (
                  <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(42,191,191,0.06)", border: "0.5px solid rgba(42,191,191,0.25)" }}>
                    <p className="text-[9px] tracking-[0.2em] uppercase mb-1" style={{ color: "rgba(42,191,191,0.7)", fontFamily: "var(--font-serif)" }}>
                      Mensaje al usuario
                    </p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.95)", fontFamily: "var(--font-serif)", lineHeight: 1.5, letterSpacing: "0.02em" }}>
                      {analisis.mensaje_usuario}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </section>

        {/* Siguientes entrenos */}
        <section>
          <button
            type="button"
            onClick={() => setSiguientesOpen((v) => !v)}
            className="w-full rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all active:scale-[0.99]"
            style={GLASS}
          >
            <div className="flex-1 text-left">
              <p style={EYEBROW}>Siguientes entrenos</p>
            </div>
            <span className="text-[10px] font-mono tabular-nums mr-1" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-serif)" }}>
              {data.entrenos.length}
            </span>
            <Chevron open={siguientesOpen} />
          </button>

          {siguientesOpen && (data.entrenos.length === 0 ? (
            <div className="mt-3 rounded-2xl px-5 py-8 text-center" style={GLASS}>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-serif)", lineHeight: 1.5 }}>
                Sin entrenos programados
              </p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-serif)", marginTop: 6, letterSpacing: "0.02em" }}>
                Programa el próximo entreno desde "Entrenar ahora"
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
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
                            fontFamily: "var(--font-serif)",
                          }}
                        >
                          <TipoIcon tipo={e.tipo} color={meta.color} />
                          {meta.label}
                        </span>
                      </div>
                      <p
                        className="truncate"
                        style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", fontFamily: "var(--font-serif)", letterSpacing: "0.02em" }}
                      >
                        {e.nombre || "Sin nombre"}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => duplicar(e.id)}
                        disabled={duplicandoId === e.id}
                        aria-label="Duplicar entreno"
                        className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-[0.96] disabled:opacity-40"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "0.5px solid rgba(255,255,255,0.12)",
                          color: "rgba(255,255,255,0.6)",
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                          <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
                          <path d="M5 15V6a2 2 0 012-2h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                      </button>
                      <Link
                        href={`/admin/antifragil/${data.user.id}/entreno/${e.id}`}
                        aria-label="Editar entreno"
                        className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-[0.96]"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "0.5px solid rgba(255,255,255,0.12)",
                          color: "rgba(255,255,255,0.6)",
                          textDecoration: "none",
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                          <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Link>
                      <button
                        type="button"
                        onClick={() => borrarEntreno(e.id)}
                        disabled={borrandoId === e.id}
                        aria-label="Borrar entreno"
                        className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-[0.96] disabled:opacity-40"
                        style={{
                          background: "rgba(255,128,128,0.06)",
                          border: "0.5px solid rgba(255,128,128,0.2)",
                          color: "rgba(255,128,128,0.75)",
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                          <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <Link
                        href={`/admin/antifragil/${data.user.id}/entreno/${e.id}/live`}
                        className="ml-1 px-3.5 py-2 rounded-xl text-[10px] font-semibold tracking-widest uppercase transition-colors active:scale-[0.98]"
                        style={{
                          background: "rgba(42,191,191,0.12)",
                          border: "0.5px solid rgba(42,191,191,0.35)",
                          color: "#2abfbf",
                          fontFamily: "var(--font-serif)",
                          textDecoration: "none",
                        }}
                      >
                        Iniciar
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </section>

        {/* Historial */}
        <section>
          <button
            type="button"
            onClick={() => setHistorialOpen((v) => !v)}
            className="w-full rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all active:scale-[0.99]"
            style={GLASS}
          >
            <div className="flex-1 text-left">
              <p style={EYEBROW}>Historial</p>
            </div>
            <span className="text-[10px] font-mono tabular-nums mr-1" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-serif)" }}>
              {data.sesiones.length}
            </span>
            <Chevron open={historialOpen} />
          </button>

          {historialOpen && (data.sesiones.length === 0 ? (
            <div className="mt-3 rounded-2xl px-5 py-8 text-center" style={GLASS}>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-serif)", lineHeight: 1.5 }}>
                Sin sesiones completadas todavía
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
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
                          fontFamily: "var(--font-serif)",
                        }}
                      >
                        <TipoIcon tipo={tipo} color={meta.color} />
                        {meta.label || "—"}
                      </span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-serif)", letterSpacing: "0.02em" }}>
                        {formatFecha(s.fecha)}
                      </span>
                    </div>
                    <p className="truncate mb-1" style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "var(--font-serif)", letterSpacing: "0.02em" }}>
                      {nombreEntreno}
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3" style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-serif)", letterSpacing: "0.02em" }}>
                        {s.duracion_minutos != null && (
                          <span>{s.duracion_minutos} min</span>
                        )}
                        {s.rpe != null && (
                          <span>RPE {s.rpe}/10</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => duplicar(s.entreno_id)}
                        disabled={duplicandoId === s.entreno_id}
                        className="text-[10px] font-semibold tracking-widest uppercase active:scale-[0.97] disabled:opacity-40 px-3 py-1.5 rounded-lg"
                        style={{
                          background: "rgba(42,191,191,0.08)",
                          border: "0.5px solid rgba(42,191,191,0.25)",
                          color: "#2abfbf",
                          fontFamily: "var(--font-serif)",
                        }}
                      >
                        {duplicandoId === s.entreno_id ? "Duplicando…" : "Repetir"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
