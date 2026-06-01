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

/** Verifica que el request viene del admin comparando el JWT del usuario */
async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  const { data } = await getAdminClient().auth.getUser(token);
  return isAdmin(data.user?.email);
}

// GET — listar todos los ejercicios globales (creado_por IS NULL)
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { data, error } = await getAdminClient()
    .from("ejercicios")
    .select("id, nombre, grupo_muscular, descripcion, created_at")
    .is("creado_por", null)
    .order("grupo_muscular")
    .order("nombre");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ejercicios: data });
}

// POST — crear ejercicio global (creado_por = null, bypasa RLS con service role)
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const { nombre, grupo_muscular, descripcion } = body;

  if (!nombre?.trim() || !grupo_muscular?.trim()) {
    return NextResponse.json({ error: "nombre y grupo_muscular son obligatorios" }, { status: 400 });
  }

  const { data, error } = await getAdminClient()
    .from("ejercicios")
    .insert({ nombre: nombre.trim(), grupo_muscular, descripcion: descripcion?.trim() || null, creado_por: null })
    .select("id, nombre, grupo_muscular, descripcion, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ejercicio: data }, { status: 201 });
}

// PUT — editar ejercicio global
export async function PUT(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const { id, nombre, grupo_muscular, descripcion } = body;

  if (!id || !nombre?.trim() || !grupo_muscular?.trim()) {
    return NextResponse.json({ error: "id, nombre y grupo_muscular son obligatorios" }, { status: 400 });
  }

  // Only allow editing global exercises
  const { data, error } = await getAdminClient()
    .from("ejercicios")
    .update({ nombre: nombre.trim(), grupo_muscular, descripcion: descripcion?.trim() || null })
    .eq("id", id)
    .is("creado_por", null)
    .select("id, nombre, grupo_muscular, descripcion, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Ejercicio no encontrado" }, { status: 404 });
  return NextResponse.json({ ejercicio: data });
}

// DELETE — eliminar ejercicio global
export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const { error } = await getAdminClient()
    .from("ejercicios")
    .delete()
    .eq("id", id)
    .is("creado_por", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
