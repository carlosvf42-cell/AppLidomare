"use client";

import { useEffect, useState } from "react";
import type { NotionActivacion } from "@/lib/notion";
import ActivacionClient from "./ActivacionClient";
import { LoadingState, ErrorState } from "@/components/ContentStates";

export default function ActivacionPage() {
  const [data, setData] = useState<NotionActivacion[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/notion/activacion")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json) => setData(json))
      .catch(() => setError(true));
  }, []);

  if (error) return <ErrorState />;
  if (!data)  return <LoadingState />;
  return <ActivacionClient routines={data} />;
}
