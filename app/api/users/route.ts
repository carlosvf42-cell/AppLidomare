import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { isAdmin } from "@/lib/admin";

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
  return isAdmin(data.user?.email);
}

export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { id } = await request.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { error } = await supabase.auth.admin.deleteUser(id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Error desconocido" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const supabase = getAdminClient();
    const [usersRes, profilesRes] = await Promise.all([
      supabase.auth.admin.listUsers(),
      supabase.from("user_profiles").select("user_id, is_antifragil"),
    ]);

    if (usersRes.error) {
      return NextResponse.json({ error: usersRes.error.message }, { status: 500 });
    }

    const profileMap = new Map<string, boolean>(
      (profilesRes.data ?? []).map((p: { user_id: string; is_antifragil: boolean | null }) => [
        p.user_id,
        !!p.is_antifragil,
      ])
    );

    const users = usersRes.data.users.map((u) => ({
      id: u.id,
      email: u.email,
      last_sign_in_at: u.last_sign_in_at,
      created_at: u.created_at,
      full_name: (u.user_metadata?.full_name as string | undefined) ?? null,
      is_antifragil: profileMap.get(u.id) ?? false,
    }));

    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Error desconocido" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { id, is_antifragil } = await request.json();
    if (!id || typeof id !== "string" || typeof is_antifragil !== "boolean") {
      return NextResponse.json({ error: "id (string) e is_antifragil (boolean) requeridos" }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { error } = await supabase
      .from("user_profiles")
      .upsert(
        { user_id: id, is_antifragil, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Error desconocido" }, { status: 500 });
  }
}
