"use client";

import { useEffect, useState } from "react";
import type { NotionPodcast } from "@/lib/notion";
import PodcastClient from "./PodcastClient";
import { LoadingState, ErrorState } from "@/components/ContentStates";

export default function PodcastPage() {
  const [data, setData] = useState<NotionPodcast[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/notion/podcast")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json) => setData(json))
      .catch(() => setError(true));
  }, []);

  if (error) return <ErrorState />;
  if (!data)  return <LoadingState />;
  return <PodcastClient episodes={data} />;
}
