"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import {
  NIVELES,
  type PlanPreset,
  type EjercicioPreset,
  type Material,
} from "@/lib/rutinas-preestablecidas";

/* ── Supabase client ────────────────────────────────────────── */
function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/* ── Style tokens ───────────────────────────────────────────── */
const LIQUID: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "0.5px solid rgba(255,255,255,0.08)",
};

const PILL_COLORS: Record<Material, { bg: string; color: string; label: string }> = {
  maquina: { bg: "#E1F5EE", color: "#0F6E56", label: "Maquina" },
  polea:   { bg: "#EEEDFE", color: "#534AB7", label: "Polea" },
  libre:   { bg: "#FAEEDA", color: "#854F0B", label: "Peso libre" },
};

/* ── Chevron SVG ────────────────────────────────────────────── */
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

/* ── Group exercises by grupoMuscular for display ───────────── */
function groupByGrupo(ejercicios: EjercicioPreset[]): { grupo: string; items: EjercicioPreset[] }[] {
  const groups: { grupo: string; items: EjercicioPreset[] }[] = [];
  for (const ej of ejercicios) {
    const last = groups[groups.length - 1];
    if (last && last.grupo === ej.grupoMuscular) {
      last.items.push(ej);
    } else {
      groups.push({ grupo: ej.grupoMuscular, items: [ej] });
    }
  }
  return groups;
}

/* ── Exercise row ───────────────────────────────────────────── */
function ExRow({ e }: { e: EjercicioPreset }) {
  const p = PILL_COLORS[e.material];
  const seriesLabel = e.repeticiones === 0 ? `${e.series}` : `${e.series} x ${e.repeticiones}`;
  return (
    <div className="flex items-center gap-2 py-1.5" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.04)" }}>
      <p className="flex-1 min-w-0 text-[13px] font-light truncate" style={{ color: "rgba(255,255,255,0.8)" }}>
        {e.nombre}
      </p>
      <span className="shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded-md" style={{ background: p.bg, color: p.color }}>
        {p.label}
      </span>
      <span className="shrink-0 text-[11px] font-mono tabular-nums w-[44px] text-right" style={{ color: "rgba(255,255,255,0.45)" }}>
        {seriesLabel}
      </span>
    </div>
  );
}

