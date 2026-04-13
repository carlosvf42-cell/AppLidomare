export type Zone = "Cadera" | "Rodilla" | "Hombro" | "Lumbar" | "Cervical";
export type Progression = 1 | 2 | 3;
export type Activity = "Crossfit" | "Bodybuilding" | "Dirigidas";

export interface Exercise {
  id: string;
  name: string;
  zone: Zone;
  progression: Progression;
  duration: string;
  description: string;
}

export interface ActivationRoutine {
  id: string;
  name: string;
  activity: Activity;
  duration: string;
  exercises: number;
  description: string;
}

export interface Webinar {
  id: string;
  title: string;
  duration: string;
  date: string;
  speaker: string;
  topic: string;
}

export interface PodcastEpisode {
  id: string;
  title: string;
  duration: string;
  episode: number;
  description: string;
  date: string;
}

export const exercises: Exercise[] = [
  { id: "e1", name: "Abducción de cadera con banda", zone: "Cadera", progression: 1, duration: "10 min", description: "Fortalecimiento básico del glúteo medio" },
  { id: "e2", name: "Sentadilla con apoyo", zone: "Cadera", progression: 1, duration: "12 min", description: "Sentadilla asistida para rehabilitación inicial" },
  { id: "e3", name: "Hip thrust unilateral", zone: "Cadera", progression: 2, duration: "15 min", description: "Puente de glúteo avanzado con peso corporal" },
  { id: "e4", name: "Sentadilla búlgara", zone: "Cadera", progression: 3, duration: "18 min", description: "Ejercicio de alta demanda para cadera y cuádriceps" },
  { id: "e5", name: "Extensión de rodilla isométrica", zone: "Rodilla", progression: 1, duration: "8 min", description: "Activación inicial del cuádriceps sin carga" },
  { id: "e6", name: "Step-up controlado", zone: "Rodilla", progression: 2, duration: "12 min", description: "Subida al escalón con control excéntrico" },
  { id: "e7", name: "Sentadilla española", zone: "Rodilla", progression: 3, duration: "20 min", description: "Protocolo avanzado para tendinopatía patelar" },
  { id: "e8", name: "Pendulum squat", zone: "Rodilla", progression: 2, duration: "15 min", description: "Sentadilla con rango controlado para rodilla" },
  { id: "e9", name: "Rotación externa con banda", zone: "Hombro", progression: 1, duration: "10 min", description: "Activación del manguito rotador" },
  { id: "e10", name: "Press con mancuerna neutro", zone: "Hombro", progression: 2, duration: "14 min", description: "Press con agarre neutro para proteger el hombro" },
  { id: "e11", name: "Face pull con cuerda", zone: "Hombro", progression: 1, duration: "10 min", description: "Refuerzo de los rotadores externos y trapecio medio" },
  { id: "e12", name: "Landmine press", zone: "Hombro", progression: 3, duration: "18 min", description: "Empuje diagonal con barra para hombros avanzados" },
  { id: "e13", name: "Cat-Cow lumbar", zone: "Lumbar", progression: 1, duration: "8 min", description: "Movilidad básica de columna lumbar" },
  { id: "e14", name: "Peso muerto rumano", zone: "Lumbar", progression: 2, duration: "15 min", description: "Cadena posterior con control lumbar" },
  { id: "e15", name: "Peso muerto convencional", zone: "Lumbar", progression: 3, duration: "20 min", description: "Levantamiento de alta demanda para lumbar y posterior" },
  { id: "e16", name: "Retracción cervical", zone: "Cervical", progression: 1, duration: "7 min", description: "Corrección postural y activación profunda cervical" },
  { id: "e17", name: "Flexión cervical con banda", zone: "Cervical", progression: 2, duration: "10 min", description: "Fortalecimiento flexores cervicales profundos" },
  { id: "e18", name: "Ejercicio de McKenzie cervical", zone: "Cervical", progression: 1, duration: "8 min", description: "Protocolo de extensión cervical por segmentos" },
];

export const activationRoutines: ActivationRoutine[] = [
  { id: "a1", name: "Activación pre-WOD Crossfit", activity: "Crossfit", duration: "10 min", exercises: 6, description: "Calentamiento dinámico para sesión de alta intensidad" },
  { id: "a2", name: "Movilidad de cadera para Crossfit", activity: "Crossfit", duration: "12 min", exercises: 7, description: "Apertura de cadera y tobillo para movimientos olímpicos" },
  { id: "a3", name: "Activación escapular para Crossfit", activity: "Crossfit", duration: "8 min", exercises: 5, description: "Preparación de hombro para trabajo en barra" },
  { id: "a4", name: "Activación pre-entrenamiento de fuerza", activity: "Bodybuilding", duration: "10 min", exercises: 6, description: "Activación neuromuscular antes de sesión de hipertrofia" },
  { id: "a5", name: "Movilidad torácica para press", activity: "Bodybuilding", duration: "8 min", exercises: 4, description: "Apertura torácica para mejorar el press de banca" },
  { id: "a6", name: "Activación glúteo y core", activity: "Bodybuilding", duration: "12 min", exercises: 8, description: "Activación de glúteo medio antes de sentadilla" },
  { id: "a7", name: "Movilidad general para clases colectivas", activity: "Dirigidas", duration: "7 min", exercises: 5, description: "Calentamiento completo para cualquier clase dirigida" },
  { id: "a8", name: "Activación articular dinámica", activity: "Dirigidas", duration: "9 min", exercises: 6, description: "Rotaciones y movilizaciones para clases de grupo" },
  { id: "a9", name: "Vuelta a la calma post-clase", activity: "Dirigidas", duration: "8 min", exercises: 5, description: "Estiramientos y respiración al finalizar la clase" },
];

