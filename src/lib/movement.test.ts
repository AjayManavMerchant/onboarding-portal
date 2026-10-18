import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { decideTeamRequest, submitMoveRequest, submitTeamRequest, toggleCompletion } from "./actions";
import {
  currentTeamId,
  latestTeamRequest,
  loginableUsers,
  managerPendingRequests,
  managerTeamProgress,
  overallStatus,
  teamHistory,
  teamRequirements,
} from "./domain";
import { tickAll } from "./test-helpers";

const RAHUL = "u-rahul";

function moveToC(comment = "Interested in IT ops") {
  return submitMoveRequest(createSeedState(), { empId: RAHUL, toTeamId: "team-c", comment });
}

describe("submitMoveRequest", () => {
  it("creates MOVE-001 with fromTeamId, manager from the team, and no assignment change (BR4, BR5, AC8)", () => {
    const seed = createSeedState();
    const { state, id } = moveToC("  Interested in IT ops ");
    expect(id).toBe("MOVE-001");
    expect(state.teamRequests[0]).toMatchObject({
      type: "INTERNAL_MOVEMENT",
      fromTeamId: "team-a",
      toTeamId: "team-c",
      managerId: "u-mgr-c",
      employeeComment: "Interested in IT ops",
    });
    expect(state.teamAssignments).toEqual(seed.teamAssignments);
    expect(currentTeamId(state, RAHUL)).toBe("team-a");
    // Q4: pending status, and Manager A still sees him until approval.
    expect(overallStatus(state, RAHUL)).toBe("PENDING_TEAM_APPROVAL");
    expect(managerTeamProgress(state, "u-mgr-a").map((r) => r.employee.id)).toEqual([RAHUL]);
    expect(managerPendingRequests(state, "u-mgr-c").map((r) => r.id)).toEqual(["MOVE-001"]);
    expect(managerPendingRequests(state, "u-mgr-a")).toEqual([]);
  });

  it("rejects moving to the current team (BR12), a second pending request (BR11), and employees without a team (BR13)", () => {
    expect(() => submitMoveRequest(createSeedState(), { empId: RAHUL, toTeamId: "team-a" })).toThrow("other than");
    const { state } = moveToC();
    expect(() => submitMoveRequest(state, { empId: RAHUL, toTeamId: "team-b" })).toThrow("pending request (MOVE-001)");
    expect(() => submitMoveRequest(createSeedState(), { empId: "u-priya", toTeamId: "team-b" })).toThrow();
  });

  it("has its own counter, independent of TEAM and REG", () => {
    expect(moveToC().state.counters).toEqual({ REG: 0, TEAM: 0, MOVE: 1 });
  });
});

describe("journey B end to end", () => {
  it("reject → resubmit → approve → complete Team C (AC8)", () => {
    let s = moveToC().state;
    expect(() => decideTeamRequest(s, { reqId: "MOVE-001", decision: "APPROVE", actorId: "u-mgr-a" })).toThrow("Only the manager");

    s = decideTeamRequest(s, { reqId: "MOVE-001", decision: "REJECT", comment: "No headcount", actorId: "u-mgr-c" });
    expect(currentTeamId(s, RAHUL)).toBe("team-a");
    expect(overallStatus(s, RAHUL)).toBe("COMPLETED");
    expect(latestTeamRequest(s, RAHUL, "INTERNAL_MOVEMENT")).toMatchObject({ status: "REJECTED", managerComment: "No headcount" });

    const resubmit = submitMoveRequest(s, { empId: RAHUL, toTeamId: "team-c" });
    expect(resubmit.id).toBe("MOVE-002");
    s = decideTeamRequest(resubmit.state, {
      reqId: "MOVE-002",
      decision: "APPROVE",
      actorId: "u-mgr-c",
    }, new Date("2026-10-18T16:00:00.000Z"));

    expect(currentTeamId(s, RAHUL)).toBe("team-c");
    expect(teamHistory(s, RAHUL)).toEqual([
      { employeeId: RAHUL, teamId: "team-c", startDate: "2026-10-18", viaRequestId: "MOVE-002" },
      { employeeId: RAHUL, teamId: "team-a", startDate: "2025-01-06", endDate: "2026-10-18" },
    ]);
    // Old Team A completions are kept but no longer count; Team A items are now out of reach.
    expect(s.completions.some((c) => c.requirementId === "team-a-acc-1")).toBe(true);
    expect(overallStatus(s, RAHUL)).toBe("TEAM_ONBOARDING_IN_PROGRESS");
    expect(() => toggleCompletion(s, { empId: RAHUL, reqId: "team-a-acc-1", checked: false })).toThrow("current team");

    expect(managerTeamProgress(s, "u-mgr-a")).toEqual([]);
    expect(managerTeamProgress(s, "u-mgr-c")[0]).toMatchObject({
      access: { total: 3, completed: 0, pending: 3 },
      training: { total: 3, completed: 0, pending: 3 },
    });

    s = tickAll(s, RAHUL, teamRequirements(s, "team-c"));
    expect(overallStatus(s, RAHUL)).toBe("COMPLETED");
    expect(managerTeamProgress(s, "u-mgr-c")[0].status).toBe("COMPLETED");
  });

  it("lists only employees with a current team for the movement login (Q2)", () => {
    const seed = createSeedState();
    const movable = loginableUsers(seed).filter((u) => u.role === "EMPLOYEE" && currentTeamId(seed, u.id));
    expect(movable.map((u) => u.id)).toEqual([RAHUL]);
    // And a NEW_JOINER request is never accepted from someone who already has a team.
    expect(() => submitTeamRequest(seed, { empId: RAHUL, toTeamId: "team-b" })).toThrow();
  });
});
