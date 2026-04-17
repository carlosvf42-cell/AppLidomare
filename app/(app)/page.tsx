import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const HERO_BG = "/images/hero-home.jpg";

const DIAS_SEMANA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIAS_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getMondayOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return mon;
}

function calcularRacha(sesiones: { fecha: string; completada: boolean }[]): number {
  let racha = 0;
  const hoy = new Date();

  const getLunesISO = (date: Date): string => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - diff);
    return toISODate(d);
  };

  let weekOffset = 0;
  while (true) {
    const ref = new Date(hoy);
    ref.setDate(ref.getDate() - weekOffset * 7);
    const lunesISO = getLunesISO(ref);
    const lunesDate = new Date(lunesISO);
    const domingoDate = new Date(lunesDate);
    domingoDate.setDate(domingoDate.getDate() + 6);
    const domingoISO = toISODate(domingoDate);

    const tieneEntrenamiento = sesiones.some(
      (s) => s.completada && s.fecha >= lunesISO && s.fecha <= domingoISO
    );

    if (!tieneEntrenamiento) break;
    racha++;
    weekOffset++;
  }

  return racha;
}

type SesionRow = { fecha: string; completada: boolean; dia_id: string | null };
type RutinaEjItem = { id: string; nombre: string; series: number; repeticiones: number; orden: number };
type RutinaDiaItem = { id: string; nombre: string; orden: number; rutina_ejercicios: RutinaEjItem[] };
type RutinaActiva = { id: string; nombre: string; rutina_dias: RutinaDiaItem[] };

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ── Dates ─────────────────────────────────────────────────────────────────
  const hoy     = new Date();
  const lunes   = getMondayOfWeek(hoy);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);

  const fechaTexto =
    `${DIAS_SEMANA[hoy.getDay()].charAt(0).toUpperCase()}${DIAS_SEMANA[hoy.getDay()].slice(1)}, ${hoy.getDate()} de ${MESES[hoy.getMonth()]}`;

  const nombreUsuario =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "Usuario";

  // ── Fetch all sesiones + rutina activa ────────────────────────────────────
  let todasSesiones: SesionRow[] = [];
  let rutina: RutinaActiva | null = null;

  if (user) {
    const [sesRes, rutRes] = await Promise.all([
      supabase
        .from("sesiones")
        .select("fecha, completada, dia_id")
        .eq("user_id", user.id),
      supabase
        .from("rutinas")
        .select("id, nombre, rutina_dias(id, nombre, orden, rutina_ejercicios(id, nombre, series, repeticiones, orden))")
        .eq("user_id", user.id)
        .eq("activa", true)
        .maybeSingle(),
    ]);
    todasSesiones = (sesRes.data ?? []) as SesionRow[];
    rutina = (rutRes.data as RutinaActiva | null) ?? null;
    if (rutina) {
      rutina.rutina_dias.sort((a, b) => a.orden - b.orden);
      rutina.rutina_dias.forEach((d) => d.rutina_ejercicios.sort((a, b) => a.orden - b.orden));
    }
  }

  // ── Weekly filter ─────────────────────────────────────────────────────────
  const lunesISO  = toISODate(lunes);
  const domingoISO = toISODate(domingo);
  const sesionesEstaSemana = todasSesiones.filter(
    (s) => s.fecha >= lunesISO && s.fecha <= domingoISO
  );

  const doneSet  = new Set<string>();
  const startSet = new Set<string>();
  for (const s of sesionesEstaSemana) {
    if (s.completada) doneSet.add(s.fecha);
    else startSet.add(s.fecha);
  }
  const hoyISO   = toISODate(hoy);

  const semana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    const iso = toISODate(d);
    const done    = doneSet.has(iso);
    const started = startSet.has(iso) && !done;
    const isToday = iso === hoyISO;
    return { num: d.getDate(), iso, done, started, isToday };
  });

  // ── Racha ─────────────────────────────────────────────────────────────────
  const racha = calcularRacha(todasSesiones);

  // ── Próximo día ───────────────────────────────────────────────────────────
  const diasConSesion = new Set(sesionesEstaSemana.map((s) => s.dia_id).filter(Boolean) as string[]);
  const proximoDia = rutina?.rutina_dias?.find((dia) => !diasConSesion.has(dia.id)) ?? null;

  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ height: 280 }}>
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${HERO_BG})` }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.9) 100%)" }}
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 bottom-0 px-5 pb-6">
          <h1 className="text-[2rem] font-light leading-tight tracking-tight" style={{ color: "rgba(255,255,255,0.95)" }}>
            Lidomare Health App
          </h1>
          <p style={{ fontSize: 9, color: "#2abfbf", letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 4 }}>
            Powered by Antifrágil®
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 pt-5 pb-6 space-y-5">

        {/* ── Bienvenida ── */}
        <div className="px-1">
          <p style={{ fontSize: 10, color: "#555", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Bienvenido de nuevo
          </p>
          <p className="font-bold leading-tight" style={{ fontSize: 30, color: "#f0f0f0", marginTop: 2 }}>
            {nombreUsuario}
          </p>
          <p style={{ fontSize: 12, color: "#333", marginTop: 4 }}>
            {fechaTexto}
          </p>
        </div>

        {/* ── Calendario semanal ── */}
        <div
          className="rounded-3xl px-4 py-4"
          style={{
            background: "rgba(255,255,255,0.07)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            border: "0.5px solid rgba(255,255,255,0.13)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 4px 24px rgba(0,0,0,0.4)",
          }}
        >
          <p style={{ fontSize: 9, color: "#2abfbf", letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 12 }}>
            Semana actual
          </p>
          <div className="flex justify-between">
            {semana.map(({ num, iso, done, started, isToday }, i) => (
              <div key={iso} className="flex flex-col items-center gap-1.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-light transition-colors"
                  style={{
                    background: done
                      ? "rgba(42,191,191,0.2)"
                      : started
                      ? "rgba(42,191,191,0.07)"
                      : "rgba(255,255,255,0.04)",
                    border: done
                      ? "1.5px solid rgba(42,191,191,0.6)"
                      : isToday
                      ? "1.5px solid rgba(42,191,191,0.45)"
                      : "1px solid rgba(255,255,255,0.08)",
                    color: done
                      ? "#2abfbf"
                      : isToday
                      ? "rgba(42,191,191,0.8)"
                      : "rgba(255,255,255,0.3)",
                  }}
                >
                  {num}
                </div>
                <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.05em" }}>
                  {DIAS_LABELS[i]}
                </span>
                <div style={{ height: 10 }}>
                  {done ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l5 5L19 7" stroke="#2abfbf" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Racha ── */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "0.5px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#555", textTransform: "uppercase" }}>
              Racha actual
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#f0f0f0", marginTop: 4 }}>
              {racha} {racha === 1 ? "semana" : "semanas"}
            </div>
            <div style={{ fontSize: 11, color: racha > 0 ? "#2abfbf" : "#333", marginTop: 2 }}>
              {racha === 0
                ? "Entrena esta semana para empezar"
                : racha >= 4
                ? "Imparable"
                : racha >= 2
                ? "Muy bien, sigue así"
                : "Buen comienzo"}
            </div>
          </div>
          <div
            style={{
              width: 56, height: 56, borderRadius: "50%",
              background: racha > 0 ? "rgba(42,191,191,0.1)" : "rgba(255,255,255,0.03)",
              border: `1.5px solid ${racha > 0 ? "#2abfbf" : "rgba(255,255,255,0.06)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
            }}
          >
            {racha >= 4 ? "🔥" : racha >= 2 ? "⚡" : "○"}
          </div>
        </div>

        {/* ── Próximo entrenamiento ── */}
        {rutina ? (
          proximoDia ? (
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#555", textTransform: "uppercase", marginBottom: 10 }}>
                Próximo entrenamiento
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "0.5px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: "16px 20px",
                  marginBottom: 12,
                }}
              >
                <div style={{ fontSize: 9, color: "#2abfbf", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                  {rutina.nombre}
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#f0f0f0", marginTop: 4 }}>
                  {proximoDia.nombre}
                </div>
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                  {proximoDia.rutina_ejercicios.slice(0, 4).map((ej, i) => (
                    <div key={i} style={{ fontSize: 11, color: "#444", display: "flex", justifyContent: "space-between" }}>
                      <span>{ej.nombre}</span>
                      <span style={{ color: "#2a2a2a" }}>{ej.series}×{ej.repeticiones}</span>
                    </div>
                  ))}
                  {proximoDia.rutina_ejercicios.length > 4 && (
                    <div style={{ fontSize: 10, color: "#2a2a2a", marginTop: 2 }}>
                      +{proximoDia.rutina_ejercicios.length - 4} ejercicios más
                    </div>
                  )}
                </div>
              </div>
              <Link
                href={`/rutinas/entrenar?dia=${proximoDia.id}`}
                style={{
                  display: "block", width: "100%", padding: 16,
                  background: "rgba(255,255,255,0.04)",
                  border: "0.5px solid rgba(255,255,255,0.2)",
                  borderRadius: 6, color: "#f0f0f0", fontSize: 10,
                  letterSpacing: "0.25em", textTransform: "uppercase",
                  textAlign: "center", textDecoration: "none",
                }}
              >
                Entrenar ahora →
              </Link>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 20 }}>
              <div style={{ fontSize: 13, color: "#2abfbf" }}>Semana completada 💪</div>
              <div style={{ fontSize: 11, color: "#333", marginTop: 4 }}>Descansa y vuelve la próxima semana</div>
            </div>
          )
        ) : null}

        {/* Footer */}
        <p className="text-center pt-2" style={{ fontSize: 10, color: "rgba(255,255,255,0.12)", letterSpacing: "0.1em" }}>
          © {new Date().getFullYear()} Lidomare · Playamar, Torremolinos
        </p>
      </div>
    </div>
  );
}
