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

async function verifyAdmin(request: NextRequest): Promise<{ ok: boolean; adminId?: string }> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return { ok: false };
  const token = authHeader.slice(7);
  const { data } = await getAdminClient().auth.getUser(token);
  if (data.user?.email !== ADMIN_EMAIL) return { ok: false };
  return { ok: true, adminId: data.user.id };
}

type FuerzaEjercicioBody = {
  orden: number;
  ejercicio_id: string | null;
  nombre_ejercicio: string | null;
  series_objetivo: number | null;
  reps_objetivo: number | null;
};

type FuerzaBlockBody = {
  kind: "fuerza";
  orden: number;
  nombre: string | null;
  nota_admin: string | null;
  ejercicios: FuerzaEjercicioBody[];
};

type CardioBlockBody = {
  kind: "cardio";
  orden: number;
  nombre: string | null;
  maquina: "carrera" | "bici" | "ski" | "remo";
  modo: string;
  distancia_metros: number | null;
  calorias_total: number | null;
  watts_objetivo: number | null;
  rondas: number | null;
  duracion_accion_seg: number | null;
  duracion_descanso_seg: number | null;
  calorias_por_ronda: number | null;
  nota_admin: string | null;
};

type FuncionalEjercicioBody = {
  tipo: "fuerza" | "cardio";
  orden: number;
  ejercicio_id: string | null;
  nombre_ejercicio: string | null;
  reps_objetivo: number | null;
  maquina: "carrera" | "bici" | "ski" | "remo" | null;
  calorias_objetivo: number | null;
  metros_objetivo: number | null;
};

type FuncionalBlockBody = {
  kind: "funcional";
  orden: number;
  nombre: string | null;
  formato: "for_time" | "amrap" | "emom" | "tabata";
  tiempo_minutos: number;
  duracion_accion_seg: number | null;
  duracion_descanso_seg: number | null;
  nota_admin: string | null;
  ejercicios: FuncionalEjercicioBody[];
};

type BlockBody = FuerzaBlockBody | CardioBlockBody | FuncionalBlockBody;

type CreateBody = {
  nombre: string | null;
  estado: "borrador" | "programado";
  bloques: BlockBody[];
};

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ userId: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const { userId } = await ctx.params;
    if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 });

    const body = (await request.json()) as CreateBody;
    const supabase = getAdminClient();

    const { data: entreno, error: entrenoErr } = await supabase
      .from("entrenos_antifragil")
      .insert({
        user_id: userId,
        created_by: auth.adminId!,
        nombre: body.nombre,
        estado: body.estado,
      })
      .select("id")
      .single();
    if (entrenoErr || !entreno) {
      return NextResponse.json({ error: entrenoErr?.message ?? "No se pudo crear el entreno" }, { status: 500 });
    }

    const entrenoId = entreno.id;
    const insertResult = await insertBlocks(supabase, entrenoId, body.bloques);
    if (insertResult.error) {
      await supabase.from("entrenos_antifragil").delete().eq("id", entrenoId);
      return NextResponse.json({ error: insertResult.error }, { status: 500 });
    }

    return NextResponse.json({ id: entrenoId });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Error desconocido" }, { status: 500 });
  }
}

