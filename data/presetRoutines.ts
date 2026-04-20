export type TipoMaterial = "maquina" | "polea" | "libre";

export type Ejercicio = {
  nombre: string;
  tipo: TipoMaterial;
  series: string;
};

export type Seccion = {
  titulo: string;
  ejercicios: Ejercicio[];
};

export type Dia = {
  nombre: string;
  tag: string;
  secciones?: Seccion[];
  ejercicios?: Ejercicio[];
};

export type FaseData = {
  titulo: string;
  stats: { dias: number; duracion: string; intensidad: string };
  dias?: Dia[];
  notaSemana?: string;
};

export type NivelConFases = {
  fases: Record<string, FaseData>;
};

export type NivelSinFases = {
  stats: { dias: number; duracion: string; intensidad: string };
  dias: Dia[];
};

export type NivelData = NivelConFases | NivelSinFases;

export function tieneFases(nivel: NivelData): nivel is NivelConFases {
  return "fases" in nivel;
}

export const PRESET_ROUTINES: Record<string, NivelData> = {
  principiante: {
    fases: {
      A: {
        titulo: "Sem 1\u201312 \u00b7 2 d\u00edas",
        stats: { dias: 2, duracion: "45\u2019", intensidad: "100% m\u00e1quina" },
        dias: [
          {
            nombre: "D\u00eda 1",
            tag: "Fullbody",
            secciones: [
              {
                titulo: "Pierna dominante rodilla",
                ejercicios: [
                  { nombre: "Prensa horizontal", tipo: "maquina", series: "3 \u00d7 10" },
                  { nombre: "Extensi\u00f3n de cu\u00e1driceps", tipo: "maquina", series: "3 \u00d7 12" },
                ],
              },
              {
                titulo: "Pierna dominante cadera",
                ejercicios: [
                  { nombre: "Curl femoral tumbado", tipo: "maquina", series: "3 \u00d7 12" },
                ],
              },
              {
                titulo: "Tracci\u00f3n",
                ejercicios: [
                  { nombre: "Remo en polea baja", tipo: "polea", series: "3 \u00d7 10" },
                ],
              },
              {
                titulo: "Empuje",
                ejercicios: [
                  { nombre: "Press de hombros en m\u00e1quina", tipo: "maquina", series: "3 \u00d7 10" },
                ],
              },
            ],
          },
          {
            nombre: "D\u00eda 2",
            tag: "Fullbody",
            secciones: [
              {
                titulo: "Pierna dominante rodilla",
                ejercicios: [
                  { nombre: "Extensi\u00f3n de cu\u00e1driceps", tipo: "maquina", series: "3 \u00d7 12" },
                ],
              },
              {
                titulo: "Pierna dominante cadera",
                ejercicios: [
                  { nombre: "Curl femoral tumbado", tipo: "maquina", series: "3 \u00d7 12" },
                ],
              },
              {
                titulo: "Tracci\u00f3n",
                ejercicios: [
                  { nombre: "Jal\u00f3n al pecho agarre ancho", tipo: "polea", series: "3 \u00d7 10" },
                ],
              },
              {
                titulo: "Empuje",
                ejercicios: [
                  { nombre: "Press de pecho en m\u00e1quina", tipo: "maquina", series: "3 \u00d7 10" },
                ],
              },
            ],
          },
        ],
      },
      B: {
        titulo: "Sem 12+ \u00b7 3 d\u00edas",
        stats: { dias: 3, duracion: "45\u2019", intensidad: "100% m\u00e1quina" },
        dias: [
          {
            nombre: "D\u00eda 3",
            tag: "Fullbody \u00b7 variante",
            secciones: [
              {
                titulo: "Pierna dominante rodilla",
                ejercicios: [
                  { nombre: "Prensa horizontal", tipo: "maquina", series: "3 \u00d7 10" },
                  { nombre: "Extensi\u00f3n de cu\u00e1driceps", tipo: "maquina", series: "3 \u00d7 12" },
                ],
              },
              {
                titulo: "Pierna dominante cadera",
                ejercicios: [
                  { nombre: "Curl femoral tumbado", tipo: "maquina", series: "3 \u00d7 12" },
                ],
              },
              {
                titulo: "Tracci\u00f3n",
                ejercicios: [
                  { nombre: "Jal\u00f3n al pecho agarre ancho", tipo: "polea", series: "3 \u00d7 10" },
                ],
              },
              {
                titulo: "Empuje",
                ejercicios: [
                  { nombre: "Press de pecho en m\u00e1quina", tipo: "maquina", series: "3 \u00d7 10" },
                  { nombre: "Press de hombros en m\u00e1quina", tipo: "maquina", series: "3 \u00d7 10" },
                ],
              },
            ],
          },
        ],
      },
    },
  },
  intermedio: {
    fases: {
      A: {
        titulo: "Sem 1\u201312 \u00b7 3 d\u00edas",
        stats: { dias: 3, duracion: "60\u2019", intensidad: "~50% peso libre" },
        dias: [
          {
            nombre: "D\u00eda 1",
            tag: "Fullbody",
            secciones: [
              {
                titulo: "Pierna dominante rodilla",
                ejercicios: [
                  { nombre: "Sentadilla goblet / con barra", tipo: "libre", series: "4 \u00d7 8" },
                  { nombre: "Extensi\u00f3n de cu\u00e1driceps", tipo: "maquina", series: "3 \u00d7 12" },
                ],
              },
              {
                titulo: "Pierna dominante cadera",
                ejercicios: [
                  { nombre: "Peso muerto rumano con mancuernas", tipo: "libre", series: "4 \u00d7 8" },
                  { nombre: "Curl femoral tumbado", tipo: "maquina", series: "3 \u00d7 12" },
                ],
              },
              {
                titulo: "Tracci\u00f3n",
                ejercicios: [
                  { nombre: "Remo con mancuerna", tipo: "libre", series: "4 \u00d7 8" },
                  { nombre: "Jal\u00f3n al pecho agarre neutro", tipo: "polea", series: "3 \u00d7 10" },
                ],
              },
              {
                titulo: "Empuje",
                ejercicios: [
                  { nombre: "Press banca con mancuernas", tipo: "libre", series: "4 \u00d7 8" },
                  { nombre: "Press de hombros en m\u00e1quina", tipo: "maquina", series: "3 \u00d7 10" },
                ],
              },
              {
                titulo: "Brazos",
                ejercicios: [
                  { nombre: "Curl b\u00edceps con mancuerna", tipo: "libre", series: "3 \u00d7 12" },
                  { nombre: "Extensi\u00f3n tr\u00edceps en polea", tipo: "polea", series: "3 \u00d7 12" },
                ],
              },
            ],
          },
          {
            nombre: "D\u00eda 2",
            tag: "Fullbody \u00b7 variante",
            secciones: [
              {
                titulo: "Pierna dominante rodilla",
                ejercicios: [
                  { nombre: "Extensi\u00f3n de cu\u00e1driceps", tipo: "maquina", series: "3 \u00d7 12" },
                ],
              },
              {
                titulo: "Pierna dominante cadera",
                ejercicios: [
                  { nombre: "Peso muerto rumano con mancuernas", tipo: "libre", series: "4 \u00d7 8" },
                  { nombre: "Curl femoral tumbado", tipo: "maquina", series: "3 \u00d7 12" },
                ],
              },
              {
                titulo: "Tracci\u00f3n",
                ejercicios: [
                  { nombre: "Jal\u00f3n al pecho agarre neutro", tipo: "polea", series: "3 \u00d7 10" },
                  { nombre: "Remo gironda", tipo: "maquina", series: "3 \u00d7 12" },
                ],
              },
              {
                titulo: "Empuje",
                ejercicios: [
                  { nombre: "Press plano en m\u00e1quina", tipo: "maquina", series: "3 \u00d7 10" },
                ],
              },
              {
                titulo: "Brazos",
                ejercicios: [
                  { nombre: "Curl b\u00edceps con mancuerna", tipo: "libre", series: "3 \u00d7 12" },
                  { nombre: "Extensi\u00f3n tr\u00edceps en polea", tipo: "polea", series: "3 \u00d7 12" },
                ],
              },
            ],
          },
        ],
      },
      B: {
        titulo: "Sem 12+ \u00b7 4 d\u00edas",
        stats: { dias: 4, duracion: "60\u2019", intensidad: "~70% peso libre" },
        notaSemana: "Lunes y jueves \u2192 D\u00eda 1 \u00b7 Martes y viernes \u2192 D\u00eda 2",
      },
    },
  },
  avanzado: {
    stats: { dias: 5, duracion: "75\u2019", intensidad: "~90% peso libre" },
    dias: [
      {
        nombre: "Lunes \u2014 Pecho \u00b7 Hombro \u00b7 Tr\u00edceps",
        tag: "Push A",
        ejercicios: [
          { nombre: "Press banca", tipo: "libre", series: "3 \u00d7 8" },
          { nombre: "Press inclinado (mancuernas)", tipo: "libre", series: "3 \u00d7 8" },
          { nombre: "Polea alta", tipo: "polea", series: "3 \u00d7 12" },
          { nombre: "Elevaciones laterales en polea", tipo: "polea", series: "3 \u00d7 12" },
          { nombre: "Fondos", tipo: "libre", series: "3 \u00d7 12" },
          { nombre: "Extensi\u00f3n de tr\u00edceps", tipo: "polea", series: "3 \u00d7 12" },
        ],
      },
      {
        nombre: "Martes \u2014 Espalda \u00b7 B\u00edceps",
        tag: "Pull A",
        ejercicios: [
          { nombre: "Dominadas (calentamiento)", tipo: "libre", series: "\u2014" },
          { nombre: "Remo en barra", tipo: "libre", series: "3 \u00d7 8" },
          { nombre: "Jal\u00f3n al pecho", tipo: "polea", series: "3 \u00d7 8" },
          { nombre: "Remo gironda", tipo: "maquina", series: "3 \u00d7 10" },
          { nombre: "Face pull", tipo: "polea", series: "4 \u00d7 12" },
          { nombre: "Curl b\u00edceps barra Z", tipo: "libre", series: "3 \u00d7 8" },
          { nombre: "Curl sentado", tipo: "libre", series: "3 \u00d7 10" },
        ],
      },
      {
        nombre: "Mi\u00e9rcoles \u2014 Pierna",
        tag: "Legs",
        secciones: [
          {
            titulo: "Dominante rodilla",
            ejercicios: [
              { nombre: "Sentadilla", tipo: "libre", series: "4 \u00d7 8" },
              { nombre: "Prensa", tipo: "maquina", series: "4 \u00d7 10" },
              { nombre: "Extensi\u00f3n cu\u00e1driceps", tipo: "maquina", series: "3 \u00d7 12" },
            ],
          },
          {
            titulo: "Dominante cadera",
            ejercicios: [
              { nombre: "Hip thrust", tipo: "libre", series: "3 \u00d7 8" },
              { nombre: "Curl femoral", tipo: "maquina", series: "3 \u00d7 12" },
              { nombre: "Aductores / abductores", tipo: "maquina", series: "4 \u00d7 12" },
              { nombre: "Extensi\u00f3n de gemelos", tipo: "maquina", series: "3 \u00d7 10" },
            ],
          },
        ],
      },
      {
        nombre: "Jueves \u2014 Pecho \u00b7 Hombro \u00b7 Tr\u00edceps",
        tag: "Push B",
        ejercicios: [
          { nombre: "Press banca", tipo: "libre", series: "3 \u00d7 8" },
          { nombre: "Press inclinado (mancuernas)", tipo: "libre", series: "3 \u00d7 8" },
          { nombre: "Polea alta", tipo: "polea", series: "3 \u00d7 12" },
          { nombre: "Elevaciones laterales (mancuerna)", tipo: "libre", series: "3 \u00d7 8" },
          { nombre: "Elevaciones laterales en polea", tipo: "polea", series: "3 \u00d7 12" },
          { nombre: "Fondos", tipo: "libre", series: "3 \u00d7 12" },
          { nombre: "Extensi\u00f3n de tr\u00edceps", tipo: "polea", series: "3 \u00d7 12" },
        ],
      },
      {
        nombre: "Viernes \u2014 Espalda \u00b7 B\u00edceps",
        tag: "Pull B",
        ejercicios: [
          { nombre: "Dominadas (calentamiento)", tipo: "libre", series: "\u2014" },
          { nombre: "Peso muerto", tipo: "libre", series: "4 \u00d7 6" },
          { nombre: "Jal\u00f3n al pecho", tipo: "polea", series: "3 \u00d7 8" },
          { nombre: "Remo gironda", tipo: "maquina", series: "3 \u00d7 10" },
          { nombre: "Face pull", tipo: "polea", series: "4 \u00d7 12" },
          { nombre: "Curl b\u00edceps barra Z", tipo: "libre", series: "3 \u00d7 8" },
          { nombre: "Curl sentado", tipo: "libre", series: "3 \u00d7 10" },
        ],
      },
    ],
  },
};
