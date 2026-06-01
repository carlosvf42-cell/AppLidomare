import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { isAdmin } from "@/lib/admin";

function getAdminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  const { data } = await getAdminClient().auth.getUser(token);
  return isAdmin(data.user?.email);
}

type SerieFuerza = { bloque_id: string | null; ejercicio_fuerza_id: string; numero_serie: number; repeticiones: number | null; peso: number | null; completada: boolean };
type SerieCardio = { bloque_id: string; numero_ronda: number; watts: number | null; calorias_real: number | null; distancia_metros_real: number | null; calorias_total_real: number | null; completada: boolean };
type RegistroFuncional = { ejercicio_funcional_id: string; kg: number | null; reps_real: number | null; calorias_real: number | null; metros_real: number | null };

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ userId: string; sesionId: string }> }
) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  try {
    const { userId, sesionId } = await ctx.params;
    const body = await request.json();
    const supabase = getAdminClient();

    const { data: sesion } = await supabase
      .from("sesiones")
      .select("id, user_id, entreno_id")
      .eq("id", sesionId)
      .eq("origen", "admin")
      .maybeSingle();
    if (!sesion || sesion.user_id !== userId) {
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
    }

    const { error: updErr } = await supabase
      .from("sesiones")
      .update({
        completada: true,
        rpe: body.rpe ?? null,
        comentario: body.comentario ?? null,
        duracion_minutos: body.duracion_minutos ?? null,
        tipo_resumen: body.tipo_resumen ?? null,
        wellness_entry_id: body.wellness_entry_id ?? null,
      })
      .eq("id", sesionId);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    if (Array.isArray(body.series_fuerza) && body.series_fuerza.length > 0) {
      const incoming = body.series_fuerza as SerieFuerza[];
      // Resolver catalog_id (ejercicios.id) a partir de ejercicio_fuerza_id
      const fuerzaIds = Array.from(new Set(incoming.map((s) => s.ejercicio_fuerza_id).filter(Boolean)));
      const catalogMap = new Map<string, string | null>();
      if (fuerzaIds.length > 0) {
        const { data: efs } = await supabase
          .from("ejercicios_fuerza")
          .select("id, ejercicio_id")
          .in("id", fuerzaIds);
        for (const ef of (efs ?? []) as Array<{ id: string; ejercicio_id: string | null }>) {
          catalogMap.set(ef.id, ef.ejercicio_id);
        }
      }
      const rows = incoming.map((s) => ({
        sesion_id: sesionId,
        ejercicio_id: null,
        ejercicio_catalogo_id: catalogMap.get(s.ejercicio_fuerza_id) ?? null,
        numero_serie: s.numero_serie,
        repeticiones: s.repeticiones,
        peso: s.peso,
        completada: s.completada,
      }));
      const { error } = await supabase.from("series_realizadas").insert(rows);
      if (error) return NextResponse.json({ error: `series_realizadas: ${error.message}` }, { status: 500 });
    }
    if (Array.isArray(body.series_cardio) && body.series_cardio.length > 0) {
      const rows = (body.series_cardio as SerieCardio[]).map((s) => ({ ...s, sesion_id: sesionId }));
      const { error } = await supabase.from("series_cardio_antifragil").insert(rows);
      if (error) return NextResponse.json({ error: `series_cardio: ${error.message}` }, { status: 500 });
    }
    if (Array.isArray(body.registros_funcional) && body.registros_funcional.length > 0) {
      const rows = (body.registros_funcional as RegistroFuncional[]).map((r) => ({ ...r, sesion_id: sesionId }));
      const { error } = await supabase.from("registros_funcional").insert(rows);
      if (error) return NextResponse.json({ error: `registros_funcional: ${error.message}` }, { status: 500 });
    }

    await supabase
      .from("entrenos_antifragil")
      .update({ estado: "completado", updated_at: new Date().toISOString() })
      .eq("id", sesion.entreno_id);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Error desconocido" }, { status: 500 });
  }
}
