/* ── Borrador del entreno en vivo (admin) ─────────────────────
 * Todo lo que se marca en EntrenoLive vive en memoria hasta pulsar
 * "Guardar sesión". En la PWA de iOS la vista web se descarga en
 * segundo plano (pantalla bloqueada, cambio de app…) y se perdía todo.
 * Guardamos un borrador en localStorage para poder restaurarlo.
 */

const DRAFT_PREFIX = "lidomare-live-draft:";
const ACTIVE_KEY = "lidomare-live-active";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export const LIVE_ACTIVE_EVENT = "lidomare-live-active-change";

export type LiveDraft = {
  userId: string;
  entrenoId: string;
  sesionId: string;
  wellnessEntryId: string | null;
  startedAt: number;
  phase: "training" | "finalize";
  seriesByEjercicio: Record<string, unknown[]>;
  rondasByBlock: Record<string, unknown[]>;
  registrosByBlock: Record<string, Record<string, unknown>>;
  rpe: number | null;
  comentario: string;
  duracionStr: string;
  updatedAt: number;
};

export type LiveActive = {
  userId: string;
  entrenoId: string;
  nombre: string | null;
  updatedAt: number;
};

function notify() {
  try {
    window.dispatchEvent(new Event(LIVE_ACTIVE_EVENT));
  } catch { /* ignore */ }
}

export function saveLiveDraft(draft: LiveDraft, nombre: string | null) {
  try {
    localStorage.setItem(DRAFT_PREFIX + draft.entrenoId, JSON.stringify(draft));
    const prev = localStorage.getItem(ACTIVE_KEY);
    const active: LiveActive = { userId: draft.userId, entrenoId: draft.entrenoId, nombre, updatedAt: draft.updatedAt };
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(active));
    if (!prev) notify();
  } catch { /* quota exceeded or private browsing — silently ignore */ }
}

export function loadLiveDraft(entrenoId: string): LiveDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_PREFIX + entrenoId);
    if (!raw) return null;
    const draft: LiveDraft = JSON.parse(raw);
    if (Date.now() - draft.updatedAt > MAX_AGE_MS) {
      clearLiveDraft(entrenoId);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export function loadLiveActive(): LiveActive | null {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) return null;
    const active: LiveActive = JSON.parse(raw);
    if (Date.now() - active.updatedAt > MAX_AGE_MS || !localStorage.getItem(DRAFT_PREFIX + active.entrenoId)) {
      clearLiveDraft(active.entrenoId);
      return null;
    }
    return active;
  } catch {
    return null;
  }
}

export function clearLiveDraft(entrenoId: string) {
  try {
    localStorage.removeItem(DRAFT_PREFIX + entrenoId);
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (raw && (JSON.parse(raw) as LiveActive).entrenoId === entrenoId) {
      localStorage.removeItem(ACTIVE_KEY);
    }
  } catch { /* ignore */ }
  notify();
}
