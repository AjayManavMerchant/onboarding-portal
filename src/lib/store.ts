// The only module that touches localStorage — see specs/data-spec.md §1.
// State lives in a small external store; React reads it via useSyncExternalStore.
// The server snapshot is null, so pages render "Loading…" until the client has read storage.
import { useMemo, useSyncExternalStore } from "react";
import { SCHEMA_VERSION, createSeedState } from "@/data/seed";
import * as actions from "./actions";
import { userById } from "./domain";
import type { AppState, Decision, User } from "./types";

export const STATE_KEY = "onboarding-portal:state:v1";
export const SESSION_KEY = "onboarding-portal:session:v1";

interface Snapshot {
  state: AppState;
  currentUserId: string | null;
}

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode, quota): keep working in memory.
  }
}

/** Missing, unparsable or wrong-version state is replaced by a fresh seed. */
export function loadState(): AppState {
  const saved = readJson(STATE_KEY) as AppState | null;
  if (saved && saved.schemaVersion === SCHEMA_VERSION) return saved;
  const seed = createSeedState();
  writeJson(STATE_KEY, seed);
  return seed;
}

function loadSession(): string | null {
  const saved = readJson(SESSION_KEY) as { currentUserId?: unknown } | null;
  return typeof saved?.currentUserId === "string" ? saved.currentUserId : null;
}

let snapshot: Snapshot | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): Snapshot {
  snapshot ??= { state: loadState(), currentUserId: loadSession() };
  return snapshot;
}

function getServerSnapshot(): Snapshot | null {
  return null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep other tabs of the same browser in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STATE_KEY || e.key === SESSION_KEY || e.key === null) {
      snapshot = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function commit(next: Partial<Snapshot>) {
  const prev = getSnapshot();
  snapshot = { ...prev, ...next };
  if (next.state) writeJson(STATE_KEY, snapshot.state);
  if ("currentUserId" in next) writeJson(SESSION_KEY, { currentUserId: snapshot.currentUserId });
  listeners.forEach((l) => l());
}

/** Store actions. Each runs the pure action (which may throw DomainError) and saves right away. */
export const store = {
  submitRegistration(input: actions.RegistrationInput): string {
    const { state, id } = actions.submitRegistration(getSnapshot().state, input);
    commit({ state });
    return id;
  },
  decideRegistration(regId: string, decision: Decision, comment: string | undefined, actorId: string) {
    commit({ state: actions.decideRegistration(getSnapshot().state, { regId, decision, comment, actorId }) });
  },
  toggleCompletion(empId: string, reqId: string, checked: boolean) {
    commit({ state: actions.toggleCompletion(getSnapshot().state, { empId, reqId, checked }) });
  },
  setCurrentUser(userId: string | null) {
    commit({ currentUserId: userId });
  },
  logout() {
    commit({ currentUserId: null });
  },
  /** Deep copy of the seed, session cleared. The caller navigates to "/". */
  resetDemoData() {
    commit({ state: createSeedState(), currentUserId: null });
  },
};

export interface LoadedStore {
  state: AppState;
  currentUser: User | undefined;
}

/** Returns null until the client has loaded state from localStorage. */
export function useStore(): LoadedStore | null {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(
    () => (snap ? { state: snap.state, currentUser: userById(snap.state, snap.currentUserId) } : null),
    [snap],
  );
}
