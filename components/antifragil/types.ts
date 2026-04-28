export type Maquina = "carrera" | "bici" | "ski" | "remo";
export type CardioModo =
  | "distancia"
  | "intervalos_tiempo"
  | "calorias_total"
  | "distancia_total"
  | "intervalos_calorias";
export type FuncionalFormato = "for_time" | "amrap" | "emom" | "tabata";

export interface FuerzaBlock {
  kind: "fuerza";
  uid: string;
  id?: string;
  orden: number;
  nombre: string | null;
  ejercicio_id: string | null;
  nombre_ejercicio: string;
  series_objetivo: number;
  reps_objetivo: number;
  nota_admin: string | null;
}

export interface CardioBlock {
  kind: "cardio";
  uid: string;
  id?: string;
  orden: number;
  nombre: string | null;
  maquina: Maquina;
  modo: CardioModo;
  distancia_metros: number | null;
  calorias_total: number | null;
  watts_objetivo: number | null;
  rondas: number | null;
  duracion_accion_seg: number | null;
  duracion_descanso_seg: number | null;
  calorias_por_ronda: number | null;
  nota_admin: string | null;
}

export interface FuncionalEjercicio {
  uid: string;
  id?: string;
  tipo: "fuerza" | "cardio";
  orden: number;
  ejercicio_id: string | null;
  nombre_ejercicio: string;
  reps_objetivo: number | null;
  maquina: Maquina | null;
  calorias_objetivo: number | null;
  metros_objetivo: number | null;
}

export interface FuncionalBlock {
  kind: "funcional";
  uid: string;
  id?: string;
  orden: number;
  nombre: string | null;
  formato: FuncionalFormato;
  tiempo_minutos: number;
  duracion_accion_seg: number | null;
  duracion_descanso_seg: number | null;
  nota_admin: string | null;
  ejercicios: FuncionalEjercicio[];
}

export type Block = FuerzaBlock | CardioBlock | FuncionalBlock;

export function newUid(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

export function makeFuerza(orden: number): FuerzaBlock {
  return {
    kind: "fuerza",
    uid: newUid(),
    orden,
    nombre: null,
    ejercicio_id: null,
    nombre_ejercicio: "",
    series_objetivo: 3,
    reps_objetivo: 10,
    nota_admin: null,
  };
}

export function makeCardio(orden: number): CardioBlock {
  return {
    kind: "cardio",
    uid: newUid(),
    orden,
    nombre: null,
    maquina: "carrera",
    modo: "distancia",
    distancia_metros: null,
    calorias_total: null,
    watts_objetivo: null,
    rondas: null,
    duracion_accion_seg: null,
    duracion_descanso_seg: null,
    calorias_por_ronda: null,
    nota_admin: null,
  };
}

export function makeFuncional(orden: number): FuncionalBlock {
  return {
    kind: "funcional",
    uid: newUid(),
    orden,
    nombre: null,
    formato: "for_time",
    tiempo_minutos: 10,
    duracion_accion_seg: null,
    duracion_descanso_seg: null,
    nota_admin: null,
    ejercicios: [],
  };
}

export function makeFuncionalEjercicio(orden: number, tipo: "fuerza" | "cardio"): FuncionalEjercicio {
  return {
    uid: newUid(),
    tipo,
    orden,
    ejercicio_id: null,
    nombre_ejercicio: "",
    reps_objetivo: tipo === "fuerza" ? 10 : null,
    maquina: tipo === "cardio" ? "carrera" : null,
    calorias_objetivo: null,
    metros_objetivo: null,
  };
}

export function tipoResumen(blocks: Block[]): string {
  const set = new Set(blocks.map((b) => b.kind));
  if (set.size === 0) return "";
  if (set.size > 1) return "mixto";
  return [...set][0];
}

export function toApiBlocks(blocks: Block[]): any[] {
  return blocks.map((b) => {
    if (b.kind === "fuerza") {
      return {
        kind: "fuerza",
        orden: b.orden,
        nombre: b.nombre,
        ejercicio_id: b.ejercicio_id,
        nombre_ejercicio: b.nombre_ejercicio || null,
        series_objetivo: b.series_objetivo,
        reps_objetivo: b.reps_objetivo,
        nota_admin: b.nota_admin,
      };
    }
    if (b.kind === "cardio") {
      return {
        kind: "cardio",
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
      };
    }
    return {
      kind: "funcional",
      orden: b.orden,
      nombre: b.nombre,
      formato: b.formato,
      tiempo_minutos: b.tiempo_minutos,
      duracion_accion_seg: b.duracion_accion_seg,
      duracion_descanso_seg: b.duracion_descanso_seg,
      nota_admin: b.nota_admin,
      ejercicios: b.ejercicios.map((e) => ({
        tipo: e.tipo,
        orden: e.orden,
        ejercicio_id: e.ejercicio_id,
        nombre_ejercicio: e.nombre_ejercicio || null,
        reps_objetivo: e.reps_objetivo,
        maquina: e.maquina,
        calorias_objetivo: e.calorias_objetivo,
        metros_objetivo: e.metros_objetivo,
      })),
    };
  });
}

export function fromApiBlocks(rows: any[]): Block[] {
  return rows
    .map((r) => {
      if (r.kind === "fuerza") {
        const b: FuerzaBlock = {
          kind: "fuerza",
          uid: newUid(),
          id: r.id,
          orden: r.orden,
          nombre: r.nombre ?? null,
          ejercicio_id: r.ejercicio_id ?? null,
          nombre_ejercicio: r.nombre_ejercicio ?? "",
          series_objetivo: r.series_objetivo ?? 3,
          reps_objetivo: r.reps_objetivo ?? 10,
          nota_admin: r.nota_admin ?? null,
        };
        return b;
      }
      if (r.kind === "cardio") {
        const b: CardioBlock = {
          kind: "cardio",
          uid: newUid(),
          id: r.id,
          orden: r.orden,
          nombre: r.nombre ?? null,
          maquina: r.maquina,
          modo: r.modo,
          distancia_metros: r.distancia_metros ?? null,
          calorias_total: r.calorias_total ?? null,
          watts_objetivo: r.watts_objetivo ?? null,
          rondas: r.rondas ?? null,
          duracion_accion_seg: r.duracion_accion_seg ?? null,
          duracion_descanso_seg: r.duracion_descanso_seg ?? null,
          calorias_por_ronda: r.calorias_por_ronda ?? null,
          nota_admin: r.nota_admin ?? null,
        };
        return b;
      }
      const b: FuncionalBlock = {
        kind: "funcional",
        uid: newUid(),
        id: r.id,
        orden: r.orden,
        nombre: r.nombre ?? null,
        formato: r.formato,
        tiempo_minutos: r.tiempo_minutos,
        duracion_accion_seg: r.duracion_accion_seg ?? null,
        duracion_descanso_seg: r.duracion_descanso_seg ?? null,
        nota_admin: r.nota_admin ?? null,
        ejercicios: (r.ejercicios ?? []).map((e: any) => ({
          uid: newUid(),
          id: e.id,
          tipo: e.tipo,
          orden: e.orden,
          ejercicio_id: e.ejercicio_id ?? null,
          nombre_ejercicio: e.nombre_ejercicio ?? "",
          reps_objetivo: e.reps_objetivo ?? null,
          maquina: e.maquina ?? null,
          calorias_objetivo: e.calorias_objetivo ?? null,
          metros_objetivo: e.metros_objetivo ?? null,
        })),
      };
      return b;
    })
    .sort((a, b) => a.orden - b.orden);
}
