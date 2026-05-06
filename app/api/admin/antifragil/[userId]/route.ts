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
        .select("is_antifragil, peso_kg, altura_cm, fecha_nacimiento, sexo")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("entrenos_antifragil")
        .select("id, nombre, estado, created_at")
        .eq("user_id", userId)
        .eq("estado", "programado")
        .order("created_at", { ascending: true }),
      supabase
        .from("sesiones")
        .select("id, fecha, completada, duracion_minutos, rpe, comentario, entreno_id, tipo_resumen, entrenos_antifragil:entreno_id(nombre)")
        .eq("user_id", userId)
        .eq("origen", "admin")
        .eq("completada", true)
        .order("fecha", { ascending: false })
        .limit(5),
    ]);

    if (userRes.error || !userRes.data?.user) {
      return NextResponse.json({ error: userRes.error?.message ?? "Usuario no encontrado" }, { status: 404 });
    }

    const entrenoIds = (entrenosRes.data ?? []).map((e: any) => e.id);
    const tiposPorEntreno: Record<string, Set<string>> = {};
    if (entrenoIds.length > 0) {
      const [bf, bc, bfn] = await Promise.all([
        supabase.from("bloques_fuerza").select("entreno_id").in("entreno_id", entrenoIds),
        supabase.from("bloques_cardio").select("entreno_id").in("entreno_id", entrenoIds),
        supabase.from("bloques_funcional").select("entreno_id").in("entreno_id", entrenoIds),
      ]);
      for (const row of bf.data ?? []) {
        (tiposPorEntreno[row.entreno_id] ??= new Set()).add("fuerza");
      }
      for (const row of bc.data ?? []) {
        (tiposPorEntreno[row.entreno_id] ??= new Set()).add("cardio");
      }
      for (const row of bfn.data ?? []) {
        (tiposPorEntreno[row.entreno_id] ??= new Set()).add("funcional");
      }
    }
    function resumen(set: Set<string> | undefined): string {
      if (!set || set.size === 0) return "";
      if (set.size > 1) return "mixto";
      return [...set][0];
    }
    const entrenos = (entrenosRes.data ?? []).map((e: any) => ({
      ...e,
      tipo: resumen(tiposPorEntreno[e.id]),
    }));

    const sesiones = (sesionesRes.data ?? []).map((s: any) => ({
      ...s,
      entrenos_antifragil: s.entrenos_antifragil
        ? { tipo: s.tipo_resumen ?? "", nombre: s.entrenos_antifragil.nombre }
        : null,
    }));

    const u = userRes.data.user;
    return NextResponse.json({
      user: {
        id: u.id,
        email: u.email,
        full_name: (u.user_metadata?.full_name as string | undefined) ?? null,
        is_antifragil: !!profileRes.data?.is_antifragil,
        peso_kg: profileRes.data?.peso_kg ?? null,
        altura_cm: profileRes.data?.altura_cm ?? null,
        fecha_nacimiento: profileRes.data?.fecha_nacimiento ?? null,
        sexo: profileRes.data?.sexo ?? null,
      },
      entrenos,
      sesiones,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Error desconocido" }, { status: 500 });
  }
}
