import { useEffect, useSyncExternalStore } from 'react';
import { getConnections } from '@/lib/api';
import type { ConnectionStatus } from '@/lib/types';

/**
 * Shared connection state.
 *
 * Both the sidebar (which tints the service marks by connection state) and
 * the connections panel read from here, so connecting a service updates the
 * sidebar immediately without either component knowing about the other.
 */

interface ConnectionsState {
  connections: ConnectionStatus[];
  /** False when the last fetch failed — the data below is stale or empty. */
  ok: boolean;
}

/** Backoff for a backend that is still coming up, in ms. */
const RETRY_DELAYS = [800, 2000, 5000, 10000];

let cache: ConnectionsState = { connections: [], ok: false };
let inflight: Promise<ConnectionsState> | null = null;
let retryTimer: number | null = null;
let retryAttempt = 0;
const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function getSnapshot(): ConnectionsState {
  return cache;
}

function cancelRetry() {
  if (retryTimer !== null) {
    window.clearTimeout(retryTimer);
    retryTimer = null;
  }
  retryAttempt = 0;
}

/** Re-fetch from the API and notify every subscriber. */
export async function refreshConnections(): Promise<ConnectionsState> {
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const data = await getConnections();
      cache = { connections: data.connections, ok: true };
      cancelRetry();
    } catch {
      // A cold backend must not blank out marks we already had, and it must
      // not count as "loaded" either — otherwise the sidebar stays grey until
      // something else happens to ask again.
      cache = { ...cache, ok: false };
      scheduleRetry();
    } finally {
      inflight = null;
    }
    listeners.forEach((notify) => notify());
    return cache;
  })();

  return inflight;
}

/** Keep trying while someone is watching: the API may just be booting. */
function scheduleRetry() {
  if (retryTimer !== null || listeners.size === 0) return;
  const delay = RETRY_DELAYS[Math.min(retryAttempt, RETRY_DELAYS.length - 1)];
  retryAttempt++;
  retryTimer = window.setTimeout(() => {
    retryTimer = null;
    if (listeners.size > 0) refreshConnections();
  }, delay);
}

/** Subscribe to the shared connection state. */
export function useConnections() {
  const state = useSyncExternalStore(subscribe, getSnapshot);

  useEffect(() => {
    if (!cache.ok) refreshConnections();
  }, []);

  return {
    connections: state.connections,
    ok: state.ok,
    refresh: refreshConnections,
  };
}
