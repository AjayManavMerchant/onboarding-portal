import { beforeEach, describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { STATE_KEY, loadState, store } from "./store";

// Minimal in-memory localStorage for the node test environment.
const mem = new Map<string, string>();
globalThis.localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
  clear: () => mem.clear(),
  key: () => null,
  get length() {
    return mem.size;
  },
} as Storage;

beforeEach(() => mem.clear());

describe("store persistence (data-spec §1)", () => {
  it("seeds when storage is empty, corrupt, or a different schema version", () => {
    expect(loadState()).toEqual(createSeedState());
    mem.set(STATE_KEY, "{not json");
    expect(loadState()).toEqual(createSeedState());
    mem.set(STATE_KEY, JSON.stringify({ ...createSeedState(), schemaVersion: 0 }));
    expect(loadState()).toEqual(createSeedState());
  });

  it("saves every action right away, and reset restores the seed and clears the session (AC10)", () => {
    store.setCurrentUser("u-priya");
    const id = store.submitRegistration({ fullName: "Asha", email: "asha@example.com", dateOfJoining: "2026-11-02" });
    store.decideRegistration(id, "APPROVE", "", "u-priya");
    expect(JSON.parse(mem.get(STATE_KEY)!).users).toHaveLength(6);

    store.resetDemoData();
    expect(JSON.parse(mem.get(STATE_KEY)!)).toEqual(createSeedState());
    expect(JSON.parse(mem.get("onboarding-portal:session:v1")!)).toEqual({ currentUserId: null });
  });
});
