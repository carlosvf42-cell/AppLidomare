"use client";

import { useEffect, useState } from "react";
import type { NotionWebinar } from "@/lib/notion";
import WebinarsClient from "./WebinarsClient";
import { LoadingState, ErrorState } from "@/components/ContentStates";

export default function WebinarsPage() {
  const [data, setData] = useState<NotionWebinar[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/notion/webinars")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json) => setData(json))
      .catch(() => setError(true));
  }, []);

  if (error) return <ErrorState />;
  if (!data)  return <LoadingState />;
  return <WebinarsClient webinars={data} />;
}
