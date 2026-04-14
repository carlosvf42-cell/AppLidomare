"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type EjercicioForm = {
  nombre: string;
  series: number;
  repeticiones: number;
  peso: string;
};

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

const EJERCICIO_VACIO: EjercicioForm = { nombre: "", series: 3, repeticiones: 10, peso: "" };

export default function NuevaRutinaPage() {
  const router = useRouter();
  const [fecha, setFecha] = useState(todayISO());
  const [nombre, setNombre] = useState("Mi rutina");
  const [ejercicios, setEjercicios] = useState<EjercicioForm[]>([{ ...EJERCICIO_VACIO }]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function addEjercicio() {
    setEjercicios((prev) => [...prev, { ...EJERCICIO_VACIO }]);
  }

  function removeEjercicio(i: number) {
    setEjercicios((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateEjercicio<K extends keyof EjercicioForm>(i: number, key: K, value: EjercicioForm[K]) {
    setEjercicios((prev) => prev.map((e, idx) => (idx === i ? { ...e, [key]: value } : e)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (ejercicios.some((ej) => !ej.nombre.trim())) {
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
        .insert({ nombre: nombre.trim() || "Mi rutina", fecha, user_id: user.id })
        .select("id")
        .single();

      if (rutinaErr || !rutina) {
        console.error("Supabase rutina insert error:", rutinaErr);
        setError(`No se pudo guardar la rutina. ${rutinaErr?.message ?? ""}`);
        return;
      }

      // 2. Insert ejercicios
      const rows = ejercicios.map((ej, orden) => ({
        rutina_id: rutina.id,
        nombre: ej.nombre.trim(),
        series: ej.series,
        repeticiones: ej.repeticiones,
        peso: ej.peso !== "" ? parseFloat(ej.peso) : null,
        orden,
      }));

      const { error: ejErr } = await supabase.from("ejercicios_rutina").insert(rows);

      if (ejErr) {
        console.error("Supabase ejercicios insert error:", ejErr);
        setError(`Rutina creada pero hubo un error guardando los ejercicios. ${ejErr.message}`);
        return;
      }

      router.push("/rutinas");
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Header */}
      <div className="px-6 pt-14 pb-4 flex items-center gap-3">
        <Link href="/rutinas" className="transition-colors" style={{ color: "#444" }}>
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
        {/* Fecha */}
        <div
          className="rounded-xl px-4 py-4 space-y-4"
          style={{ background: "#141414", border: "1px solid #222" }}
        >
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-[#555] mb-2">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
              className="w-full bg-[#1a1a1a] border border-[#222] rounded-lg px-4 py-3 text-[#f0f0f0] text-sm outline-none focus:border-[#2abfbf] transition-colors"
              style={{ colorScheme: "dark" }}
            />
          </div>
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-[#555] mb-2">Nombre de la rutina</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Mi rutina"
              className="w-full bg-[#1a1a1a] border border-[#222] rounded-lg px-4 py-3 text-[#f0f0f0] placeholder-[#333] text-sm outline-none focus:border-[#2abfbf] transition-colors"
            />
          </div>
        </div>

        {/* Ejercicios */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#555]">
              Ejercicios ({ejercicios.length})
            </p>
            <button
              type="button"
              onClick={addEjercicio}
              className="flex items-center gap-1.5 text-xs font-light transition-colors"
              style={{ color: "#2abfbf" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Añadir ejercicio
            </button>
          </div>

          <div className="space-y-3">
            {ejercicios.map((ej, i) => (
              <div
                key={i}
                className="rounded-xl px-4 py-4"
                style={{ background: "#141414", border: "1px solid #222" }}
              >
                {/* Nombre + eliminar */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-mono text-[#444] shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <input
                    type="text"
                    value={ej.nombre}
                    onChange={(e) => updateEjercicio(i, "nombre", e.target.value)}
                    placeholder="Nombre del ejercicio"
                    required
                    className="flex-1 bg-[#1a1a1a] border border-[#222] rounded-lg px-3 py-2.5 text-[#f0f0f0] placeholder-[#333] text-sm outline-none focus:border-[#2abfbf] transition-colors"
                  />
                  {ejercicios.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEjercicio(i)}
                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                      style={{ color: "#555" }}
                      aria-label="Eliminar ejercicio"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                    </button>
                  )}
                </div>

                {/* Series / Reps / Peso */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] tracking-wider uppercase text-[#444] mb-1">Series</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={ej.series}
                      onChange={(e) => updateEjercicio(i, "series", parseInt(e.target.value) || 1)}
                      className="w-full bg-[#1a1a1a] border border-[#222] rounded-lg px-2 py-2 text-[#f0f0f0] text-sm text-center outline-none focus:border-[#2abfbf] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] tracking-wider uppercase text-[#444] mb-1">Reps</label>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={ej.repeticiones}
                      onChange={(e) => updateEjercicio(i, "repeticiones", parseInt(e.target.value) || 1)}
                      className="w-full bg-[#1a1a1a] border border-[#222] rounded-lg px-2 py-2 text-[#f0f0f0] text-sm text-center outline-none focus:border-[#2abfbf] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] tracking-wider uppercase text-[#444] mb-1">Peso (kg)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={ej.peso}
                      onChange={(e) => updateEjercicio(i, "peso", e.target.value)}
                      placeholder="—"
                      className="w-full bg-[#1a1a1a] border border-[#222] rounded-lg px-2 py-2 text-[#f0f0f0] placeholder-[#333] text-sm text-center outline-none focus:border-[#2abfbf] transition-colors"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-[#f0a0a0] text-xs text-center px-4">{error}</p>
        )}

        {/* Submit */}
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
