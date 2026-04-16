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
