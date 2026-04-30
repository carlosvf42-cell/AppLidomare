"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import EjercicioSelector from "@/components/EjercicioSelector";

export type EjercicioForm = {
  id?: string;
  nombre: string;
  ejercicio_id: string | null;
  series: string;
  repeticiones: string;
};

export type DiaForm = {
  id?: string;
  nombre: string;
  ejercicios: EjercicioForm[];
  tieneSesiones?: boolean;
};

export const EJ_VACIO = (): EjercicioForm => ({ nombre: "", ejercicio_id: null, series: "3", repeticiones: "10" });
export const DIA_VACIO = (): DiaForm => ({ nombre: "", ejercicios: [EJ_VACIO()] });

const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.07)",
  backdropFilter: "blur(24px) saturate(180%)",
  WebkitBackdropFilter: "blur(24px) saturate(180%)",
  border: "0.5px solid rgba(255,255,255,0.13)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 4px 24px rgba(0,0,0,0.4)",
};

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface Props {
  /** User_id que será el dueño de la rutina (cliente o el propio usuario). */
  targetUserId: string;
  /** "new" → crea una rutina nueva (desactiva las anteriores).
   *  "edit" → actualiza initial.id en su sitio. */
  mode: "new" | "edit";
  /** Solo en modo edit: estado inicial cargado de BD. */
  initial?: { id: string; nombre: string; dias: DiaForm[] };
  /** Cabecera personalizada (back arrow + título + breadcrumb). */
  header: React.ReactNode;
  /** A dónde navegar tras guardar. Recibe el id de la rutina. */
  redirectAfterSave: (rutinaId: string) => string;
}

