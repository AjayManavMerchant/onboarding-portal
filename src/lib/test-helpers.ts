// Shared fixtures for unit tests.
import { createSeedState } from "@/data/seed";
import { decideRegistration, submitRegistration, toggleCompletion } from "./actions";
import type { AppState, Requirement } from "./types";

export const JOINER = "u-reg-001";

/** Seed + REG-001 (Asha) approved by HR → employee u-reg-001 with nothing ticked. */
export function approvedJoiner(): AppState {
  const { state } = submitRegistration(createSeedState(), {
    fullName: "Asha Rao",
    email: "asha@example.com",
    dateOfJoining: "2026-11-02",
  });
  return decideRegistration(state, { regId: "REG-001", decision: "APPROVE", actorId: "u-priya" });
}

export function tickAll(s: AppState, empId: string, reqs: Requirement[]): AppState {
  return reqs.reduce((acc, r) => toggleCompletion(acc, { empId, reqId: r.id, checked: true }), s);
}
