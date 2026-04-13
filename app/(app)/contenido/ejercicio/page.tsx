"use client";

import { useEffect, useState } from "react";
import type { NotionExercise } from "@/lib/notion";
import EjercicioClient from "./EjercicioClient";
import { LoadingState, ErrorState } from "@/components/ContentStates";

export default function EjercicioPage() {
  const [data, setData] = useState<NotionExercise[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/notion/ejercicio")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json) => setData(json))
      .catch(() => setError(true));
  }, []);

  if (error) return <ErrorState />;
  if (!data)  return <LoadingState />;
  return <EjercicioClient exercises={data} />;
}
