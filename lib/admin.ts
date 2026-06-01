/**
 * Lista única de admins de la app.
 *
 * Nunca hardcodear un email literal fuera de este archivo: usar siempre
 * `isAdmin(email)`. Para añadir o quitar un admin, editar SOLO esta lista.
 */

const ADMIN_EMAILS = [
  "carlosvf42@gmail.com",
  "fcmarcos12@gmail.com",
] as const;

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase();
  return ADMIN_EMAILS.some((e) => e.toLowerCase() === normalized);
}
