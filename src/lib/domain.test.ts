import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import {
  basicRequirements,
  currentTeamId,
  findRegistration,
  loginableUsers,
  managedTeam,
  nextId,
  overallStatus,
  progress,
  teamRequirements,
} from "./domain";

describe("seed state (data-spec §8.6)", () => {
  const s = createSeedState();

  it("has 5 loginable users: Priya, Managers A–C, Rahul", () => {
    expect(loginableUsers(s).map((u) => u.id)).toEqual(["u-priya", "u-mgr-a", "u-mgr-b", "u-mgr-c", "u-rahul"]);
  });

  it("has Rahul completed on Team A", () => {
    expect(currentTeamId(s, "u-rahul")).toBe("team-a");
    expect(overallStatus(s, "u-rahul")).toBe("COMPLETED");
  });

  it("gives Manager A one fully-complete team member", () => {
    const team = managedTeam(s, "u-mgr-a")!;
    const reqs = teamRequirements(s, team.id);
    expect(progress(s, "u-rahul", reqs.filter((r) => r.kind === "ACCESS"))).toEqual({ total: 3, completed: 3, pending: 0 });
    expect(progress(s, "u-rahul", reqs.filter((r) => r.kind === "TRAINING"))).toEqual({ total: 3, completed: 3, pending: 0 });
  });

  it("has 8 basic and 6 per-team requirements, no registrations, counters at zero", () => {
    expect(basicRequirements(s)).toHaveLength(8);
    expect(teamRequirements(s, "team-b")).toHaveLength(6);
    expect(s.registrations.filter((r) => r.status === "PENDING_HR_APPROVAL")).toHaveLength(0);
    expect(s.counters).toEqual({ REG: 0, TEAM: 0, MOVE: 0 });
  });

  it("returns an independent deep copy each time", () => {
    const a = createSeedState();
    a.users.push({ ...a.users[0], id: "x" });
    a.completions.length = 0;
    expect(createSeedState().users).toHaveLength(5);
    expect(createSeedState().completions).toHaveLength(14);
  });
});

describe("nextId (BR20)", () => {
  it("zero-pads to 3 digits with independent counters per prefix", () => {
    const first = nextId({ REG: 0, TEAM: 0, MOVE: 0 }, "REG");
    expect(first.id).toBe("REG-001");
    expect(nextId(first.counters, "REG").id).toBe("REG-002");
    expect(nextId(first.counters, "TEAM").id).toBe("TEAM-001");
    expect(nextId({ REG: 41, TEAM: 0, MOVE: 0 }, "REG").id).toBe("REG-042");
  });
});

describe("findRegistration", () => {
  it("ignores case and whitespace", () => {
    const s = createSeedState();
    s.registrations.push({
      id: "REG-001",
      fullName: "Asha Rao",
      email: "asha@example.com",
      dateOfJoining: "2026-11-02",
      status: "PENDING_HR_APPROVAL",
      submittedAt: "2026-10-18T10:00:00.000Z",
    });
    expect(findRegistration(s, " reg-001 ")?.id).toBe("REG-001");
    expect(findRegistration(s, "REG-002")).toBeUndefined();
    expect(findRegistration(s, "  ")).toBeUndefined();
  });
});
