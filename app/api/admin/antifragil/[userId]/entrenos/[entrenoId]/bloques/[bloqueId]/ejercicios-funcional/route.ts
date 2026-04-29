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

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  const { data } = await getAdminClient().auth.getUser(token);
  return data.user?.email === ADMIN_EMAIL;
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ userId: string; entrenoId: string; bloqueId: string }> }
) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  try {
    const { userId, entrenoId, bloqueId } = await ctx.params;
    const body = await request.json();
    const supabase = getAdminClient();

    const { data: bloque } = await supabase
      .from("bloques_funcional")
      .select("id, entreno_id, entrenos_antifragil!inner(user_id)")
      .eq("id", bloqueId)
      .eq("entreno_id", entrenoId)
      .maybeSingle();
    if (!bloque || (bloque as any).entrenos_antifragil?.user_id !== userId) {
      return NextResponse.json({ error: "Bloque no encontrado" }, { status: 404 });
    }

    const { data: existing } = await supabase
      .from("ejercicios_funcional")
      .select("orden")
      .eq("bloque_id", bloqueId);
    const nextOrden = (existing ?? []).length === 0 ? 0 : Math.max(...(existing ?? []).map((r: any) => r.orden)) + 1;

    const { data, error } = await supabase
      .from("ejercicios_funcional")
      .insert({
        bloque_id: bloqueId,
        orden: nextOrden,
        tipo: body.tipo,
        ejercicio_id: body.ejercicio_id ?? null,
        nombre_ejercicio: body.nombre_ejercicio || null,
        reps_objetivo: body.reps_objetivo ?? null,
        maquina: body.maquina ?? null,
        calorias_objetivo: body.calorias_objetivo ?? null,
        metros_objetivo: body.metros_objetivo ?? null,
      })
      .select("id")
      .single();
    if (error || !data) return NextResponse.json({ error: error?.message ?? "No se pudo crear" }, { status: 500 });

    return NextResponse.json({ id: data.id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Error desconocido" }, { status: 500 });
  }
}
