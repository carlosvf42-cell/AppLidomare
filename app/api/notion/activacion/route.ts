import { getActivaciones } from "@/lib/notion";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await getActivaciones();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Error al conectar con Notion" }, { status: 500 });
  }
}