/* ── Plan detail (inline expand) ────────────────────────────── */
function PlanDetail({
  plan,
  onActivar,
  activando,
}: {
  plan: PlanPreset;
  onActivar: (plan: PlanPreset) => void;
  activando: boolean;
}) {
  return (
    <div className="space-y-3 mt-3">
      {plan.nota && (
        <p className="text-[11px] px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.5)" }}>
          {plan.nota}
        </p>
      )}

      {plan.dias.map((dia) => {
        const groups = groupByGrupo(dia.ejercicios);
        return (
          <div key={dia.orden} className="rounded-2xl px-3 py-3" style={{ ...LIQUID }}>
            <div className="flex items-center gap-2 mb-2">
              <h5 className="text-[13px] font-light" style={{ color: "rgba(255,255,255,0.85)" }}>{dia.nombre}</h5>
            </div>
            {groups.map((g, j) => (
              <div key={j} className="mb-2">
                <p className="text-[9px] tracking-[0.12em] uppercase mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {g.grupo}
                </p>
                {g.items.map((e, k) => <ExRow key={k} e={e} />)}
              </div>
            ))}
          </div>
        );
      })}

      <button
        type="button"
        disabled={activando}
        onClick={() => onActivar(plan)}
        className="w-full py-3.5 rounded-xl text-sm font-semibold tracking-widest uppercase transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: "#2abfbf",
          color: "#080808",
          boxShadow: "0 4px 20px rgba(42,191,191,0.35), inset 0 1px 0 rgba(255,255,255,0.25)",
        }}
      >
        {activando ? "Activando..." : "Activar esta rutina"}
      </button>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export default function PreestablecidaCard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nivelIdx, setNivelIdx] = useState(0);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [activando, setActivando] = useState(false);

  const nivel = NIVELES[nivelIdx];

  async function activarRutinaPreestablecida(plan: PlanPreset) {
    setActivando(true);
    try {
      const supabase = getSupabase();
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr) { console.error("Auth error:", userErr); return; }
      if (!user) { console.error("No user session"); router.push("/login"); return; }

      // 1. Deactivate all existing routines for this user
      const { error: deactivateErr } = await supabase
        .from("rutinas")
        .update({ activa: false })
        .eq("user_id", user.id);
      if (deactivateErr) {
        console.error("Error deactivating rutinas:", deactivateErr);
        return;
      }

      // 2. Insert new routine (only user_id, nombre, activa)
      const { data: rutina, error: rutinaErr } = await supabase
        .from("rutinas")
        .insert({ user_id: user.id, nombre: plan.nombre, activa: true })
        .select("id")
        .single();
      if (rutinaErr || !rutina) {
        console.error("Error inserting rutina:", rutinaErr);
        return;
      }
      console.log("Rutina created:", rutina.id);

      // 3. Insert days one by one to get each dia_id in order
      const diaIds: string[] = [];
      for (const dia of plan.dias) {
        const { data: diaData, error: diaErr } = await supabase
          .from("rutina_dias")
          .insert({ rutina_id: rutina.id, nombre: dia.nombre, orden: dia.orden })
          .select("id")
          .single();
        if (diaErr || !diaData) {
          console.error(`Error inserting dia "${dia.nombre}":`, diaErr);
          return;
        }
        diaIds.push(diaData.id);
      }
      console.log("Dias created:", diaIds);

      // 4. Insert exercises for each day
      for (let i = 0; i < plan.dias.length; i++) {
        const dia = plan.dias[i];
        const diaId = diaIds[i];

        const ejerciciosRows = dia.ejercicios.map((ej, orden) => ({
          dia_id: diaId,
          nombre: ej.nombre,
          series: ej.series,
          repeticiones: ej.repeticiones || 1,
          orden,
        }));

        if (ejerciciosRows.length > 0) {
          const { error: ejErr } = await supabase
            .from("rutina_ejercicios")
            .insert(ejerciciosRows);
          if (ejErr) {
            console.error(`Error inserting ejercicios for dia "${dia.nombre}":`, ejErr);
            return;
          }
        }
      }
      console.log("Ejercicios inserted for all dias");

      // 5. Collapse and refresh
      setOpen(false);
      setExpandedPlan(null);
      router.refresh();
    } catch (err) {
      console.error("Unexpected error in activarRutinaPreestablecida:", err);
    } finally {
      setActivando(false);
    }
  }

  return (
    <section>
      {/* ── Collapsed header ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-3xl px-4 py-4 flex items-center gap-3 transition-all active:scale-[0.99]"
        style={LIQUID}
      >
        <div className="flex-1 text-left">
          <p className="text-[9px] tracking-[0.2em] uppercase mb-0.5" style={{ color: "#2abfbf" }}>
            Plantillas
          </p>
          <p className="text-sm font-light" style={{ color: "rgba(255,255,255,0.85)" }}>
            Rutinas preestablecidas
          </p>
        </div>
        <Chevron open={open} />
      </button>

      {/* ── Expanded body ── */}
      {open && (
        <div className="mt-3 rounded-3xl px-4 py-4 space-y-4" style={LIQUID}>
          {/* Level tabs */}
          <div className="flex gap-2">
            {NIVELES.map((n, i) => {
              const active = nivelIdx === i;
              return (
                <button
                  key={n.key}
                  type="button"
                  onClick={() => { setNivelIdx(i); setExpandedPlan(null); }}
                  aria-selected={active}
                  className="flex-1 py-2 rounded-xl text-[10px] font-medium tracking-[0.12em] uppercase transition-all active:scale-[0.97]"
                  style={{
                    background: active ? `${n.color}18` : "rgba(255,255,255,0.03)",
                    border: `0.5px solid ${active ? `${n.color}40` : "rgba(255,255,255,0.06)"}`,
                    color: active ? n.color : "rgba(255,255,255,0.3)",
                  }}
                >
                  {n.label}
                </button>
              );
            })}
          </div>

          {/* Plan cards — horizontal scroll */}
          <div
            className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1"
            style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
          >
            {nivel.planes.map((plan) => {
              const isExpanded = expandedPlan === plan.id;
              return (
                <div
                  key={plan.id}
                  className="shrink-0 rounded-2xl px-4 py-3.5"
                  style={{
                    ...LIQUID,
                    scrollSnapAlign: "start",
                    width: nivel.planes.length === 1 ? "100%" : "calc(100% - 32px)",
                    minWidth: 260,
                  }}
                >
                  {/* Plan header */}
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-[13px] font-light" style={{ color: "rgba(255,255,255,0.9)" }}>
                      {plan.nombre}
                    </h4>
                    <span
                      className="text-[8px] font-medium px-1.5 py-0.5 rounded-full tracking-wider"
                      style={{ background: `${nivel.color}18`, color: nivel.color, border: `0.5px solid ${nivel.color}30` }}
                    >
                      {plan.badge}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-3 mb-3">
                    {[
                      { label: "Dias/sem", value: String(plan.dias_semana) },
                      { label: "Duracion", value: plan.duracion },
                    ].map((s) => (
                      <div key={s.label}>
                        <p className="text-[8px] tracking-[0.12em] uppercase" style={{ color: "rgba(255,255,255,0.25)" }}>{s.label}</p>
                        <p className="text-[12px] font-light" style={{ color: "rgba(255,255,255,0.6)" }}>{s.value}</p>
                      </div>
                    ))}
                    <div>
                      <p className="text-[8px] tracking-[0.12em] uppercase" style={{ color: "rgba(255,255,255,0.25)" }}>Intensidad</p>
                      <p className="text-[12px] font-light" style={{ color: "rgba(255,255,255,0.6)" }}>{plan.intensidad}</p>
                    </div>
                  </div>

                  {/* Toggle plan detail */}
                  <button
                    type="button"
                    onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                    className="w-full py-2 rounded-xl text-[10px] font-medium tracking-[0.15em] uppercase transition-all active:scale-[0.97]"
                    style={{
                      background: isExpanded ? "rgba(255,255,255,0.06)" : "rgba(42,191,191,0.1)",
                      border: `0.5px solid ${isExpanded ? "rgba(255,255,255,0.1)" : "rgba(42,191,191,0.25)"}`,
                      color: isExpanded ? "rgba(255,255,255,0.5)" : "#2abfbf",
                    }}
                  >
                    {isExpanded ? "Ocultar plan" : "Ver plan"}
                  </button>

                  {/* Expanded plan detail */}
                  {isExpanded && (
                    <PlanDetail
                      plan={plan}
                      onActivar={activarRutinaPreestablecida}
                      activando={activando}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
