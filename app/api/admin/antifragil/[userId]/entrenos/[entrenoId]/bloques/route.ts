import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { insertBlocks } from "../../route";

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
  ctx: { params: Promise<{ userId: string; entrenoId: string }> }
) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  try {
    const { userId, entrenoId } = await ctx.params;
    const body = await request.json();
    const supabase = getAdminClient();

    const { data: entreno } = await supabase
      .from("entrenos_antifragil")
      .select("id, user_id")
      .eq("id", entrenoId)
      .maybeSingle();
    if (!entreno || entreno.user_id !== userId) {
      return NextResponse.json({ error: "Entreno no encontrado" }, { status: 404 });
    }

    const bloque = body.bloque;
    if (!bloque || !bloque.kind) {
      return NextResponse.json({ error: "Falta bloque" }, { status: 400 });
    }

    const counts = await Promise.all([
      supabase.from("bloques_fuerza").select("orden").eq("entreno_id", entrenoId),
      supabase.from("bloques_cardio").select("orden").eq("entreno_id", entrenoId),
      supabase.from("bloques_funcional").select("orden").eq("entreno_id", entrenoId),
    ]);
    const allOrdenes = [
      ...(counts[0].data ?? []).map((r: any) => r.orden),
      ...(counts[1].data ?? []).map((r: any) => r.orden),
      ...(counts[2].data ?? []).map((r: any) => r.orden),
    ];
    const nextOrden = allOrdenes.length === 0 ? 0 : Math.max(...allOrdenes) + 1;

    const result = await insertBlocks(supabase, entrenoId, [{ ...bloque, orden: nextOrden }]);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Error desconocido" }, { status: 500 });
  }
}
