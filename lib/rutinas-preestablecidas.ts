export type Material = "maquina" | "polea" | "libre";

export type EjercicioPreset = {
  nombre: string;
  series: number;
  repeticiones: number;
  grupoMuscular: string;
  material: Material;
};

export type DiaPreset = {
  nombre: string;
  orden: number;
  ejercicios: EjercicioPreset[];
};

export type PlanPreset = {
  id: string;
  nombre: string;
  badge: string;
  dias_semana: number;
  duracion: string;
  intensidad: string;
  nota?: string;
  dias: DiaPreset[];
};

export type NivelPreset = {
  key: string;
  label: string;
  color: string;
  planes: PlanPreset[];
};

function ej(nombre: string, material: Material, grupoMuscular: string, series: number, reps: number): EjercicioPreset {
  return { nombre, series, repeticiones: reps, grupoMuscular, material };
}

export const NIVELES: NivelPreset[] = [
  {
    key: "principiante",
    label: "Principiante",
    color: "#34d399",
    planes: [
      {
        id: "prin-a",
        nombre: "Principiante A",
        badge: "SEM 1-12",
        dias_semana: 2,
        duracion: "45 min",
        intensidad: "100% maquina",
        dias: [
          {
            nombre: "Dia 1", orden: 0,
            ejercicios: [
              ej("Prensa Horizontal", "maquina", "Pierna dominante rodilla", 3, 10),
              ej("Extensión de Cuádriceps", "maquina", "Pierna dominante rodilla", 3, 12),
              ej("Curl Femoral Tumbado", "maquina", "Pierna dominante cadera", 3, 12),
              ej("Remo en Polea Baja", "polea", "Traccion", 3, 10),
              ej("Press de Hombros en Máquina", "maquina", "Empuje", 3, 10),
            ],
          },
          {
            nombre: "Dia 2", orden: 1,
            ejercicios: [
              ej("Extensión de Cuádriceps", "maquina", "Pierna dominante rodilla", 3, 12),
              ej("Curl Femoral Tumbado", "maquina", "Pierna dominante cadera", 3, 12),
              ej("Jalón al Pecho Agarre Ancho", "polea", "Traccion", 3, 10),
              ej("Press de Pecho en Máquina", "maquina", "Empuje", 3, 10),
            ],
          },
        ],
      },
      {
        id: "prin-b",
        nombre: "Principiante B",
        badge: "SEM 12+",
        dias_semana: 3,
        duracion: "45 min",
        intensidad: "100% maquina",
        dias: [
          {
            nombre: "Dia 1", orden: 0,
            ejercicios: [
              ej("Prensa Horizontal", "maquina", "Pierna dominante rodilla", 3, 10),
              ej("Extensión de Cuádriceps", "maquina", "Pierna dominante rodilla", 3, 12),
              ej("Curl Femoral Tumbado", "maquina", "Pierna dominante cadera", 3, 12),
              ej("Remo en Polea Baja", "polea", "Traccion", 3, 10),
              ej("Press de Hombros en Máquina", "maquina", "Empuje", 3, 10),
            ],
          },
          {
            nombre: "Dia 2", orden: 1,
            ejercicios: [
              ej("Extensión de Cuádriceps", "maquina", "Pierna dominante rodilla", 3, 12),
              ej("Curl Femoral Tumbado", "maquina", "Pierna dominante cadera", 3, 12),
              ej("Jalón al Pecho Agarre Ancho", "polea", "Traccion", 3, 10),
              ej("Press de Pecho en Máquina", "maquina", "Empuje", 3, 10),
            ],
          },
          {
            nombre: "Dia 3", orden: 2,
            ejercicios: [
              ej("Prensa Horizontal", "maquina", "Pierna dominante rodilla", 3, 10),
              ej("Extensión de Cuádriceps", "maquina", "Pierna dominante rodilla", 3, 12),
              ej("Curl Femoral Tumbado", "maquina", "Pierna dominante cadera", 3, 12),
              ej("Jalón al Pecho Agarre Ancho", "polea", "Traccion", 3, 10),
              ej("Press de Pecho en Máquina", "maquina", "Empuje", 3, 10),
              ej("Press de Hombros en Máquina", "maquina", "Empuje", 3, 10),
            ],
          },
        ],
      },
    ],
  },
  {
    key: "intermedio",
    label: "Intermedio",
    color: "#fbbf24",
    planes: [
      {
        id: "inter-a",
        nombre: "Intermedio A",
        badge: "SEM 1-12",
        dias_semana: 3,
        duracion: "60 min",
        intensidad: "~50% peso libre",
        dias: [
          {
            nombre: "Dia 1", orden: 0,
            ejercicios: [
              ej("Sentadilla Goblet", "libre", "Pierna dominante rodilla", 4, 8),
              ej("Extensión de Cuádriceps", "maquina", "Pierna dominante rodilla", 3, 12),
              ej("Peso Muerto Rumano", "libre", "Pierna dominante cadera", 4, 8),
              ej("Curl Femoral Tumbado", "maquina", "Pierna dominante cadera", 3, 12),
              ej("Remo con mancuerna", "libre", "Traccion", 4, 8),
              ej("Jalón al Pecho Agarre Neutro", "polea", "Traccion", 3, 10),
              ej("Press banca con mancuernas", "libre", "Empuje", 4, 8),
              ej("Press de Hombros en Máquina", "maquina", "Empuje", 3, 10),
              ej("Curl Bíceps Mancuerna", "libre", "Brazos", 3, 12),
              ej("Extensión Tríceps en Polea", "polea", "Brazos", 3, 12),
            ],
          },
          {
            nombre: "Dia 2", orden: 1,
            ejercicios: [
              ej("Extensión de Cuádriceps", "maquina", "Pierna dominante rodilla", 3, 12),
              ej("Peso Muerto Rumano", "libre", "Pierna dominante cadera", 4, 8),
              ej("Curl Femoral Tumbado", "maquina", "Pierna dominante cadera", 3, 12),
              ej("Jalón al Pecho Agarre Neutro", "polea", "Traccion", 3, 10),
              ej("Remo Gironda", "maquina", "Traccion", 3, 12),
              ej("Press Plano en Máquina", "maquina", "Empuje", 3, 10),
              ej("Curl Bíceps Mancuerna", "libre", "Brazos", 3, 12),
              ej("Extensión Tríceps en Polea", "polea", "Brazos", 3, 12),
            ],
          },
        ],
      },
      {
        id: "inter-b",
        nombre: "Intermedio B",
        badge: "SEM 12+",
        dias_semana: 4,
        duracion: "60 min",
        intensidad: "~70% peso libre",
        nota: "Lunes y jueves: Dia 1 / Martes y viernes: Dia 2",
        dias: [
          {
            nombre: "Dia 1", orden: 0,
            ejercicios: [
              ej("Sentadilla Goblet", "libre", "Pierna dominante rodilla", 4, 8),
              ej("Extensión de Cuádriceps", "maquina", "Pierna dominante rodilla", 3, 12),
              ej("Peso Muerto Rumano", "libre", "Pierna dominante cadera", 4, 8),
              ej("Curl Femoral Tumbado", "maquina", "Pierna dominante cadera", 3, 12),
              ej("Remo con mancuerna", "libre", "Traccion", 4, 8),
              ej("Jalón al Pecho Agarre Neutro", "polea", "Traccion", 3, 10),
              ej("Press banca con mancuernas", "libre", "Empuje", 4, 8),
              ej("Press de Hombros en Máquina", "maquina", "Empuje", 3, 10),
              ej("Curl Bíceps Mancuerna", "libre", "Brazos", 3, 12),
              ej("Extensión Tríceps en Polea", "polea", "Brazos", 3, 12),
            ],
          },
          {
            nombre: "Dia 2", orden: 1,
            ejercicios: [
              ej("Extensión de Cuádriceps", "maquina", "Pierna dominante rodilla", 3, 12),
              ej("Peso Muerto Rumano", "libre", "Pierna dominante cadera", 4, 8),
              ej("Curl Femoral Tumbado", "maquina", "Pierna dominante cadera", 3, 12),
              ej("Jalón al Pecho Agarre Neutro", "polea", "Traccion", 3, 10),
              ej("Remo Gironda", "maquina", "Traccion", 3, 12),
              ej("Press Plano en Máquina", "maquina", "Empuje", 3, 10),
              ej("Curl Bíceps Mancuerna", "libre", "Brazos", 3, 12),
              ej("Extensión Tríceps en Polea", "polea", "Brazos", 3, 12),
            ],
          },
        ],
      },
    ],
  },
  {
    key: "avanzado",
    label: "Avanzado",
    color: "#f87171",
    planes: [
      {
        id: "avanz-a",
        nombre: "Avanzado",
        badge: "PUSH/PULL/LEGS",
        dias_semana: 5,
        duracion: "75 min",
        intensidad: "~90% peso libre",
        dias: [
          {
            nombre: "Lunes — Pecho / Hombro / Triceps", orden: 0,
            ejercicios: [
              ej("Press banca", "libre", "Empuje", 3, 8),
              ej("Press Inclinado con Mancuernas", "libre", "Empuje", 3, 8),
              ej("Polea Alta", "polea", "Empuje", 3, 12),
              ej("Elevaciones Laterales con Cable", "polea", "Empuje", 3, 12),
              ej("Fondos", "libre", "Empuje", 3, 12),
              ej("Extensión de Tríceps", "polea", "Empuje", 3, 12),
            ],
          },
          {
            nombre: "Martes — Espalda / Biceps", orden: 1,
            ejercicios: [
              ej("Dominadas", "libre", "Traccion", 1, 0),
              ej("Remo con Barra", "libre", "Traccion", 3, 8),
              ej("Jalón al Pecho", "polea", "Traccion", 3, 8),
              ej("Remo Gironda", "maquina", "Traccion", 3, 10),
              ej("Face Pull", "polea", "Traccion", 4, 12),
              ej("Curl con Barra Z", "libre", "Brazos", 3, 8),
              ej("Curl Sentado", "libre", "Brazos", 3, 10),
            ],
          },
          {
            nombre: "Miercoles — Pierna", orden: 2,
            ejercicios: [
              ej("Sentadilla", "libre", "Dominante rodilla", 4, 8),
              ej("Prensa", "maquina", "Dominante rodilla", 4, 10),
              ej("Extensión Cuádriceps", "maquina", "Dominante rodilla", 3, 12),
              ej("Hip thrust", "libre", "Dominante cadera", 3, 8),
              ej("Curl Femoral", "maquina", "Dominante cadera", 3, 12),
              ej("Aductores / Abductores", "maquina", "Dominante cadera", 4, 12),
              ej("Extensión de Gemelos", "maquina", "Dominante cadera", 3, 10),
            ],
          },
          {
            nombre: "Jueves — Pecho / Hombro / Triceps", orden: 3,
            ejercicios: [
              ej("Press banca", "libre", "Empuje", 3, 8),
              ej("Press Inclinado con Mancuernas", "libre", "Empuje", 3, 8),
              ej("Polea Alta", "polea", "Empuje", 3, 12),
              ej("Elevaciones Laterales", "libre", "Empuje", 3, 8),
              ej("Elevaciones Laterales con Cable", "polea", "Empuje", 3, 12),
              ej("Fondos", "libre", "Empuje", 3, 12),
              ej("Extensión de Tríceps", "polea", "Empuje", 3, 12),
            ],
          },
          {
            nombre: "Viernes — Espalda / Biceps", orden: 4,
            ejercicios: [
              ej("Dominadas", "libre", "Traccion", 1, 0),
              ej("Peso Muerto", "libre", "Traccion", 4, 6),
              ej("Jalón al Pecho", "polea", "Traccion", 3, 8),
              ej("Remo Gironda", "maquina", "Traccion", 3, 10),
              ej("Face Pull", "polea", "Traccion", 4, 12),
              ej("Curl con Barra Z", "libre", "Brazos", 3, 8),
              ej("Curl Sentado", "libre", "Brazos", 3, 10),
            ],
          },
        ],
      },
    ],
  },
];
