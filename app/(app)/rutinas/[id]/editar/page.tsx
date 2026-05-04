"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import RutinaForm, { type DiaForm } from "@/components/rutinas/RutinaForm";
import { fromApiBlocks } from "@/components/antifragil/types";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

type Loaded = {
  id: string;
  nombre: string;
  user_id: string;
  dias: DiaForm[];
};

export default function EditarRutinaPage() {
  const router = useRouter();
  const params = useParams();
  const rutinaId = params.id as string;

  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rutinaId) return;
    const supabase = getSupabase();
    (async () => {
      const [{ data: rutina }, { data: sesionesRows }] = await Promise.all([
        supabase
          .from("rutinas")
          .select(
            "id, nombre, user_id, rutina_dias(id, nombre, orden, rutina_ejercicios(id, nombre, series, repeticiones, orden, ejercicio_id), rutina_bloques_cardio(id, orden, nombre, maquina, modo, distancia_metros, calorias_total, watts_objetivo, rondas, duracion_accion_seg, duracion_descanso_seg, calorias_por_ronda), rutina_bloques_funcional(id, orden, nombre, formato, tiempo_minutos, duracion_accion_seg, duracion_descanso_seg, rutina_ejercicios_funcional(id, orden, tipo, ejercicio_id, nombre_ejercicio, reps_objetivo, maquina, calorias_objetivo, metros_objetivo)))"
          )
          .eq("id", rutinaId)
          .single(),
        supabase.from("sesiones").select("dia_id"),
      ]);

      if (!rutina) {
        router.push("/rutinas");
        return;
      }

      const sesionDiaIds = new Set(
        ((sesionesRows ?? []) as Array<{ dia_id: string | null }>).map((s) => s.dia_id).filter(Boolean) as string[]
      );

      const r = rutina as any;
      const dias: DiaForm[] = (r.rutina_dias ?? [])
        .sort((a: any, b: any) => a.orden - b.orden)
        .map((d: any) => {
          const cardioRows = (d.rutina_bloques_cardio ?? []).map((c: any) => ({ ...c, kind: "cardio" }));
          const funcRows = (d.rutina_bloques_funcional ?? []).map((f: any) => ({
            ...f,
            kind: "funcional",
            ejercicios: f.rutina_ejercicios_funcional ?? [],
          }));
          const blocks = fromApiBlocks([...cardioRows, ...funcRows]);
          return {
            id: d.id,
            nombre: d.nombre,
            tieneSesiones: sesionDiaIds.has(d.id),
            ejercicios: (d.rutina_ejercicios ?? [])
              .sort((a: any, b: any) => a.orden - b.orden)
              .map((ej: any) => ({
                id: ej.id,
                nombre: ej.nombre,
                ejercicio_id: ej.ejercicio_id ?? null,
                series: String(ej.series ?? 3),
                repeticiones: String(ej.repeticiones ?? 10),
              })),
            blocks,
          };
        });

      setLoaded({ id: r.id, nombre: r.nombre, user_id: r.user_id, dias });
    })().catch((err) => setError(err?.message ?? "Error cargando la rutina"));
  }, [rutinaId, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#080808" }}>
        <p className="text-xs" style={{ color: "#ff8080" }}>{error}</p>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080808" }}>
        <div
          className="w-5 h-5 rounded-full animate-spin"
          style={{ border: "1.5px solid rgba(255,255,255,0.1)", borderTopColor: "#2abfbf" }}
        />
      </div>
    );
  }

  return (
    <RutinaForm
      targetUserId={loaded.user_id}
      mode="edit"
      initial={{ id: loaded.id, nombre: loaded.nombre, dias: loaded.dias }}
      header={
        <div className="px-5 pt-14 pb-4 flex items-center gap-3">
          <Link href="/rutinas" style={{ color: "rgba(255,255,255,0.3)" }} className="shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>
              entrenamiento
            </p>
            <h1 className="text-xl font-light tracking-tight" style={{ color: "rgba(255,255,255,0.92)" }}>
              Editar rutina
            </h1>
          </div>
        </div>
      }
      redirectAfterSave={() => "/rutinas"}
    />
  );
}
