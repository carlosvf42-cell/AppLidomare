import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

// ─── Property helpers ──────────────────────────────────────────────────────

function getTitle(prop: any): string {
  return prop?.title?.[0]?.plain_text ?? "";
}

function getSelect(prop: any): string {
  return prop?.select?.name ?? "";
}

function getRichText(prop: any): string {
  return prop?.rich_text?.map((t: any) => t.plain_text).join("") ?? "";
}

function getUrl(prop: any): string | null {
  return prop?.url ?? null;
}

function getFileUrl(prop: any): string | null {
  const file = prop?.files?.[0];
  if (!file) return null;
  if (file.type === "external") return file.external.url;
  if (file.type === "file") return file.file.url;
  return null;
}

function getDate(prop: any): string | null {
  return prop?.date?.start ?? null;
}

// ─── Query all pages (handles pagination) ────────────────────────────────

async function queryAll(databaseId: string, sorts?: any[]): Promise<any[]> {
  const results: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response: any = await notion.databases.query({
      database_id: databaseId,
      sorts,
      start_cursor: cursor,
      page_size: 100,
    });
    results.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  return results;
}

// ─── Ejercicio ────────────────────────────────────────────────────────────

export interface NotionExercise {
  id: string;
  name: string;
  zone: string;
  progression: number;
  imageUrl: string | null;
  videoUrl: string | null;
  description: string;
  order: number;
}

export async function getEjercicios(): Promise<NotionExercise[]> {
  const pages = await queryAll(process.env.NOTION_DB_EJERCICIO!, [
    { property: "orden", direction: "ascending" },
  ]);

  return pages
    .filter((page: any) => {
      const name = getTitle(page.properties["Nombre"]);
      return name.trim() !== "";
    })
    .map((page: any) => {
      const p = page.properties;
      const progText = getSelect(p["Progresión"]);
      const progNum = parseInt(progText.replace(/[^0-9]/g, "")) || 1;
      const imageUrl = getFileUrl(p["Archivos multimedia"]);

      return {
        id: page.id,
        name: getTitle(p["Nombre"]),
        zone: getSelect(p["Parte"]),
        progression: progNum,
        // Skip base64 data URLs — too heavy for rendering in cards
        imageUrl: imageUrl && imageUrl.startsWith("http") ? imageUrl : null,
        videoUrl: getFileUrl(p["Video"]),
        description: getRichText(p["Texto"]),
        order: p["orden"]?.number ?? 999,
      };
    });
}

// ─── Activación ───────────────────────────────────────────────────────────

export interface NotionActivacion {
  id: string;
  name: string;
  activity: string;
  url: string | null;
  imageUrl: string | null;
}

export async function getActivaciones(): Promise<NotionActivacion[]> {
  const pages = await queryAll(process.env.NOTION_DB_ACTIVACION!);

  return pages
    .filter((page: any) => getTitle(page.properties["Nombre"]).trim() !== "")
    .map((page: any) => {
      const p = page.properties;
      const imageUrl = getFileUrl(p["Portada"]);
      return {
        id: page.id,
        name: getTitle(p["Nombre"]),
        activity: getSelect(p["Actividad"]),
        url: getUrl(p["URL"]),
        imageUrl: imageUrl && imageUrl.startsWith("http") ? imageUrl : null,
      };
    });
}

// ─── Webinars ─────────────────────────────────────────────────────────────

export interface NotionWebinar {
  id: string;
  title: string;
  imageUrl: string | null;
  webinarUrl: string | null;
  tag: string;
  date: string | null;
  description: string;
}

export async function getWebinars(): Promise<NotionWebinar[]> {
  const pages = await queryAll(process.env.NOTION_DB_WEBINARS!, [
    { property: "Fecha del Webinar", direction: "descending" },
  ]);

  return pages
    .filter((page: any) => getTitle(page.properties["Nombre"]).trim() !== "")
    .map((page: any) => {
      const p = page.properties;
      const imageUrl = getFileUrl(p["Portada"]);
      return {
        id: page.id,
        title: getTitle(p["Nombre"]),
        imageUrl: imageUrl && imageUrl.startsWith("http") ? imageUrl : null,
        webinarUrl: getUrl(p["Enlace de Webinar"]),
        tag: getSelect(p["Etiqueta"]),
        date: getDate(p["Fecha del Webinar"]),
        description: getRichText(p["Descripción"]),
      };
    });
}

// ─── Podcast ──────────────────────────────────────────────────────────────

export interface NotionPodcast {
  id: string;
  title: string;
  imageUrl: string | null;
  url: string | null;
}

export async function getPodcasts(): Promise<NotionPodcast[]> {
  const pages = await queryAll(process.env.NOTION_DB_PODCAST!);

  return pages
    .filter((page: any) => getTitle(page.properties["Nombre"]).trim() !== "")
    .map((page: any) => {
      const p = page.properties;
      const imageUrl = getFileUrl(p["Portada"]);
      return {
        id: page.id,
        title: getTitle(p["Nombre"]),
        imageUrl: imageUrl && imageUrl.startsWith("http") ? imageUrl : null,
        url: getUrl(p["URL"]),
      };
    });
}
