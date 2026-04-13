import { getWebinars } from "@/lib/notion";
import WebinarsClient from "./WebinarsClient";

export const revalidate = 3600;

export default async function WebinarsPage() {
  const webinars = await getWebinars();
  return <WebinarsClient webinars={webinars} />;
}
