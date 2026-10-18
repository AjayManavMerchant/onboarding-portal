import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { decideTeamRequest, submitTeamRequest, toggleCompletion } from "./actions";
import {
  basicLocked,
  basicRequirements,
  currentTeamId,
  managerPendingRequests,
  managerTeamProgress,
  overallStatus,
  teamRequirements,
} from "./domain";
import { JOINER, approvedJoiner, tickAll } from "./test-helpers";
import type { AppState } from "./types";

function readyForTeam(): AppState {
  const s = approvedJoiner();
  return tickAll(s, JOINER, basicRequirements(s));
}

function requestTeamB() {
  return submitTeamRequest(readyForTeam(), { empId: JOINER, toTeamId: "team-b" });
}

describe("submitTeamRequest", () => {
  it("creates TEAM-001 pending with the manager taken from the team (BR4)", () => {
    const { state, id } = requestTeamB();
    expect(id).toBe("TEAM-001");
    expect(state.teamRequests[0]).toMatchObject({
      type: "NEW_JOINER",
      toTeamId: "team-b",
      managerId: "u-mgr-b",
      status: "PENDING_MANAGER_APPROVAL",
    });
    expect(overallStatus(state, JOINER)).toBe("PENDING_TEAM_APPROVAL");
    expect(currentTeamId(state, JOINER)).toBeUndefined();
  });

  it("is blocked until basic onboarding is complete (BR2, AC5)", () => {
    expect(() => submitTeamRequest(approvedJoiner(), { empId: JOINER, toTeamId: "team-b" })).toThrow("basic");
  });

  it("allows only one pending request (BR11)", () => {
    const { state } = requestTeamB();
    expect(() => submitTeamRequest(state, { empId: JOINER, toTeamId: "team-c" })).toThrow("pending request (TEAM-001)");
  });

  it("is not for employees who already have a team (BR13)", () => {
    expect(() => submitTeamRequest(createSeedState(), { empId: "u-rahul", toTeamId: "team-b" })).toThrow("internal movement");
  });

  it("locks basic items once submitted (BR18)", () => {
    const { state } = requestTeamB();
    expect(basicLocked(state, JOINER)).toBe(true);
    expect(() => toggleCompletion(state, { empId: JOINER, reqId: "basic-acc-1", checked: false })).toThrow("locked");
  });
});

describe("decideTeamRequest", () => {
  it("is visible to and decidable by the target team's manager only (BR6, AC6)", () => {
    const { state } = requestTeamB();
    expect(managerPendingRequests(state, "u-mgr-b").map((r) => r.id)).toEqual(["TEAM-001"]);
    expect(managerPendingRequests(state, "u-mgr-a")).toEqual([]);
    expect(managerPendingRequests(state, "u-mgr-c")).toEqual([]);
    for (const actorId of ["u-mgr-a", "u-mgr-c", "u-priya", JOINER]) {
      expect(() => decideTeamRequest(state, { reqId: "TEAM-001", decision: "APPROVE", actorId })).toThrow(
        "Only the manager",
      );
    }
  });

  it("approval sets status and creates the assignment in one update (BR14)", () => {
    const { state } = requestTeamB();
    const now = new Date("2026-10-18T15:00:00.000Z");
    const next = decideTeamRequest(state, { reqId: "TEAM-001", decision: "APPROVE", comment: " Welcome ", actorId: "u-mgr-b" }, now);
    expect(next.teamRequests[0]).toMatchObject({ status: "APPROVED", managerComment: "Welcome", decidedAt: now.toISOString() });
    expect(next.teamAssignments).toContainEqual({
      employeeId: JOINER,
      teamId: "team-b",
      startDate: "2026-10-18",
      viaRequestId: "TEAM-001",
    });
    expect(currentTeamId(next, JOINER)).toBe("team-b");
    expect(managerPendingRequests(next, "u-mgr-b")).toEqual([]);
    expect(() => decideTeamRequest(next, { reqId: "TEAM-001", decision: "REJECT", actorId: "u-mgr-b" })).toThrow("already");
  });

  it("rejection changes nothing else and allows a new request with a new ID (BR15)", () => {
    const { state } = requestTeamB();
    const rejected = decideTeamRequest(state, { reqId: "TEAM-001", decision: "REJECT", comment: "Full", actorId: "u-mgr-b" });
    expect(rejected.teamRequests[0]).toMatchObject({ status: "REJECTED", managerComment: "Full" });
    expect(rejected.teamAssignments).toEqual(state.teamAssignments);
    expect(overallStatus(rejected, JOINER)).toBe("AWAITING_TEAM_SELECTION");
    expect(submitTeamRequest(rejected, { empId: JOINER, toTeamId: "team-c" }).id).toBe("TEAM-002");
  });
});

describe("journey A end to end", () => {
  it("walks the full status sequence to COMPLETED, with Team B items only (AC7, AC9)", () => {
    let s = approvedJoiner();
    expect(overallStatus(s, JOINER)).toBe("BASIC_IN_PROGRESS");
    s = tickAll(s, JOINER, basicRequirements(s));
    expect(overallStatus(s, JOINER)).toBe("AWAITING_TEAM_SELECTION");
    s = submitTeamRequest(s, { empId: JOINER, toTeamId: "team-b" }).state;
    expect(overallStatus(s, JOINER)).toBe("PENDING_TEAM_APPROVAL");
    s = decideTeamRequest(s, { reqId: "TEAM-001", decision: "APPROVE", actorId: "u-mgr-b" });
    expect(overallStatus(s, JOINER)).toBe("TEAM_ONBOARDING_IN_PROGRESS");

    // Other teams' items stay out of reach (AC7).
    expect(() => toggleCompletion(s, { empId: JOINER, reqId: "team-a-acc-1", checked: true })).toThrow();

    const teamB = teamRequirements(s, "team-b");
    s = tickAll(s, JOINER, teamB.filter((r) => r.kind === "ACCESS"));
    expect(managerTeamProgress(s, "u-mgr-b")).toEqual([
      expect.objectContaining({
        access: { total: 3, completed: 3, pending: 0 },
        training: { total: 3, completed: 0, pending: 3 },
        status: "TEAM_ONBOARDING_IN_PROGRESS",
      }),
    ]);
    s = tickAll(s, JOINER, teamB.filter((r) => r.kind === "TRAINING"));
    expect(overallStatus(s, JOINER)).toBe("COMPLETED");

    expect(managerTeamProgress(s, "u-mgr-b").map((r) => [r.employee.id, r.status])).toEqual([[JOINER, "COMPLETED"]]);
    expect(managerTeamProgress(s, "u-mgr-a").map((r) => r.employee.id)).toEqual(["u-rahul"]);
    expect(managerTeamProgress(s, "u-mgr-c")).toEqual([]);
  });
});
