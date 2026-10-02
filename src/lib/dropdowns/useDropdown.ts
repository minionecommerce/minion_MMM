'use client';

import { useEffect, useSyncExternalStore } from 'react';

// Reads a managed dropdown's options for a form.
// - Falls back to the built-in list while loading or if the request fails, so a form never ends up empty by accident.
// - Shares one request per list across the whole page and keeps the answer for 30 seconds.
type Option = { id: string; label: string; isDefault: boolean };

const TTL_MS = 30_000;
const cache = new Map<string, { at: number; options: Option[] }>();
const inflight = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());

function load(key: string) {
  if (!key) return; // callers pass '' when a field is not a managed dropdown
  const hit = cache.get(key);
  if ((hit && Date.now() - hit.at < TTL_MS) || inflight.has(key)) return;
  const p = fetch(`/api/dropdowns/${encodeURIComponent(key)}`)
    .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((data: { options: Option[] }) => {
      cache.set(key, { at: Date.now(), options: data.options });
    })
    .catch(() => {
      /* keep the fallback */
    })
    .finally(() => {
      inflight.delete(key);
      notify();
    });
  inflight.set(key, p);
}

// Called by the admin screen after a change so forms pick the new list up straight away
export function refreshDropdown(key: string) {
  cache.delete(key);
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useDropdown(key: string, fallback: readonly string[]) {
  const entry = useSyncExternalStore(
    subscribe,
    () => cache.get(key),
    () => undefined,
  );
  useEffect(() => {
    load(key);
  }, [key, entry]);

  const options = entry ? entry.options.map(o => o.label) : [...fallback];
  const defaultValue = entry ? entry.options.find(o => o.isDefault)?.label : undefined;
  return { options, defaultValue, ready: !!entry };
}
