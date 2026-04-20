export type TipoMaterial = "maquina" | "polea" | "libre";

export type EjercicioPreset = {
  nombre: string;
  tipo: TipoMaterial;
  series: number;
  repeticiones: number;
};

export type SeccionPreset = {
  titulo: string;
  ejercicios: EjercicioPreset[];
};

export type DiaPreset = {
  nombre: string;
  tag: string;
  secciones: SeccionPreset[];
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

function ej(nombre: string, tipo: TipoMaterial, series: number, reps: number): EjercicioPreset {
  return { nombre, tipo, series, repeticiones: reps };
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
            nombre: "Dia 1", tag: "Fullbody",
            secciones: [
              { titulo: "Pierna dominante rodilla", ejercicios: [
                ej("Prensa horizontal", "maquina", 3, 10),
                ej("Extension de cuadriceps", "maquina", 3, 12),
              ]},
              { titulo: "Pierna dominante cadera", ejercicios: [
                ej("Curl femoral tumbado", "maquina", 3, 12),
              ]},
              { titulo: "Traccion", ejercicios: [
                ej("Remo en polea baja", "polea", 3, 10),
              ]},
              { titulo: "Empuje", ejercicios: [
                ej("Press de hombros en maquina", "maquina", 3, 10),
              ]},
            ],
          },
          {
            nombre: "Dia 2", tag: "Fullbody",
            secciones: [
              { titulo: "Pierna dominante rodilla", ejercicios: [
                ej("Extension de cuadriceps", "maquina", 3, 12),
              ]},
              { titulo: "Pierna dominante cadera", ejercicios: [
                ej("Curl femoral tumbado", "maquina", 3, 12),
              ]},
              { titulo: "Traccion", ejercicios: [
                ej("Jalon al pecho agarre ancho", "polea", 3, 10),
              ]},
              { titulo: "Empuje", ejercicios: [
                ej("Press de pecho en maquina", "maquina", 3, 10),
              ]},
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
            nombre: "Dia 1", tag: "Fullbody",
            secciones: [
              { titulo: "Pierna dominante rodilla", ejercicios: [
                ej("Prensa horizontal", "maquina", 3, 10),
                ej("Extension de cuadriceps", "maquina", 3, 12),
              ]},
              { titulo: "Pierna dominante cadera", ejercicios: [
                ej("Curl femoral tumbado", "maquina", 3, 12),
              ]},
              { titulo: "Traccion", ejercicios: [
                ej("Remo en polea baja", "polea", 3, 10),
              ]},
              { titulo: "Empuje", ejercicios: [
                ej("Press de hombros en maquina", "maquina", 3, 10),
              ]},
            ],
          },
          {
            nombre: "Dia 2", tag: "Fullbody",
            secciones: [
              { titulo: "Pierna dominante rodilla", ejercicios: [
                ej("Extension de cuadriceps", "maquina", 3, 12),
              ]},
              { titulo: "Pierna dominante cadera", ejercicios: [
                ej("Curl femoral tumbado", "maquina", 3, 12),
              ]},
              { titulo: "Traccion", ejercicios: [
                ej("Jalon al pecho agarre ancho", "polea", 3, 10),
              ]},
              { titulo: "Empuje", ejercicios: [
                ej("Press de pecho en maquina", "maquina", 3, 10),
              ]},
            ],
          },
          {
            nombre: "Dia 3", tag: "Fullbody variante",
            secciones: [
              { titulo: "Pierna dominante rodilla", ejercicios: [
                ej("Prensa horizontal", "maquina", 3, 10),
                ej("Extension de cuadriceps", "maquina", 3, 12),
              ]},
              { titulo: "Pierna dominante cadera", ejercicios: [
                ej("Curl femoral tumbado", "maquina", 3, 12),
              ]},
              { titulo: "Traccion", ejercicios: [
                ej("Jalon al pecho agarre ancho", "polea", 3, 10),
              ]},
              { titulo: "Empuje", ejercicios: [
                ej("Press de pecho en maquina", "maquina", 3, 10),
                ej("Press de hombros en maquina", "maquina", 3, 10),
              ]},
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
            nombre: "Dia 1", tag: "Fullbody",
            secciones: [
              { titulo: "Pierna dominante rodilla", ejercicios: [
                ej("Sentadilla goblet / con barra", "libre", 4, 8),
                ej("Extension de cuadriceps", "maquina", 3, 12),
              ]},
              { titulo: "Pierna dominante cadera", ejercicios: [
                ej("Peso muerto rumano con mancuernas", "libre", 4, 8),
                ej("Curl femoral tumbado", "maquina", 3, 12),
              ]},
              { titulo: "Traccion", ejercicios: [
                ej("Remo con mancuerna", "libre", 4, 8),
                ej("Jalon al pecho agarre neutro", "polea", 3, 10),
              ]},
              { titulo: "Empuje", ejercicios: [
                ej("Press banca con mancuernas", "libre", 4, 8),
                ej("Press de hombros en maquina", "maquina", 3, 10),
              ]},
              { titulo: "Brazos", ejercicios: [
                ej("Curl biceps con mancuerna", "libre", 3, 12),
                ej("Extension triceps en polea", "polea", 3, 12),
              ]},
            ],
          },
          {
            nombre: "Dia 2", tag: "Fullbody variante",
            secciones: [
              { titulo: "Pierna dominante rodilla", ejercicios: [
                ej("Extension de cuadriceps", "maquina", 3, 12),
              ]},
              { titulo: "Pierna dominante cadera", ejercicios: [
                ej("Peso muerto rumano con mancuernas", "libre", 4, 8),
                ej("Curl femoral tumbado", "maquina", 3, 12),
              ]},
              { titulo: "Traccion", ejercicios: [
                ej("Jalon al pecho agarre neutro", "polea", 3, 10),
                ej("Remo gironda", "maquina", 3, 12),
              ]},
              { titulo: "Empuje", ejercicios: [
                ej("Press plano en maquina", "maquina", 3, 10),
              ]},
              { titulo: "Brazos", ejercicios: [
                ej("Curl biceps con mancuerna", "libre", 3, 12),
                ej("Extension triceps en polea", "polea", 3, 12),
              ]},
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
            nombre: "Dia 1", tag: "Fullbody",
            secciones: [
              { titulo: "Pierna dominante rodilla", ejercicios: [
                ej("Sentadilla goblet / con barra", "libre", 4, 8),
                ej("Extension de cuadriceps", "maquina", 3, 12),
              ]},
              { titulo: "Pierna dominante cadera", ejercicios: [
                ej("Peso muerto rumano con mancuernas", "libre", 4, 8),
                ej("Curl femoral tumbado", "maquina", 3, 12),
              ]},
              { titulo: "Traccion", ejercicios: [
                ej("Remo con mancuerna", "libre", 4, 8),
                ej("Jalon al pecho agarre neutro", "polea", 3, 10),
              ]},
              { titulo: "Empuje", ejercicios: [
                ej("Press banca con mancuernas", "libre", 4, 8),
                ej("Press de hombros en maquina", "maquina", 3, 10),
              ]},
              { titulo: "Brazos", ejercicios: [
                ej("Curl biceps con mancuerna", "libre", 3, 12),
                ej("Extension triceps en polea", "polea", 3, 12),
              ]},
            ],
          },
          {
            nombre: "Dia 2", tag: "Fullbody variante",
            secciones: [
              { titulo: "Pierna dominante rodilla", ejercicios: [
                ej("Extension de cuadriceps", "maquina", 3, 12),
              ]},
              { titulo: "Pierna dominante cadera", ejercicios: [
                ej("Peso muerto rumano con mancuernas", "libre", 4, 8),
                ej("Curl femoral tumbado", "maquina", 3, 12),
              ]},
              { titulo: "Traccion", ejercicios: [
                ej("Jalon al pecho agarre neutro", "polea", 3, 10),
                ej("Remo gironda", "maquina", 3, 12),
              ]},
              { titulo: "Empuje", ejercicios: [
                ej("Press plano en maquina", "maquina", 3, 10),
              ]},
              { titulo: "Brazos", ejercicios: [
                ej("Curl biceps con mancuerna", "libre", 3, 12),
                ej("Extension triceps en polea", "polea", 3, 12),
              ]},
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
            nombre: "Lunes — Pecho / Hombro / Triceps", tag: "Push A",
            secciones: [
              { titulo: "Empuje", ejercicios: [
                ej("Press banca", "libre", 3, 8),
                ej("Press inclinado (mancuernas)", "libre", 3, 8),
                ej("Polea alta", "polea", 3, 12),
                ej("Elevaciones laterales en polea", "polea", 3, 12),
                ej("Fondos", "libre", 3, 12),
                ej("Extension de triceps", "polea", 3, 12),
              ]},
            ],
          },
          {
            nombre: "Martes — Espalda / Biceps", tag: "Pull A",
            secciones: [
              { titulo: "Traccion", ejercicios: [
                ej("Dominadas (calentamiento)", "libre", 1, 0),
                ej("Remo en barra", "libre", 3, 8),
                ej("Jalon al pecho", "polea", 3, 8),
                ej("Remo gironda", "maquina", 3, 10),
                ej("Face pull", "polea", 4, 12),
                ej("Curl biceps barra Z", "libre", 3, 8),
                ej("Curl sentado", "libre", 3, 10),
              ]},
            ],
          },
          {
            nombre: "Miercoles — Pierna", tag: "Legs",
            secciones: [
              { titulo: "Dominante rodilla", ejercicios: [
                ej("Sentadilla", "libre", 4, 8),
                ej("Prensa", "maquina", 4, 10),
                ej("Extension cuadriceps", "maquina", 3, 12),
              ]},
              { titulo: "Dominante cadera", ejercicios: [
                ej("Hip thrust", "libre", 3, 8),
                ej("Curl femoral", "maquina", 3, 12),
                ej("Aductores / abductores", "maquina", 4, 12),
                ej("Extension de gemelos", "maquina", 3, 10),
              ]},
            ],
          },
          {
            nombre: "Jueves — Pecho / Hombro / Triceps", tag: "Push B",
            secciones: [
              { titulo: "Empuje", ejercicios: [
                ej("Press banca", "libre", 3, 8),
                ej("Press inclinado (mancuernas)", "libre", 3, 8),
                ej("Polea alta", "polea", 3, 12),
                ej("Elevaciones laterales (mancuerna)", "libre", 3, 8),
                ej("Elevaciones laterales en polea", "polea", 3, 12),
                ej("Fondos", "libre", 3, 12),
                ej("Extension de triceps", "polea", 3, 12),
              ]},
            ],
          },
          {
            nombre: "Viernes — Espalda / Biceps", tag: "Pull B",
            secciones: [
              { titulo: "Traccion", ejercicios: [
                ej("Dominadas (calentamiento)", "libre", 1, 0),
                ej("Peso muerto", "libre", 4, 6),
                ej("Jalon al pecho", "polea", 3, 8),
                ej("Remo gironda", "maquina", 3, 10),
                ej("Face pull", "polea", 4, 12),
                ej("Curl biceps barra Z", "libre", 3, 8),
                ej("Curl sentado", "libre", 3, 10),
              ]},
            ],
          },
        ],
      },
    ],
  },
];
