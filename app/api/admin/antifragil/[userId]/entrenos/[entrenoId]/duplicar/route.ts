import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_EMAIL = "carlosvf42@gmail.com";

function getAdminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function verifyAdmin(request: NextRequest): Promise<{ ok: boolean; adminId?: string }> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return { ok: false };
  const token = authHeader.slice(7);
  const { data } = await getAdminClient().auth.getUser(token);
  if (data.user?.email !== ADMIN_EMAIL) return { ok: false };
  return { ok: true, adminId: data.user.id };
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ userId: string; entrenoId: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const { userId, entrenoId } = await ctx.params;
    const supabase = getAdminClient();

    const { data: source, error: srcErr } = await supabase
      .from("entrenos_antifragil")
      .select("id, user_id, nombre")
      .eq("id", entrenoId)
      .eq("user_id", userId)
      .maybeSingle();
    if (srcErr || !source) {
      return NextResponse.json({ error: srcErr?.message ?? "Entreno no encontrado" }, { status: 404 });
    }

    const { data: nuevo, error: newErr } = await supabase
      .from("entrenos_antifragil")
      .insert({
        user_id: userId,
        created_by: auth.adminId!,
        nombre: source.nombre,
        estado: "programado",
        duplicado_de: source.id,
      })
      .select("id")
      .single();
    if (newErr || !nuevo) {
      return NextResponse.json({ error: newErr?.message ?? "No se pudo duplicar" }, { status: 500 });
    }

    const [fuerzaRes, cardioRes, funcionalRes] = await Promise.all([
      supabase
        .from("bloques_fuerza")
        .select("id, orden, nombre, nota_admin")
        .eq("entreno_id", source.id),
      supabase
        .from("bloques_cardio")
        .select("orden, nombre, maquina, modo, distancia_metros, calorias_total, watts_objetivo, rondas, duracion_accion_seg, duracion_descanso_seg, calorias_por_ronda, nota_admin")
        .eq("entreno_id", source.id),
      supabase
        .from("bloques_funcional")
        .select("id, orden, nombre, formato, tiempo_minutos, duracion_accion_seg, duracion_descanso_seg, nota_admin")
        .eq("entreno_id", source.id),
    ]);

    const sourceFuerzaBlocks = fuerzaRes.data ?? [];
    if (sourceFuerzaBlocks.length > 0) {
      const { data: insertedFuerza, error: fuErr } = await supabase
        .from("bloques_fuerza")
        .insert(
          sourceFuerzaBlocks.map((b: any) => ({
            entreno_id: nuevo.id,
            orden: b.orden,
            nombre: b.nombre,
            nota_admin: b.nota_admin,
          }))
        )
        .select("id, orden");
      if (fuErr || !insertedFuerza) {
        return NextResponse.json({ error: fuErr?.message ?? "No se pudieron duplicar bloques fuerza" }, { status: 500 });
      }

      const newFuerzaIdByOrden = new Map<number, string>();
      for (const row of insertedFuerza) newFuerzaIdByOrden.set(row.orden, row.id);
      const oldFuerzaToNew = new Map<string, string>();
      for (const old of sourceFuerzaBlocks) {
        const newId = newFuerzaIdByOrden.get(old.orden);
        if (newId) oldFuerzaToNew.set(old.id, newId);
      }

      const { data: srcEjFuerza } = await supabase
        .from("ejercicios_fuerza")
        .select("bloque_id, orden, ejercicio_id, nombre_ejercicio, series_objetivo, reps_objetivo")
        .in("bloque_id", sourceFuerzaBlocks.map((b: any) => b.id));
      const ejFuerzaRows = (srcEjFuerza ?? [])
        .map((e: any) => ({ ...e, bloque_id: oldFuerzaToNew.get(e.bloque_id) }))
        .filter((e: any) => !!e.bloque_id);
      if (ejFuerzaRows.length > 0) {
        await supabase.from("ejercicios_fuerza").insert(ejFuerzaRows);
      }
    }
    if ((cardioRes.data ?? []).length > 0) {
      await supabase
        .from("bloques_cardio")
        .insert((cardioRes.data ?? []).map((b) => ({ ...b, entreno_id: nuevo.id })));
    }

    const sourceFuncBlocks = funcionalRes.data ?? [];
    if (sourceFuncBlocks.length > 0) {
      const { data: insertedFunc, error: funcErr } = await supabase
        .from("bloques_funcional")
        .insert(
          sourceFuncBlocks.map((b: any) => ({
            entreno_id: nuevo.id,
            orden: b.orden,
            nombre: b.nombre,
            formato: b.formato,
            tiempo_minutos: b.tiempo_minutos,
            duracion_accion_seg: b.duracion_accion_seg,
            duracion_descanso_seg: b.duracion_descanso_seg,
            nota_admin: b.nota_admin,
          }))
        )
        .select("id, orden");
      if (funcErr || !insertedFunc) {
        return NextResponse.json({ error: funcErr?.message ?? "No se pudieron duplicar bloques funcional" }, { status: 500 });
      }

      const newIdByOrden = new Map<number, string>();
      for (const row of insertedFunc) newIdByOrden.set(row.orden, row.id);
      const oldIdToNewId = new Map<string, string>();
      for (const old of sourceFuncBlocks) {
        const newId = newIdByOrden.get(old.orden);
        if (newId) oldIdToNewId.set(old.id, newId);
      }

      const { data: srcEjercicios } = await supabase
        .from("ejercicios_funcional")
        .select("bloque_id, tipo, orden, ejercicio_id, nombre_ejercicio, reps_objetivo, maquina, calorias_objetivo, metros_objetivo")
        .in("bloque_id", sourceFuncBlocks.map((b: any) => b.id));
      const ejRows = (srcEjercicios ?? []).map((e: any) => ({
        ...e,
        bloque_id: oldIdToNewId.get(e.bloque_id),
      })).filter((e) => !!e.bloque_id);
      if (ejRows.length > 0) {
        await supabase.from("ejercicios_funcional").insert(ejRows);
      }
    }

    return NextResponse.json({ id: nuevo.id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Error desconocido" }, { status: 500 });
  }
}
