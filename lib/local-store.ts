"use client";

import { useSyncExternalStore } from "react";

/**
 * A tiny external store persisted to localStorage, for useSyncExternalStore.
 * Memory is the source of truth, so it keeps working when storage is
 * unavailable (private mode, quota). Syncs across tabs via the storage event.
 */
export function createLocalStore<T>(key: string, fallback: T, parse: (raw: unknown) => T) {
  let state = fallback;
  let loaded = false;
  const listeners = new Set<() => void>();

  const load = () => {
    if (loaded) return;
    loaded = true;
    try {
      const raw = localStorage.getItem(key);
      if (raw) state = parse(JSON.parse(raw));
    } catch {
      state = fallback;
    }
  };

  const emit = () => listeners.forEach((l) => l());

  const onStorage = (e: StorageEvent) => {
    if (e.key !== key) return;
    loaded = false;
    load();
    emit();
  };

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (listeners.size === 1) window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) window.removeEventListener("storage", onStorage);
      };
    },
    getSnapshot() {
      load();
      return state;
    },
    getServerSnapshot() {
      return fallback;
    },
    set(update: (prev: T) => T) {
      load();
      state = update(state);
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch {
        // Keep the in-memory value.
      }
      emit();
    },
  };
}

const noopSubscribe = () => () => {};

/** False during SSR and hydration, true once running on the client. */
export function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
