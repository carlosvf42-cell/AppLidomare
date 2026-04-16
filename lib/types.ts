export type GrupoMuscular = 'Pecho' | 'Espalda' | 'Piernas' | 'Hombro' | 'Brazo' | 'Core' | 'Otro';

export interface Ejercicio {
  id: string;
  nombre: string;
  grupo_muscular: GrupoMuscular;
  descripcion?: string;
  creado_por: string | null;
  created_at: string;
}

export interface RutinaEjercicio {
  id: string;
  nombre: string;
  series: number;
  repeticiones: number;
  orden: number;
  ejercicio_id?: string;
}

export interface Sesion {
  id: string;
  user_id: string;
  dia_id: string;
  fecha: string;
  completada: boolean;
  duracion_minutos?: number;
  created_at: string;
}

export interface SerieRealizada {
  id: string;
  sesion_id: string;
  ejercicio_id: string;
  numero_serie: number;
  repeticiones?: number;
  peso?: number;
  completada: boolean;
  ejercicio_catalogo_id?: string;
}
