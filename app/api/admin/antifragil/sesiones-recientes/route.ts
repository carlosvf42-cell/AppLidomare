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

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  try {
    const supabase = getAdminClient();
    const { data: sesiones, error } = await supabase
      .from("sesiones")
      .select("id, user_id, fecha, rpe, duracion_minutos, tipo_resumen, entreno_id, entrenos_antifragil:entreno_id(nombre)")
      .eq("origen", "admin")
      .eq("completada", true)
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const userIds = Array.from(new Set((sesiones ?? []).map((s: any) => s.user_id)));
    const userInfo: Record<string, { email: string; full_name: string | null }> = {};
    await Promise.all(
      userIds.map(async (uid) => {
        const { data } = await supabase.auth.admin.getUserById(uid);
        if (data?.user) {
          userInfo[uid] = {
            email: data.user.email ?? "",
            full_name: (data.user.user_metadata?.full_name as string | undefined) ?? null,
          };
        }
      })
    );

    const out = (sesiones ?? []).map((s: any) => ({
      id: s.id,
      user_id: s.user_id,
      fecha: s.fecha,
      rpe: s.rpe,
      duracion_minutos: s.duracion_minutos,
      tipo_resumen: s.tipo_resumen,
      entreno_nombre: s.entrenos_antifragil?.nombre ?? null,
      cliente_email: userInfo[s.user_id]?.email ?? "",
      cliente_nombre: userInfo[s.user_id]?.full_name ?? null,
    }));

    return NextResponse.json({ sesiones: out });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Error desconocido" }, { status: 500 });
  }
}
