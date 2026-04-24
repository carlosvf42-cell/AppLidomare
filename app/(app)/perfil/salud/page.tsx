"use client";
import { useRouter } from "next/navigation";
import HealthTriageFlow from "@/components/health/HealthTriageFlow";

export default function SaludPage() {
  const router = useRouter();
  return <HealthTriageFlow onComplete={() => router.push("/")} />;
}
