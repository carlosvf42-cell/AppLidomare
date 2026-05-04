import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import GlassCard from "@/components/design/GlassCard";
import Eyebrow from "@/components/design/Eyebrow";
import PrimaryBtn from "@/components/design/PrimaryBtn";
import { IconFlame, IconCheck, IconPlay } from "@/components/design/icons";
import WellnessHomeCard from "@/components/health/WellnessHomeCard";
import MonitorizacionCard from "@/components/health/MonitorizacionCard";
import WorkloadChart from "@/components/health/WorkloadChart";
import RegistroRapidoButton from "@/components/health/RegistroRapidoButton";

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
  const hoyISO = toISODate(hoy);

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
          style={{
            backgroundImage: `url(${HERO_BG})`,
            filter: "saturate(0.85) brightness(0.85)",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.65) 70%, #000 100%)",
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 bottom-0 px-5 pb-6">
          <h1
            className="font-light leading-tight tracking-tight"
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "2rem",
              color: "rgba(255,255,255,0.95)",
            }}
          >
            Lidomare Health App
          </h1>
          <p style={{ fontSize: 9, color: "var(--accent)", letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 4, fontWeight: 500 }}>
            Powered by Antifrágil®
          </p>
        </div>
      </div>

      {/* ── Greeting ── */}
      <div style={{ padding: "20px 20px 8px", textAlign: "left" }}>
        <div style={{
          fontSize: 10,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.45)",
          fontWeight: 500,
        }}>
          Bienvenido de nuevo,{" "}
          <span style={{ color: "var(--accent)" }}>
            {nombreUsuario}
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 pt-2 pb-6 space-y-5">

        {/* ── Calendario semanal ── */}
        <GlassCard variant="heavy" style={{ padding: "16px 16px" }}>
          <Eyebrow style={{ marginBottom: 14 }}>Semana actual</Eyebrow>
          <div className="flex justify-between">
            {semana.map(({ num, iso, done, started, isToday }, i) => (
              <div key={iso} className="flex flex-col items-center gap-1.5">
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 300,
                    background: done
                      ? "var(--accent-20)"
                      : started
                      ? "rgba(42,191,191,0.07)"
                      : "rgba(255,255,255,0.04)",
                    border: done
                      ? "1.5px solid var(--accent-60)"
                      : isToday
                      ? "1.5px solid var(--accent-45)"
                      : "1px solid rgba(255,255,255,0.08)",
                    color: done
                      ? "var(--accent)"
                      : isToday
                      ? "rgba(42,191,191,0.8)"
                      : "var(--muted-3)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {num}
                </div>
                <span style={{ fontSize: 8, color: "var(--subtle)", letterSpacing: "0.05em" }}>
                  {DIAS_LABELS[i]}
                </span>
                <div style={{ height: 10 }}>
                  {done ? <IconCheck /> : null}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* ── Monitorización IA ── */}
        <MonitorizacionCard />

        {/* ── Racha ── */}
        <GlassCard variant="light" style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <IconFlame />
                <Eyebrow>Racha actual</Eyebrow>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: 36,
                    fontWeight: 300,
                    fontFeatureSettings: "'tnum'",
                    color: "var(--fg)",
                    lineHeight: 1,
                  }}
                >
                  {racha}
                </span>
                <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 400 }}>
                  {racha === 1 ? "semana" : "semanas"}
                </span>
              </div>
              <div style={{ fontSize: 11, color: racha > 0 ? "var(--accent)" : "var(--ink-3)", marginTop: 4 }}>
                {racha === 0
                  ? "Entrena esta semana para empezar"
                  : racha >= 4
                  ? "Imparable"
                  : racha >= 2
                  ? "Muy bien, sigue así"
                  : "Buen comienzo"}
              </div>
            </div>
            {/* Ring */}
            <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
              <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: "rotate(-90deg)" }}>
                <circle
                  cx="32" cy="32" r="26"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="5"
                />
                <circle
                  cx="32" cy="32" r="26"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - Math.min(racha / 8, 1))}`}
                  style={{ transition: "stroke-dashoffset 0.6s ease" }}
                />
              </svg>
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
              }}>
                <div
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: 20,
                    fontWeight: 300,
                    fontFeatureSettings: "'tnum'",
                    color: "var(--fg-soft)",
                    lineHeight: 1,
                  }}
                >
                  {racha}
                </div>
                <div style={{ fontSize: 7, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 1 }}>
                  sem
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* ── Carga semanal ── */}
        {user && <WorkloadChart />}

        {/* ── Registro rápido ── */}
        {proximoDia && <RegistroRapidoButton proximoDiaId={proximoDia.id} />}

        {/* ── Wellness de hoy ── */}
        {user && <WellnessHomeCard />}

        {/* ── Próximo entrenamiento ── */}
        {rutina ? (
          proximoDia ? (
            <div>
              <GlassCard variant="lens" style={{ padding: "20px 20px", marginBottom: 12 }}>
                <div style={{ position: "relative", zIndex: 1 }}>
                  <Eyebrow>{rutina.nombre}</Eyebrow>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: "var(--fg-soft)",
                      marginTop: 6,
                    }}
                  >
                    {proximoDia.nombre}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                    {proximoDia.rutina_ejercicios.length} ejercicios
                  </div>
                </div>
              </GlassCard>
              <Link href={`/rutinas/entrenar?dia=${proximoDia.id}`} style={{ textDecoration: "none" }}>
                <PrimaryBtn icon={<IconPlay c="#001a1a" />}>
                  Entrenar ahora
                </PrimaryBtn>
              </Link>
            </div>
          ) : (
            <GlassCard variant="light" style={{ padding: "24px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "var(--accent)" }}>Semana completada</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>Descansa y vuelve la próxima semana</div>
            </GlassCard>
          )
        ) : null}

        {/* Footer */}
        <p className="text-center pt-2" style={{ fontSize: 10, color: "var(--faint)", letterSpacing: "0.1em" }}>
          &copy; {new Date().getFullYear()} Lidomare &middot; Playamar, Torremolinos
        </p>
      </div>
    </div>
  );
}
