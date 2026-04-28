import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_EMAIL = "carlosvf42@gmail.com";

function getAdminClient() {
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
  ctx: { params: Promise<{ userId: string }> }
) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { userId } = await ctx.params;
    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }

    const supabase = getAdminClient();
    const [userRes, profileRes, entrenosRes, sesionesRes] = await Promise.all([
      supabase.auth.admin.getUserById(userId),
      supabase
        .from("user_profiles")
        .select("is_antifragil")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("entrenos_antifragil")
        .select("id, tipo, nombre, estado, created_at")
        .eq("user_id", userId)
        .eq("estado", "programado")
        .order("created_at", { ascending: true }),
      supabase
        .from("sesiones_antifragil")
        .select("id, fecha, completada, duracion_minutos, rpe, comentario, entreno_id, entrenos_antifragil(tipo, nombre)")
        .eq("user_id", userId)
        .eq("completada", true)
        .order("fecha", { ascending: false })
        .limit(5),
    ]);

    if (userRes.error || !userRes.data?.user) {
      return NextResponse.json({ error: userRes.error?.message ?? "Usuario no encontrado" }, { status: 404 });
    }

    const u = userRes.data.user;
    return NextResponse.json({
      user: {
        id: u.id,
        email: u.email,
        full_name: (u.user_metadata?.full_name as string | undefined) ?? null,
        is_antifragil: !!profileRes.data?.is_antifragil,
      },
      entrenos: entrenosRes.data ?? [],
      sesiones: sesionesRes.data ?? [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Error desconocido" }, { status: 500 });
  }
}