export const webinars: Webinar[] = [
  { id: "w1", title: "Dolor de espalda: causas y soluciones", duration: "47 min", date: "2024-01-15", speaker: "Dr. Lidomare", topic: "Lumbar" },
  { id: "w2", title: "Tendinopatía patelar en deportistas", duration: "52 min", date: "2024-02-10", speaker: "Dr. Lidomare", topic: "Rodilla" },
  { id: "w3", title: "Hombro del nadador: prevención y tratamiento", duration: "38 min", date: "2024-02-28", speaker: "Dr. Lidomare", topic: "Hombro" },
  { id: "w4", title: "Lesiones de cadera en runners", duration: "44 min", date: "2024-03-12", speaker: "Dr. Lidomare", topic: "Cadera" },
  { id: "w5", title: "Cervicalgia: más allá del masaje", duration: "41 min", date: "2024-03-25", speaker: "Dr. Lidomare", topic: "Cervical" },
  { id: "w6", title: "Cómo entrenar con dolor crónico", duration: "55 min", date: "2024-04-08", speaker: "Dr. Lidomare", topic: "General" },
  { id: "w7", title: "La importancia del sueño en la recuperación", duration: "36 min", date: "2024-04-22", speaker: "Dr. Lidomare", topic: "Recuperación" },
  { id: "w8", title: "Hiperpronación: qué es y cómo tratarla", duration: "43 min", date: "2024-05-06", speaker: "Dr. Lidomare", topic: "Pie y tobillo" },
  { id: "w9", title: "Ejercicio terapéutico vs fisioterapia pasiva", duration: "49 min", date: "2024-05-20", speaker: "Dr. Lidomare", topic: "General" },
  { id: "w10", title: "Escápula alada: diagnóstico y rehabilitación", duration: "45 min", date: "2024-06-03", speaker: "Dr. Lidomare", topic: "Hombro" },
  { id: "w11", title: "Sobreentrenamiento: señales de alarma", duration: "39 min", date: "2024-06-17", speaker: "Dr. Lidomare", topic: "General" },
  { id: "w12", title: "Crossfit y lesiones: mitos y realidades", duration: "58 min", date: "2024-07-01", speaker: "Dr. Lidomare", topic: "General" },
];

export const podcastEpisodes: PodcastEpisode[] = [
  { id: "p1", episode: 1, title: "Por qué el reposo ya no es la solución", duration: "32 min", date: "2024-01-08", description: "El movimiento como medicina: evidencia actual" },
  { id: "p2", episode: 2, title: "El dolor y la percepción del cerebro", duration: "28 min", date: "2024-01-22", description: "Neurociencia del dolor para no científicos" },
  { id: "p3", episode: 3, title: "¿Es la resonancia necesaria para tratarte?", duration: "25 min", date: "2024-02-05", description: "Cuándo las pruebas de imagen ayudan y cuándo no" },
  { id: "p4", episode: 4, title: "Carga progresiva: el principio más olvidado", duration: "35 min", date: "2024-02-19", description: "Cómo aplicar la carga progresiva en tu recuperación" },
  { id: "p5", episode: 5, title: "Nutrición y recuperación muscular", duration: "30 min", date: "2024-03-04", description: "Qué comer para recuperarte antes y mejor" },
  { id: "p6", episode: 6, title: "El problema con los estiramientos pasivos", duration: "27 min", date: "2024-03-18", description: "Por qué estirar no siempre es la respuesta" },
  { id: "p7", episode: 7, title: "Fascia: la verdad detrás del mito", duration: "31 min", date: "2024-04-01", description: "Desmontando teorías sobre la fascia y el tejido conectivo" },
  { id: "p8", episode: 8, title: "Cardio y salud articular", duration: "29 min", date: "2024-04-15", description: "¿Daña correr a las rodillas? La evidencia responde" },
  { id: "p9", episode: 9, title: "Gestión del dolor en el deporte amateur", duration: "34 min", date: "2024-04-29", description: "Estrategias prácticas para deportistas no profesionales" },
  { id: "p10", episode: 10, title: "La importancia del trabajo excéntrico", duration: "26 min", date: "2024-05-13", description: "Por qué la fase de descenso es tan importante" },
  { id: "p11", episode: 11, title: "Antifrágil: el método detrás de Lidomare", duration: "40 min", date: "2024-05-27", description: "La filosofía que guía nuestro enfoque clínico" },
  { id: "p12", episode: 12, title: "Preguntas y respuestas con la comunidad", duration: "45 min", date: "2024-06-10", description: "Respondemos las preguntas más frecuentes de los oyentes" },
];
