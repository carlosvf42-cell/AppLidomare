import { getPodcasts } from "@/lib/notion";
import PodcastClient from "./PodcastClient";

export const revalidate = 3600;

export default async function PodcastPage() {
  const episodes = await getPodcasts();
  return <PodcastClient episodes={episodes} />;
}
