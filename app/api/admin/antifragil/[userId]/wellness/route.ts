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
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("wellness_entries")
      .upsert(
        {
          user_id: userId,
          fecha: today,
          sueno: body.sueno,
          fatiga: body.fatiga,
          estres: body.estres,
          animo: body.animo,
          dolor: body.dolor,
          omitido: !!body.omitido,
        },
        { onConflict: "user_id,fecha" }
      )
      .select("id")
      .single();
    if (error || !data) return NextResponse.json({ error: error?.message ?? "Error" }, { status: 500 });
    return NextResponse.json({ id: data.id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Error desconocido" }, { status: 500 });
  }
}