export async function insertBlocks(
  supabase: SupabaseClient,
  entrenoId: string,
  bloques: BlockBody[]
): Promise<{ error: string | null }> {
  const fuerza = bloques.filter((b): b is FuerzaBlockBody => b.kind === "fuerza");
  const cardio = bloques.filter((b): b is CardioBlockBody => b.kind === "cardio");
  const funcional = bloques.filter((b): b is FuncionalBlockBody => b.kind === "funcional");

  if (fuerza.length > 0) {
    const { data: insertedFuerza, error } = await supabase
      .from("bloques_fuerza")
      .insert(
        fuerza.map((b) => ({
          entreno_id: entrenoId,
          orden: b.orden,
          nombre: b.nombre,
          nota_admin: b.nota_admin,
        }))
      )
      .select("id, orden");
    if (error || !insertedFuerza) return { error: `bloques_fuerza: ${error?.message ?? "insert vacío"}` };

    const fuerzaIdByOrden = new Map<number, string>();
    for (const row of insertedFuerza) fuerzaIdByOrden.set(row.orden, row.id);

    const ejFuerzaRows: any[] = [];
    for (const block of fuerza) {
      const bloqueId = fuerzaIdByOrden.get(block.orden);
      if (!bloqueId) return { error: `bloques_fuerza: id no resuelto para orden ${block.orden}` };
      for (const ej of block.ejercicios) {
        ejFuerzaRows.push({
          bloque_id: bloqueId,
          orden: ej.orden,
          ejercicio_id: ej.ejercicio_id,
          nombre_ejercicio: ej.nombre_ejercicio,
          series_objetivo: ej.series_objetivo,
          reps_objetivo: ej.reps_objetivo,
        });
      }
    }
    if (ejFuerzaRows.length > 0) {
      const { error: ejErr } = await supabase.from("ejercicios_fuerza").insert(ejFuerzaRows);
      if (ejErr) return { error: `ejercicios_fuerza: ${ejErr.message}` };
    }
  }

  if (cardio.length > 0) {
    const { error } = await supabase.from("bloques_cardio").insert(
      cardio.map((b) => ({
        entreno_id: entrenoId,
        orden: b.orden,
        nombre: b.nombre,
        maquina: b.maquina,
        modo: b.modo,
        distancia_metros: b.distancia_metros,
        calorias_total: b.calorias_total,
        watts_objetivo: b.watts_objetivo,
        rondas: b.rondas,
        duracion_accion_seg: b.duracion_accion_seg,
        duracion_descanso_seg: b.duracion_descanso_seg,
        calorias_por_ronda: b.calorias_por_ronda,
        nota_admin: b.nota_admin,
      }))
    );
    if (error) return { error: `bloques_cardio: ${error.message}` };
  }

  if (funcional.length > 0) {
    const { data: insertedFuncional, error } = await supabase
      .from("bloques_funcional")
      .insert(
        funcional.map((b) => ({
          entreno_id: entrenoId,
          orden: b.orden,
          nombre: b.nombre,
          formato: b.formato,
          tiempo_minutos: b.tiempo_minutos,
          duracion_accion_seg: b.duracion_accion_seg,
          duracion_descanso_seg: b.duracion_descanso_seg,
          nota_admin: b.nota_admin,
        }))
      )
      .select("id, orden");
    if (error || !insertedFuncional) return { error: `bloques_funcional: ${error?.message ?? "insert vacío"}` };

    const idByOrden = new Map<number, string>();
    for (const row of insertedFuncional) idByOrden.set(row.orden, row.id);

    const ejerciciosRows: any[] = [];
    for (const block of funcional) {
      const bloqueId = idByOrden.get(block.orden);
      if (!bloqueId) return { error: `bloques_funcional: id no resuelto para orden ${block.orden}` };
      for (const ej of block.ejercicios) {
        ejerciciosRows.push({
          bloque_id: bloqueId,
          tipo: ej.tipo,
          orden: ej.orden,
          ejercicio_id: ej.ejercicio_id,
          nombre_ejercicio: ej.nombre_ejercicio,
          reps_objetivo: ej.reps_objetivo,
          maquina: ej.maquina,
          calorias_objetivo: ej.calorias_objetivo,
          metros_objetivo: ej.metros_objetivo,
        });
      }
    }
    if (ejerciciosRows.length > 0) {
      const { error: ejErr } = await supabase.from("ejercicios_funcional").insert(ejerciciosRows);
      if (ejErr) return { error: `ejercicios_funcional: ${ejErr.message}` };
    }
  }

  return { error: null };
}
