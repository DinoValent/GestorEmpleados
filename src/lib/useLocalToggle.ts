"use client";

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Map<string, Set<() => void>>();

function notify(key: string) {
  listeners.get(key)?.forEach((cb) => cb());
}

/** Preferencia booleana persistida en localStorage, reactiva entre componentes y pestañas. */
export function useLocalToggle(key: string, defaultValue: boolean) {
  const subscribe = useCallback(
    (cb: () => void) => {
      if (!listeners.has(key)) listeners.set(key, new Set());
      listeners.get(key)!.add(cb);
      window.addEventListener("storage", cb);
      return () => {
        listeners.get(key)?.delete(cb);
        window.removeEventListener("storage", cb);
      };
    },
    [key]
  );

  const getSnapshot = useCallback(() => {
    try {
      const v = localStorage.getItem(key);
      return v === null ? defaultValue : v === "1";
    } catch {
      return defaultValue;
    }
  }, [key, defaultValue]);

  const getServerSnapshot = useCallback(() => defaultValue, [defaultValue]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const set = useCallback(
    (next: boolean) => {
      try {
        localStorage.setItem(key, next ? "1" : "0");
      } catch {
        // localStorage no disponible: el cambio igual se propaga para esta sesión
      }
      notify(key);
    },
    [key]
  );

  return [value, set] as const;
}
