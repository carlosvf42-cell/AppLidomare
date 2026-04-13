import { getEjercicios } from "@/lib/notion";
import EjercicioClient from "./EjercicioClient";

export const revalidate = 3600; // revalidate every hour

export default async function EjercicioPage() {
  const exercises = await getEjercicios();
  return <EjercicioClient exercises={exercises} />;
}
