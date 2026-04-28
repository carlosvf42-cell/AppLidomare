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
  ctx: { params: Promise<{ userId: string }> }
) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  try {
    const { userId } = await ctx.params;
    const body = await request.json();
    const supabase = getAdminClient();

    const { data: entreno } = await supabase
      .from("entrenos_antifragil")
      .select("id, user_id")
      .eq("id", body.entreno_id)
      .maybeSingle();
    if (!entreno || entreno.user_id !== userId) {
      return NextResponse.json({ error: "Entreno no encontrado" }, { status: 404 });
    }

    const { data: sesion, error } = await supabase
      .from("sesiones_antifragil")
      .insert({
        user_id: userId,
        entreno_id: body.entreno_id,
        wellness_entry_id: body.wellness_entry_id ?? null,
        completada: false,
      })
      .select("id")
      .single();
    if (error || !sesion) return NextResponse.json({ error: error?.message ?? "No se pudo crear sesión" }, { status: 500 });

    return NextResponse.json({ id: sesion.id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Error desconocido" }, { status: 500 });
  }
}