export default function RutinaForm({ targetUserId, mode, initial, header, redirectAfterSave }: Props) {
  const router = useRouter();
  const [nombre, setNombre] = useState<string>(initial?.nombre ?? "");
  const [dias, setDias] = useState<DiaForm[]>(initial?.dias ?? [DIA_VACIO()]);
  const [deletedDiaIds, setDeletedDiaIds] = useState<string[]>([]);
  const [deletedEjIds, setDeletedEjIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── Día helpers ───────────────────────────────────────────────────────────
  function addDia() {
    setDias((prev) => [...prev, DIA_VACIO()]);
  }
  function removeDia(idx: number) {
    const dia = dias[idx];
    if (dia.tieneSesiones) return;
    if (dia.id) setDeletedDiaIds((prev) => [...prev, dia.id!]);
    setDias((prev) => prev.filter((_, i) => i !== idx));
  }
  function updateDiaNombre(idx: number, value: string) {
    setDias((prev) => prev.map((d, i) => (i === idx ? { ...d, nombre: value } : d)));
  }

  // ── Ejercicio helpers ────────────────────────────────────────────────────
  function addEjercicio(diaIdx: number) {
    setDias((prev) =>
      prev.map((d, i) => (i === diaIdx ? { ...d, ejercicios: [...d.ejercicios, EJ_VACIO()] } : d))
    );
  }
  function removeEjercicio(diaIdx: number, ejIdx: number) {
    const ej = dias[diaIdx].ejercicios[ejIdx];
    if (ej.id) setDeletedEjIds((prev) => [...prev, ej.id!]);
    setDias((prev) =>
      prev.map((d, i) =>
        i === diaIdx ? { ...d, ejercicios: d.ejercicios.filter((_, j) => j !== ejIdx) } : d
      )
    );
  }
  function updateEjercicio<K extends keyof EjercicioForm>(
    diaIdx: number,
    ejIdx: number,
    key: K,
    value: EjercicioForm[K]
  ) {
    setDias((prev) =>
      prev.map((d, i) =>
        i === diaIdx
          ? { ...d, ejercicios: d.ejercicios.map((e, j) => (j === ejIdx ? { ...e, [key]: value } : e)) }
          : d
      )
    );
  }
  function updateSelector(diaIdx: number, ejIdx: number, n: string, id: string | null) {
    setDias((prev) =>
      prev.map((d, i) =>
        i === diaIdx
          ? {
              ...d,
              ejercicios: d.ejercicios.map((e, j) => (j === ejIdx ? { ...e, nombre: n, ejercicio_id: id } : e)),
            }
          : d
      )
    );
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  function handleSave(e?: React.FormEvent) {
    e?.preventDefault();
    if (!nombre.trim()) {
      setError("Añade un nombre a la rutina.");
      return;
    }
    if (dias.some((d) => !d.nombre.trim())) {
      setError("Todos los días necesitan nombre.");
      return;
    }
    if (dias.some((d) => d.ejercicios.some((ej) => !ej.nombre.trim()))) {
      setError("Todos los ejercicios deben tener nombre.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const supabase = getSupabase();

      if (mode === "new") {
        // Desactiva otras rutinas del targetUserId
        await supabase.from("rutinas").update({ activa: false }).eq("user_id", targetUserId);

        const { data: rutina, error: rErr } = await supabase
          .from("rutinas")
          .insert({ nombre: nombre.trim(), user_id: targetUserId, activa: true })
          .select("id")
          .single();
        if (rErr || !rutina) {
          setError(`No se pudo guardar la rutina. ${rErr?.message ?? ""}`);
          return;
        }

        const rutinaId = (rutina as { id: string }).id;
        const diasRows = dias.map((d, orden) => ({
          rutina_id: rutinaId,
          nombre: d.nombre.trim(),
          orden,
        }));
        const { data: diasData, error: dErr } = await supabase
          .from("rutina_dias")
          .insert(diasRows)
          .select("id");
        if (dErr || !diasData) {
          setError(`Error guardando los días. ${dErr?.message ?? ""}`);
          return;
        }

        const ejRows = dias.flatMap((d, di) =>
          d.ejercicios.map((ej, eOrden) => ({
            dia_id: (diasData[di] as { id: string }).id,
            nombre: ej.nombre.trim(),
            series: Number(ej.series) || 1,
            repeticiones: Number(ej.repeticiones) || 1,
            orden: eOrden,
            ...(ej.ejercicio_id ? { ejercicio_id: ej.ejercicio_id } : {}),
          }))
        );
        if (ejRows.length > 0) {
          const { error: eErr } = await supabase.from("rutina_ejercicios").insert(ejRows);
          if (eErr) {
            setError(`Días creados, error en ejercicios. ${eErr.message}`);
            return;
          }
        }

        router.push(redirectAfterSave(rutinaId));
        router.refresh();
        return;
      }

      // ── EDIT mode ──
      if (!initial) return;
      const rutinaId = initial.id;

      await supabase.from("rutinas").update({ nombre: nombre.trim() }).eq("id", rutinaId);

      if (deletedEjIds.length > 0) {
        await supabase.from("rutina_ejercicios").delete().in("id", deletedEjIds);
      }
      if (deletedDiaIds.length > 0) {
        await supabase.from("rutina_ejercicios").delete().in("dia_id", deletedDiaIds);
        await supabase.from("rutina_dias").delete().in("id", deletedDiaIds);
      }

      for (let orden = 0; orden < dias.length; orden++) {
        const dia = dias[orden];
        if (dia.id) {
          await supabase
            .from("rutina_dias")
            .update({ nombre: dia.nombre.trim(), orden })
            .eq("id", dia.id);

          for (let ord = 0; ord < dia.ejercicios.length; ord++) {
            const ej = dia.ejercicios[ord];
            if (ej.id) {
              await supabase
                .from("rutina_ejercicios")
                .update({
                  nombre: ej.nombre.trim(),
                  series: Number(ej.series) || 1,
                  repeticiones: Number(ej.repeticiones) || 1,
                  orden: ord,
                  ...(ej.ejercicio_id ? { ejercicio_id: ej.ejercicio_id } : {}),
                })
                .eq("id", ej.id);
            } else {
              await supabase.from("rutina_ejercicios").insert({
                dia_id: dia.id,
                nombre: ej.nombre.trim(),
                series: Number(ej.series) || 1,
                repeticiones: Number(ej.repeticiones) || 1,
                orden: ord,
                ...(ej.ejercicio_id ? { ejercicio_id: ej.ejercicio_id } : {}),
              });
            }
          }
        } else {
          const { data: newDia } = await supabase
            .from("rutina_dias")
            .insert({ rutina_id: rutinaId, nombre: dia.nombre.trim(), orden })
            .select("id")
            .single();
          if (newDia) {
            const ejRows = dia.ejercicios.map((ej, eOrden) => ({
              dia_id: (newDia as { id: string }).id,
              nombre: ej.nombre.trim(),
              series: Number(ej.series) || 1,
              repeticiones: Number(ej.repeticiones) || 1,
              orden: eOrden,
              ...(ej.ejercicio_id ? { ejercicio_id: ej.ejercicio_id } : {}),
            }));
            if (ejRows.length > 0) await supabase.from("rutina_ejercicios").insert(ejRows);
          }
        }
      }

      router.push(redirectAfterSave(rutinaId));
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen" style={{ background: "#080808" }}>
      {header}

      <form onSubmit={handleSave} className="px-4 pb-10 space-y-5">
        {/* Nombre */}
        <div className="rounded-2xl px-4 py-4" style={GLASS}>
          <label
            className="block text-[10px] tracking-[0.2em] uppercase mb-2"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            Nombre de la rutina
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Push Pull Legs, Full Body…"
            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "0.5px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.92)",
            }}
          />
        </div>

        {/* Días */}
        <div>
          <div className="mb-3 px-1">
            <p
              className="text-[10px] tracking-[0.2em] uppercase"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Días ({dias.length})
            </p>
          </div>

          <div className="space-y-4">
            {dias.map((dia, diaIdx) => (
              <div key={diaIdx} className="rounded-2xl px-4 py-4 space-y-3" style={GLASS}>
                {/* Día header */}
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-mono shrink-0"
                    style={{ color: "rgba(255,255,255,0.2)" }}
                  >
                    {String(diaIdx + 1).padStart(2, "0")}
                  </span>
                  <input
                    type="text"
                    value={dia.nombre}
                    onChange={(e) => updateDiaNombre(diaIdx, e.target.value)}
                    placeholder="Push, Pull, Legs, Full Body…"
                    className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "0.5px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.92)",
                    }}
                  />
                  {dias.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDia(diaIdx)}
                      disabled={dia.tieneSesiones}
                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl transition-all disabled:opacity-25"
                      style={{
                        background: "rgba(255,80,80,0.08)",
                        border: "0.5px solid rgba(255,80,80,0.15)",
                        color: dia.tieneSesiones ? "rgba(255,255,255,0.2)" : "rgba(255,100,100,0.7)",
                      }}
                      title={dia.tieneSesiones ? "Este día tiene sesiones registradas" : "Eliminar día"}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                </div>

                <div style={{ height: "0.5px", background: "rgba(255,255,255,0.07)" }} />

                {/* Ejercicios */}
                <div className="space-y-3">
                  {dia.ejercicios.map((ej, ejIdx) => (
                    <div key={ejIdx}>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-[9px] font-mono shrink-0 w-4"
                          style={{ color: "rgba(255,255,255,0.18)" }}
                        >
                          {String(ejIdx + 1).padStart(2, "0")}
                        </span>
                        <EjercicioSelector
                          value={ej.nombre}
                          ejercicioId={ej.ejercicio_id}
                          onChange={(n, id) => updateSelector(diaIdx, ejIdx, n, id)}
                        />
                        {dia.ejercicios.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEjercicio(diaIdx, ejIdx)}
                            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg"
                            style={{ color: "rgba(255,255,255,0.25)" }}
                            aria-label="Eliminar ejercicio"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 pl-5">
                        <div>
                          <label
                            className="block text-[9px] tracking-wider uppercase mb-1"
                            style={{ color: "rgba(255,255,255,0.25)" }}
                          >
                            Series
                          </label>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={20}
                            value={ej.series}
                            onChange={(e) => updateEjercicio(diaIdx, ejIdx, "series", e.target.value)}
                            onFocus={(e) => e.target.select()}
                            onBlur={(e) => {
                              if (!e.target.value || Number(e.target.value) < 1) {
                                updateEjercicio(diaIdx, ejIdx, "series", "1");
                              }
                            }}
                            className="w-full rounded-lg px-2 py-1.5 text-xs text-center outline-none transition-colors"
                            style={{
                              background: "rgba(255,255,255,0.04)",
                              border: "0.5px solid rgba(255,255,255,0.08)",
                              color: "rgba(255,255,255,0.92)",
                            }}
                          />
                        </div>
                        <div>
                          <label
                            className="block text-[9px] tracking-wider uppercase mb-1"
                            style={{ color: "rgba(255,255,255,0.25)" }}
                          >
                            Reps objetivo
                          </label>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={999}
                            value={ej.repeticiones}
                            onChange={(e) => updateEjercicio(diaIdx, ejIdx, "repeticiones", e.target.value)}
                            onFocus={(e) => e.target.select()}
                            onBlur={(e) => {
                              if (!e.target.value || Number(e.target.value) < 1) {
                                updateEjercicio(diaIdx, ejIdx, "repeticiones", "1");
                              }
                            }}
                            className="w-full rounded-lg px-2 py-1.5 text-xs text-center outline-none transition-colors"
                            style={{
                              background: "rgba(255,255,255,0.04)",
                              border: "0.5px solid rgba(255,255,255,0.08)",
                              color: "rgba(255,255,255,0.92)",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addEjercicio(diaIdx)}
                  className="flex items-center gap-1 text-[10px] font-light pl-4"
                  style={{ color: "#2abfbf" }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  Añadir ejercicio
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addDia}
            type="button"
            className="active:scale-[0.98]"
            style={{
              width: "100%",
              marginTop: 16,
              padding: "20px 18px",
              borderRadius: 20,
              background: "rgba(255,255,255,0.03)",
              border: "0.5px dashed rgba(42,191,191,0.35)",
              color: "#2abfbf",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "rgba(42,191,191,0.12)",
                border: "0.5px solid rgba(42,191,191,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="#2abfbf" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              Añadir día
            </span>
          </button>
        </div>

        {error && <p className="text-[#f0a0a0] text-xs text-center px-4">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-[#2abfbf] text-[#080808] font-semibold text-sm tracking-widest uppercase py-4 rounded-xl hover:bg-[#25aaaa] active:bg-[#20959e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Guardando…" : mode === "new" ? "Guardar rutina" : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
