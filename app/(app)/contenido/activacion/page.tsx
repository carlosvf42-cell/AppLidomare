import { getActivaciones } from "@/lib/notion";
import ActivacionClient from "./ActivacionClient";

export const revalidate = 3600;

export default async function ActivacionPage() {
  const routines = await getActivaciones();
  return <ActivacionClient routines={routines} />;
}
