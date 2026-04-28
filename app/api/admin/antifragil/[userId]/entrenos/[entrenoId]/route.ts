import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { insertBlocks } from "../route";

const ADMIN_EMAIL = "carlosvf42@gmail.com";

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
  return data.user?.email === ADMIN_EMAIL;
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ userId: string; entrenoId: string }> }
) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  try {
    const { userId, entrenoId } = await ctx.params;
    const supabase = getAdminClient();

    const { data: entreno, error: entrenoErr } = await supabase
      .from("entrenos_antifragil")
      .select("id, user_id, nombre, estado, created_at, duplicado_de")
      .eq("id", entrenoId)
      .eq("user_id", userId)
      .maybeSingle();
    if (entrenoErr || !entreno) {
      return NextResponse.json({ error: entrenoErr?.message ?? "Entreno no encontrado" }, { status: 404 });
    }

    const [fuerzaRes, cardioRes, funcionalRes] = await Promise.all([
      supabase
        .from("bloques_fuerza")
        .select("id, orden, nombre, ejercicio_id, nombre_ejercicio, series_objetivo, reps_objetivo, nota_admin")
        .eq("entreno_id", entrenoId)
        .order("orden"),
      supabase
        .from("bloques_cardio")
        .select("id, orden, nombre, maquina, modo, distancia_metros, calorias_total, watts_objetivo, rondas, duracion_accion_seg, duracion_descanso_seg, calorias_por_ronda, nota_admin")
        .eq("entreno_id", entrenoId)
        .order("orden"),
      supabase
        .from("bloques_funcional")
        .select("id, orden, nombre, formato, tiempo_minutos, duracion_accion_seg, duracion_descanso_seg, nota_admin")
        .eq("entreno_id", entrenoId)
        .order("orden"),
    ]);

    const funcIds = (funcionalRes.data ?? []).map((b: any) => b.id);
    let ejerciciosFunc: any[] = [];
    if (funcIds.length > 0) {
      const { data } = await supabase
        .from("ejercicios_funcional")
        .select("id, bloque_id, tipo, orden, ejercicio_id, nombre_ejercicio, reps_objetivo, maquina, calorias_objetivo, metros_objetivo")
        .in("bloque_id", funcIds)
        .order("orden");
      ejerciciosFunc = data ?? [];
    }

    const bloques = [
      ...(fuerzaRes.data ?? []).map((b: any) => ({ ...b, kind: "fuerza" as const })),
      ...(cardioRes.data ?? []).map((b: any) => ({ ...b, kind: "cardio" as const })),
      ...(funcionalRes.data ?? []).map((b: any) => ({
        ...b,
        kind: "funcional" as const,
        ejercicios: ejerciciosFunc.filter((e) => e.bloque_id === b.id),
      })),
    ].sort((a, b) => a.orden - b.orden);

    return NextResponse.json({ entreno, bloques });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Error desconocido" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  ctx: { params: Promise<{ userId: string; entrenoId: string }> }
) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  try {
    const { userId, entrenoId } = await ctx.params;
    const body = await request.json();
    const supabase = getAdminClient();

    const { data: existing } = await supabase
      .from("entrenos_antifragil")
      .select("id, user_id")
      .eq("id", entrenoId)
      .maybeSingle();
    if (!existing || existing.user_id !== userId) {
      return NextResponse.json({ error: "Entreno no encontrado" }, { status: 404 });
    }

    const { error: updErr } = await supabase
      .from("entrenos_antifragil")
      .update({
        nombre: body.nombre,
        estado: body.estado,
        updated_at: new Date().toISOString(),
      })
      .eq("id", entrenoId);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    const funcBlocks = await supabase.from("bloques_funcional").select("id").eq("entreno_id", entrenoId);
    const funcIds = (funcBlocks.data ?? []).map((b) => b.id);
    if (funcIds.length > 0) {
      await supabase.from("ejercicios_funcional").delete().in("bloque_id", funcIds);
    }
    await Promise.all([
      supabase.from("bloques_fuerza").delete().eq("entreno_id", entrenoId),
      supabase.from("bloques_cardio").delete().eq("entreno_id", entrenoId),
      supabase.from("bloques_funcional").delete().eq("entreno_id", entrenoId),
    ]);

    const result = await insertBlocks(supabase, entrenoId, body.bloques ?? []);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });

    return NextResponse.json({ id: entrenoId });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Error desconocido" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ userId: string; entrenoId: string }> }
) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  try {
    const { userId, entrenoId } = await ctx.params;
    const supabase = getAdminClient();

    const { data: existing } = await supabase
      .from("entrenos_antifragil")
      .select("id, user_id")
      .eq("id", entrenoId)
      .maybeSingle();
    if (!existing || existing.user_id !== userId) {
      return NextResponse.json({ error: "Entreno no encontrado" }, { status: 404 });
    }

    const funcBlocks = await supabase.from("bloques_funcional").select("id").eq("entreno_id", entrenoId);
    const funcIds = (funcBlocks.data ?? []).map((b) => b.id);
    if (funcIds.length > 0) {
      await supabase.from("ejercicios_funcional").delete().in("bloque_id", funcIds);
    }
    await Promise.all([
      supabase.from("bloques_fuerza").delete().eq("entreno_id", entrenoId),
      supabase.from("bloques_cardio").delete().eq("entreno_id", entrenoId),
      supabase.from("bloques_funcional").delete().eq("entreno_id", entrenoId),
    ]);

    const { error: delErr } = await supabase.from("entrenos_antifragil").delete().eq("id", entrenoId);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Error desconocido" }, { status: 500 });
  }
}
