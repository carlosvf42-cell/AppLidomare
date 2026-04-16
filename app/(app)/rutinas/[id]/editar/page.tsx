"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import EjercicioSelector from "@/components/EjercicioSelector";

type EjercicioEdit = {
  id?: string;
  nombre: string;
  ejercicio_id: string | null;
  series: number;
  repeticiones: number;
};

type DiaEdit = {
  id?: string;
  nombre: string;
  ejercicios: EjercicioEdit[];
  tieneSesiones?: boolean;
};

const EJ_VACIO = (): EjercicioEdit => ({ nombre: "", ejercicio_id: null, series: 3, repeticiones: 10 });
const DIA_VACIO = (): DiaEdit => ({ nombre: "", ejercicios: [EJ_VACIO()] });

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

export default function EditarRutinaPage() {
  const router = useRouter();
  const params = useParams();
  const rutinaId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState("");
  const [dias, setDias] = useState<DiaEdit[]>([]);
  const [deletedDiaIds, setDeletedDiaIds] = useState<string[]>([]);
  const [deletedEjIds, setDeletedEjIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── Load rutina ────────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = getSupabase();
    (async () => {
      const [{ data: rutina }, { data: sesiones }] = await Promise.all([
        supabase
          .from("rutinas")
          .select("id, nombre, rutina_dias(id, nombre, orden, rutina_ejercicios(id, nombre, series, repeticiones, orden, ejercicio_id))")
          .eq("id", rutinaId)
          .single(),
        supabase
          .from("sesiones")
          .select("rutina_dia_id"),
      ]);

      if (!rutina) { router.push("/rutinas"); return; }

      const sesionDiaIds = new Set((sesiones ?? []).map((s: any) => s.rutina_dia_id).filter(Boolean));

      const r = rutina as any;
      const diasLoaded: DiaEdit[] = (r.rutina_dias ?? [])
        .sort((a: any, b: any) => a.orden - b.orden)
        .map((d: any) => ({
          id: d.id,
          nombre: d.nombre,
          tieneSesiones: sesionDiaIds.has(d.id),
          ejercicios: (d.rutina_ejercicios ?? [])
            .sort((a: any, b: any) => a.orden - b.orden)
            .map((ej: any) => ({
              id: ej.id,
              nombre: ej.nombre,
              ejercicio_id: ej.ejercicio_id ?? null,
              series: ej.series ?? 3,
              repeticiones: ej.repeticiones ?? 10,
            })),
        }));

      setNombre(r.nombre);
      setDias(diasLoaded);
      setLoading(false);
    })();
  }, [rutinaId]);

  // ── Día helpers ────────────────────────────────────────────────────────────
  function addDia() {
    setDias((prev) => [...prev, DIA_VACIO()]);
  }

  function deleteDia(idx: number) {
    const dia = dias[idx];
    if (dia.tieneSesiones) return; // guarded in UI
    if (dia.id) setDeletedDiaIds((prev) => [...prev, dia.id!]);
    setDias((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateDiaNombre(idx: number, value: string) {
    setDias((prev) => prev.map((d, i) => i === idx ? { ...d, nombre: value } : d));
  }

  // ── Ejercicio helpers ──────────────────────────────────────────────────────
  function addEjercicio(diaIdx: number) {
    setDias((prev) =>
      prev.map((d, i) => i === diaIdx ? { ...d, ejercicios: [...d.ejercicios, EJ_VACIO()] } : d)
    );
  }

  function deleteEjercicio(diaIdx: number, ejIdx: number) {
    const ej = dias[diaIdx].ejercicios[ejIdx];
    if (ej.id) setDeletedEjIds((prev) => [...prev, ej.id!]);
    setDias((prev) =>
      prev.map((d, i) =>
        i === diaIdx ? { ...d, ejercicios: d.ejercicios.filter((_, j) => j !== ejIdx) } : d
      )
    );
  }

  function updateEjercicio<K extends keyof EjercicioEdit>(diaIdx: number, ejIdx: number, key: K, value: EjercicioEdit[K]) {
    setDias((prev) =>
      prev.map((d, i) =>
        i === diaIdx
          ? { ...d, ejercicios: d.ejercicios.map((e, j) => j === ejIdx ? { ...e, [key]: value } : e) }
          : d
      )
    );
  }

  function updateSelector(diaIdx: number, ejIdx: number, n: string, id: string | null) {
    setDias((prev) =>
      prev.map((d, i) =>
        i === diaIdx
          ? { ...d, ejercicios: d.ejercicios.map((e, j) => j === ejIdx ? { ...e, nombre: n, ejercicio_id: id } : e) }
          : d
      )
    );
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  function handleSave() {
    if (!nombre.trim()) { setError("El nombre no puede estar vacío."); return; }
    if (dias.some((d) => !d.nombre.trim())) { setError("Todos los días necesitan nombre."); return; }
    if (dias.some((d) => d.ejercicios.some((e) => !e.nombre.trim()))) {
      setError("Todos los ejercicios deben tener nombre.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const supabase = getSupabase();

      // 1. Update rutina name
      await supabase.from("rutinas").update({ nombre: nombre.trim() }).eq("id", rutinaId);

      // 2. Delete removed exercises
      if (deletedEjIds.length > 0) {
        await supabase.from("rutina_ejercicios").delete().in("id", deletedEjIds);
      }

      // 3. Delete removed days (exercises inside already deleted or cascaded)
      if (deletedDiaIds.length > 0) {
        await supabase.from("rutina_ejercicios").delete().in("dia_id", deletedDiaIds);
        await supabase.from("rutina_dias").delete().in("id", deletedDiaIds);
      }

      // 4. Process each day
      for (let orden = 0; orden < dias.length; orden++) {
        const dia = dias[orden];

        if (dia.id) {
          // Existing day — update name and orden
          await supabase.from("rutina_dias").update({ nombre: dia.nombre.trim(), orden }).eq("id", dia.id);

          // Process exercises
          for (let ejOrden = 0; ejOrden < dia.ejercicios.length; ejOrden++) {
            const ej = dia.ejercicios[ejOrden];
            if (ej.id) {
              // Update existing
              await supabase.from("rutina_ejercicios").update({
                nombre: ej.nombre.trim(),
                series: ej.series,
                repeticiones: ej.repeticiones,
                orden: ejOrden,
                ...(ej.ejercicio_id ? { ejercicio_id: ej.ejercicio_id } : {}),
              }).eq("id", ej.id);
            } else {
              // Insert new exercise into existing day
              await supabase.from("rutina_ejercicios").insert({
                dia_id: dia.id,
                nombre: ej.nombre.trim(),
                series: ej.series,
                repeticiones: ej.repeticiones,
                orden: ejOrden,
                ...(ej.ejercicio_id ? { ejercicio_id: ej.ejercicio_id } : {}),
              });
            }
          }
        } else {
          // New day — insert
          const { data: newDia } = await supabase
            .from("rutina_dias")
            .insert({ rutina_id: rutinaId, nombre: dia.nombre.trim(), orden })
            .select("id")
            .single();

          if (newDia) {
            const ejRows = dia.ejercicios.map((ej, ejOrden) => ({
              dia_id: (newDia as any).id,
              nombre: ej.nombre.trim(),
              series: ej.series,
              repeticiones: ej.repeticiones,
              orden: ejOrden,
              ...(ej.ejercicio_id ? { ejercicio_id: ej.ejercicio_id } : {}),
            }));
            if (ejRows.length > 0) await supabase.from("rutina_ejercicios").insert(ejRows);
          }
        }
      }

      router.push("/rutinas");
      router.refresh();
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 rounded-full animate-spin" style={{ border: "1.5px solid rgba(255,255,255,0.1)", borderTopColor: "#2abfbf" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <Link href="/rutinas" style={{ color: "rgba(255,255,255,0.3)" }} className="shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>entrenamiento</p>
          <h1 className="text-xl font-light tracking-tight" style={{ color: "rgba(255,255,255,0.92)" }}>Editar rutina</h1>
        </div>
      </div>

      <div className="px-4 pb-10 space-y-5">

        {/* Nombre */}
        <div className="rounded-2xl px-4 py-4" style={GLASS}>
          <label className="block text-[10px] tracking-[0.2em] uppercase mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
            Nombre de la rutina
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
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
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>
              Días ({dias.length})
            </p>
            <button
              type="button"
              onClick={addDia}
              className="flex items-center gap-1.5 text-xs font-light"
              style={{ color: "#2abfbf" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Añadir día
            </button>
          </div>

          <div className="space-y-4">
            {dias.map((dia, diaIdx) => (
              <div key={diaIdx} className="rounded-2xl px-4 py-4 space-y-3" style={GLASS}>
                {/* Día header */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono shrink-0" style={{ color: "rgba(255,255,255,0.2)" }}>
                    {String(diaIdx + 1).padStart(2, "0")}
                  </span>
                  <input
                    type="text"
                    value={dia.nombre}
                    onChange={(e) => updateDiaNombre(diaIdx, e.target.value)}
                    placeholder="Push, Pull, Legs…"
                    className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "0.5px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.92)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => deleteDia(diaIdx)}
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
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>

                <div style={{ height: "0.5px", background: "rgba(255,255,255,0.07)" }} />

                {/* Ejercicios */}
                <div className="space-y-3">
                  {dia.ejercicios.map((ej, ejIdx) => (
                    <div key={ejIdx}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-mono shrink-0 w-4" style={{ color: "rgba(255,255,255,0.2)" }}>
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
                            onClick={() => deleteEjercicio(diaIdx, ejIdx)}
                            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg"
                            style={{ color: "rgba(255,255,255,0.25)" }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                            </svg>
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 pl-5">
                        <div>
                          <label className="block text-[9px] tracking-wider uppercase mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Series</label>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={ej.series}
                            onChange={(e) => updateEjercicio(diaIdx, ejIdx, "series", parseInt(e.target.value) || 1)}
                            className="w-full rounded-lg px-2 py-1.5 text-xs text-center outline-none transition-colors"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "0.5px solid rgba(255,255,255,0.1)",
                              color: "rgba(255,255,255,0.92)",
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] tracking-wider uppercase mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Reps objetivo</label>
                          <input
                            type="number"
                            min={1}
                            max={999}
                            value={ej.repeticiones}
                            onChange={(e) => updateEjercicio(diaIdx, ejIdx, "repeticiones", parseInt(e.target.value) || 1)}
                            className="w-full rounded-lg px-2 py-1.5 text-xs text-center outline-none transition-colors"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "0.5px solid rgba(255,255,255,0.1)",
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
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                  Añadir ejercicio
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-xs text-center" style={{ color: "rgba(255,120,120,0.8)" }}>{error}</p>
        )}

        {/* Guardar */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="w-full py-4 rounded-2xl text-sm font-semibold tracking-widest uppercase transition-all disabled:opacity-50 active:scale-[0.98]"
          style={{
            background: "#2abfbf",
            color: "#000",
            boxShadow: "0 4px 20px rgba(42,191,191,0.35), inset 0 1px 0 rgba(255,255,255,0.25)",
          }}
        >
          {isPending ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
