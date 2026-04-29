"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "adminMode";
const EVENT = "adminmode-change";

function readLocal(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Single source of truth for admin mode toggle.
 *
 * Default: false (everyone — admin included — enters in user mode).
 * Only flips to true when the admin explicitly pulls the "Panel de admin"
 * card. The hook re-reads localStorage on every storage / custom event,
 * so toggling from one component immediately updates every other
 * subscriber in the same tab (BottomNav, page contents, etc.).
 */
export function useAdminMode(): [boolean, (v: boolean) => void] {
  const [val, setVal] = useState<boolean>(false);

  useEffect(() => {
    setVal(readLocal());
    function handler() {
      setVal(readLocal());
    }
    window.addEventListener("storage", handler);
    window.addEventListener(EVENT, handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener(EVENT, handler);
    };
  }, []);

  const set = useCallback((v: boolean) => {
    try {
      localStorage.setItem(KEY, v ? "true" : "false");
    } catch {}
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(EVENT));
    }
  }, []);

  return [val, set];
}
