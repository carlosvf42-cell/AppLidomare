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
  const day = d.getDay(); // 0=Sun, 1=Mon … 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return mon;
}

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

  // ── Weekly sessions ───────────────────────────────────────────────────────
  type SesionDia = { fecha: string; completada: boolean };
  let sesiones: SesionDia[] = [];

  if (user) {
    const { data } = await supabase
      .from("sesiones")
      .select("fecha, completada")
      .eq("user_id", user.id)
      .gte("fecha", toISODate(lunes))
      .lte("fecha", toISODate(domingo));
    sesiones = (data ?? []) as SesionDia[];
  }

  // Build map: isoDate → "done" | "partial"
  const doneSet  = new Set(sesiones.filter((s) => s.completada).map((s) => s.fecha));
  const startSet = new Set(sesiones.filter((s) => !s.completada).map((s) => s.fecha));
  const hoyISO   = toISODate(hoy);

  // 7 days Mon–Sun
  const semana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    const iso = toISODate(d);
    const done    = doneSet.has(iso);
    const started = startSet.has(iso) && !done;
    const isToday = iso === hoyISO;
    return { num: d.getDate(), iso, done, started, isToday };
  });

  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ height: 280 }}>
        {/* Photo */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${HERO_BG})` }}
          aria-hidden="true"
        />
        {/* Bottom gradient for text legibility */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.9) 100%)" }}
          aria-hidden="true"
        />
        {/* Text overlay — bottom-left */}
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
            {semana.map(({ num, iso, done, started, isToday }) => (
              <div key={iso} className="flex flex-col items-center gap-1.5">
                {/* Circle */}
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
                {/* Day label */}
                <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.05em" }}>
                  {DIAS_LABELS[(semana.findIndex((d) => d.iso === iso))]}
                </span>
                {/* Check mark */}
                <div style={{ height: 10 }}>
                  {done && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l5 5L19 7" stroke="#2abfbf" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <Link
          href="/contenido"
          className="flex items-center justify-center gap-2 w-full py-4 text-sm font-light tracking-widest uppercase transition-all active:scale-[0.98]"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "0.5px solid rgba(255,255,255,0.15)",
            borderRadius: 20,
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.3)",
            color: "#f0f0f0",
          }}
        >
          Acceder a la biblioteca
          <span aria-hidden="true">→</span>
        </Link>

        {/* Footer */}
        <p className="text-center pt-2" style={{ fontSize: 10, color: "rgba(255,255,255,0.12)", letterSpacing: "0.1em" }}>
          © {new Date().getFullYear()} Lidomare · Playamar, Torremolinos
        </p>
      </div>
    </div>
  );
}
