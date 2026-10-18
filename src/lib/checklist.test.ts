import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { toggleCompletion } from "./actions";
import { basicComplete, basicLocked, basicRequirements, overallStatus, progress, teamRequirements } from "./domain";
import { JOINER, approvedJoiner, tickAll } from "./test-helpers";

describe("basic checklist progress", () => {
  it("counts total / completed / pending per section", () => {
    const s = approvedJoiner();
    const access = basicRequirements(s).filter((r) => r.kind === "ACCESS");
    expect(progress(s, JOINER, access)).toEqual({ total: 4, completed: 0, pending: 4 });
    const next = tickAll(s, JOINER, access.slice(0, 3));
    expect(progress(next, JOINER, access)).toEqual({ total: 4, completed: 3, pending: 1 });
  });

  it("sorts basic items accesses first, then trainings, by order", () => {
    expect(basicRequirements(createSeedState()).map((r) => r.id)).toEqual([
      "basic-acc-1", "basic-acc-2", "basic-acc-3", "basic-acc-4",
      "basic-trn-1", "basic-trn-2", "basic-trn-3", "basic-trn-4",
    ]);
  });

  it("moves BASIC_IN_PROGRESS → AWAITING_TEAM_SELECTION on the 8th tick (AC5 unlock)", () => {
    const basics = basicRequirements(approvedJoiner());
    const seven = tickAll(approvedJoiner(), JOINER, basics.slice(0, 7));
    expect(basicComplete(seven, JOINER)).toBe(false);
    expect(overallStatus(seven, JOINER)).toBe("BASIC_IN_PROGRESS");
    const eight = tickAll(seven, JOINER, basics.slice(7));
    expect(basicComplete(eight, JOINER)).toBe(true);
    expect(overallStatus(eight, JOINER)).toBe("AWAITING_TEAM_SELECTION");
  });
});

describe("toggleCompletion", () => {
  it("unticks, and ignores duplicate ticks (BR19)", () => {
    const s = tickAll(approvedJoiner(), JOINER, basicRequirements(approvedJoiner()).slice(0, 1));
    expect(toggleCompletion(s, { empId: JOINER, reqId: "basic-acc-1", checked: true })).toBe(s);
    const un = toggleCompletion(s, { empId: JOINER, reqId: "basic-acc-1", checked: false });
    expect(un.completions.filter((c) => c.employeeId === JOINER)).toHaveLength(0);
  });

  it("rejects items of a team the employee is not on (BR3)", () => {
    const s = approvedJoiner();
    expect(() => toggleCompletion(s, { empId: JOINER, reqId: "team-b-acc-1", checked: true })).toThrow(
      "current team",
    );
    expect(() => toggleCompletion(createSeedState(), { empId: "u-rahul", reqId: "team-c-acc-1", checked: true })).toThrow(
      "current team",
    );
  });

  it("lets Rahul untick and retick his current-team items (BR19)", () => {
    const s = toggleCompletion(createSeedState(), { empId: "u-rahul", reqId: "team-a-acc-1", checked: false });
    expect(overallStatus(s, "u-rahul")).toBe("TEAM_ONBOARDING_IN_PROGRESS");
    const back = tickAll(s, "u-rahul", teamRequirements(s, "team-a"));
    expect(overallStatus(back, "u-rahul")).toBe("COMPLETED");
  });

  it("locks basic items for an employee with a current team (BR18, Q8)", () => {
    const s = createSeedState();
    expect(basicLocked(s, "u-rahul")).toBe(true);
    expect(() => toggleCompletion(s, { empId: "u-rahul", reqId: "basic-acc-1", checked: false })).toThrow("locked");
    expect(basicLocked(approvedJoiner(), JOINER)).toBe(false);
  });

  it("only works for employees", () => {
    expect(() => toggleCompletion(createSeedState(), { empId: "u-priya", reqId: "basic-acc-1", checked: true })).toThrow();
  });
});
