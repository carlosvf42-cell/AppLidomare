"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type EjercicioForm = { nombre: string; series: number; repeticiones: number };
type DiaForm = { nombre: string; ejercicios: EjercicioForm[] };

const EJERCICIO_VACIO: EjercicioForm = { nombre: "", series: 3, repeticiones: 10 };
const DIA_VACIO = (): DiaForm => ({ nombre: "", ejercicios: [{ ...EJERCICIO_VACIO }] });

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function NuevaRutinaPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [dias, setDias] = useState<DiaForm[]>([DIA_VACIO()]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function addDia() {
    setDias((prev) => [...prev, DIA_VACIO()]);
  }

  function removeDia(i: number) {
    setDias((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateDiaNombre(i: number, value: string) {
    setDias((prev) => prev.map((d, idx) => (idx === i ? { ...d, nombre: value } : d)));
  }

  function addEjercicio(diaIdx: number) {
    setDias((prev) =>
      prev.map((d, i) =>
        i === diaIdx ? { ...d, ejercicios: [...d.ejercicios, { ...EJERCICIO_VACIO }] } : d
      )
    );
  }

  function removeEjercicio(diaIdx: number, ejIdx: number) {
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) { setError("Añade un nombre a la rutina."); return; }
    if (dias.some((d) => !d.nombre.trim())) { setError("Todos los días necesitan nombre."); return; }
    if (dias.some((d) => d.ejercicios.some((ej) => !ej.nombre.trim()))) {
      setError("Todos los ejercicios deben tener nombre.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // 1. Insert rutina
      const { data: rutina, error: rutinaErr } = await supabase
        .from("rutinas")
        .insert({ nombre: nombre.trim(), user_id: user.id })
        .select("id")
        .single();

      if (rutinaErr || !rutina) {
        console.error("Rutina insert error:", rutinaErr);
        setError(`No se pudo guardar la rutina. ${rutinaErr?.message ?? ""}`);
        return;
      }

      // 2. Insert días
      const diasRows = dias.map((d, orden) => ({
        rutina_id: rutina.id,
        nombre: d.nombre.trim(),
        orden,
      }));

      const { data: diasData, error: diasErr } = await supabase
        .from("rutina_dias")
        .insert(diasRows)
        .select("id");

      if (diasErr || !diasData) {
        console.error("Dias insert error:", diasErr);
        setError(`Error guardando los días. ${diasErr?.message ?? ""}`);
        return;
      }

      // 3. Insert ejercicios for each día
      const ejerciciosRows = dias.flatMap((d, diaIdx) =>
        d.ejercicios.map((ej, orden) => ({
          dia_id: diasData[diaIdx].id,
          nombre: ej.nombre.trim(),
          series: ej.series,
          repeticiones: ej.repeticiones,
          orden,
        }))
      );

      if (ejerciciosRows.length > 0) {
        const { error: ejErr } = await supabase.from("rutina_ejercicios").insert(ejerciciosRows);
        if (ejErr) {
          console.error("Ejercicios insert error:", ejErr);
          setError(`Días creados pero error en ejercicios. ${ejErr.message}`);
          return;
        }
      }

      router.push("/rutinas");
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="px-6 pt-14 pb-4 flex items-center gap-3">
        <Link href="/rutinas" className="transition-colors shrink-0" style={{ color: "#444" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#444]">entrenamiento</p>
          <h1 className="text-xl font-light text-[#f0f0f0] tracking-tight">Nueva rutina</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pb-10 space-y-5">
        {/* Nombre */}
        <div className="rounded-xl px-4 py-4" style={{ background: "#141414", border: "1px solid #222" }}>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[#555] mb-2">
            Nombre de la rutina
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Push Pull Legs, Full Body…"
            className="w-full bg-[#1a1a1a] border border-[#222] rounded-lg px-4 py-3 text-[#f0f0f0] placeholder-[#333] text-sm outline-none focus:border-[#2abfbf] transition-colors"
          />
        </div>

        {/* Días */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#555]">Días ({dias.length})</p>
            <button type="button" onClick={addDia}
              className="flex items-center gap-1.5 text-xs font-light" style={{ color: "#2abfbf" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Añadir día
            </button>
          </div>

          <div className="space-y-4">
            {dias.map((dia, diaIdx) => (
              <div key={diaIdx} className="rounded-xl px-4 py-4 space-y-3"
                style={{ background: "#141414", border: "1px solid #222" }}>
                {/* Día header */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#444] shrink-0">
                    {String(diaIdx + 1).padStart(2, "0")}
                  </span>
                  <input
                    type="text"
                    value={dia.nombre}
                    onChange={(e) => updateDiaNombre(diaIdx, e.target.value)}
                    placeholder="Push, Pull, Legs, Full Body…"
                    className="flex-1 bg-[#1a1a1a] border border-[#222] rounded-lg px-3 py-2.5 text-[#f0f0f0] placeholder-[#333] text-sm outline-none focus:border-[#2abfbf] transition-colors"
                  />
                  {dias.length > 1 && (
                    <button type="button" onClick={() => removeDia(diaIdx)}
                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg"
                      style={{ color: "#555" }} aria-label="Eliminar día">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                    </button>
                  )}
                </div>

                <div className="border-t border-[#1e1e1e]" />

                {/* Ejercicios */}
                <div className="space-y-3">
                  {dia.ejercicios.map((ej, ejIdx) => (
                    <div key={ejIdx}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-mono text-[#333] shrink-0 w-4">
                          {String(ejIdx + 1).padStart(2, "0")}
                        </span>
                        <input
                          type="text"
                          value={ej.nombre}
                          onChange={(e) => updateEjercicio(diaIdx, ejIdx, "nombre", e.target.value)}
                          placeholder="Nombre del ejercicio"
                          className="flex-1 bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2 text-[#f0f0f0] placeholder-[#333] text-xs outline-none focus:border-[#2abfbf] transition-colors"
                        />
                        {dia.ejercicios.length > 1 && (
                          <button type="button" onClick={() => removeEjercicio(diaIdx, ejIdx)}
                            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg"
                            style={{ color: "#444" }} aria-label="Eliminar ejercicio">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                            </svg>
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 pl-5">
                        <div>
                          <label className="block text-[9px] tracking-wider uppercase text-[#444] mb-1">Series</label>
                          <input
                            type="number" min={1} max={20} value={ej.series}
                            onChange={(e) => updateEjercicio(diaIdx, ejIdx, "series", parseInt(e.target.value) || 1)}
                            className="w-full bg-[#111] border border-[#1e1e1e] rounded-lg px-2 py-1.5 text-[#f0f0f0] text-xs text-center outline-none focus:border-[#2abfbf] transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] tracking-wider uppercase text-[#444] mb-1">Reps objetivo</label>
                          <input
                            type="number" min={1} max={999} value={ej.repeticiones}
                            onChange={(e) => updateEjercicio(diaIdx, ejIdx, "repeticiones", parseInt(e.target.value) || 1)}
                            className="w-full bg-[#111] border border-[#1e1e1e] rounded-lg px-2 py-1.5 text-[#f0f0f0] text-xs text-center outline-none focus:border-[#2abfbf] transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button type="button" onClick={() => addEjercicio(diaIdx)}
                  className="flex items-center gap-1 text-[10px] font-light pl-4"
                  style={{ color: "#2abfbf" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                  Añadir ejercicio
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-[#f0a0a0] text-xs text-center px-4">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-[#2abfbf] text-[#080808] font-semibold text-sm tracking-widest uppercase py-4 rounded-xl hover:bg-[#25aaaa] active:bg-[#20959e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Guardando…" : "Guardar rutina"}
        </button>
      </form>
    </div>
  );
}
