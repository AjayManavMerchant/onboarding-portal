import { describe, expect, it } from "vitest";
import { createSeedState } from "@/data/seed";
import { decideRegistration, submitRegistration, type RegistrationInput } from "./actions";
import { DomainError, currentTeamId, loginableUsers, overallStatus } from "./domain";

const asha: RegistrationInput = {
  fullName: "  Asha Rao ",
  email: " Asha.Rao@Example.com ",
  employeeId: "",
  department: "Data",
  dateOfJoining: "2026-11-02",
};

function registered() {
  return submitRegistration(createSeedState(), asha);
}

function fieldErrors(fn: () => unknown): Record<string, string> {
  try {
    fn();
  } catch (e) {
    if (e instanceof DomainError) return e.fieldErrors;
    throw e;
  }
  throw new Error("expected DomainError");
}

describe("submitRegistration", () => {
  it("creates REG-001 pending, normalised, and bumps the counter", () => {
    const { state, id } = registered();
    expect(id).toBe("REG-001");
    expect(state.counters.REG).toBe(1);
    expect(state.registrations[0]).toMatchObject({
      id: "REG-001",
      fullName: "Asha Rao",
      email: "asha.rao@example.com",
      employeeId: undefined,
      department: "Data",
      status: "PENDING_HR_APPROVAL",
    });
    expect(submitRegistration(state, { ...asha, email: "b@example.com" }).id).toBe("REG-002");
  });

  it("does not mutate the input state", () => {
    const s = createSeedState();
    submitRegistration(s, asha);
    expect(s.registrations).toHaveLength(0);
    expect(s.counters.REG).toBe(0);
  });

  it("requires name, valid email and date of joining (BR17)", () => {
    const errors = fieldErrors(() =>
      submitRegistration(createSeedState(), { fullName: "  ", email: "nope", dateOfJoining: "" }),
    );
    expect(errors).toEqual({
      fullName: "Please enter your full name.",
      email: "Please enter a valid email address.",
      dateOfJoining: "Please select your date of joining.",
    });
  });

  it("rejects duplicate emails, case-insensitively, against pending/approved registrations and users (BR16)", () => {
    const { state } = registered();
    const dup = "A registration with this email already exists.";
    expect(fieldErrors(() => submitRegistration(state, { ...asha, email: "ASHA.RAO@example.com" })).email).toBe(dup);
    expect(fieldErrors(() => submitRegistration(state, { ...asha, email: "Rahul@Example.com" })).email).toBe(dup);
  });

  it("lets a rejected email register again", () => {
    const { state } = registered();
    const rejected = decideRegistration(state, { regId: "REG-001", decision: "REJECT", actorId: "u-priya" });
    expect(submitRegistration(rejected, asha).id).toBe("REG-002");
  });
});

describe("decideRegistration", () => {
  it("approval creates an employee user with no team and no team request (BR10)", () => {
    const { state } = registered();
    const next = decideRegistration(state, { regId: "REG-001", decision: "APPROVE", comment: "  ", actorId: "u-priya" });
    const reg = next.registrations[0];
    expect(reg).toMatchObject({ status: "APPROVED", decidedBy: "u-priya", userId: "u-reg-001", hrComment: undefined });
    expect(reg.decidedAt).toBeDefined();

    const user = next.users.find((u) => u.id === "u-reg-001");
    expect(user).toMatchObject({ name: "Asha Rao", role: "EMPLOYEE", registrationId: "REG-001", isExistingEmployee: false });
    expect(loginableUsers(next).map((u) => u.id)).toContain("u-reg-001");
    expect(currentTeamId(next, "u-reg-001")).toBeUndefined();
    expect(next.teamRequests).toHaveLength(0);
    expect(next.teamAssignments).toEqual(state.teamAssignments);
    expect(overallStatus(next, "u-reg-001")).toBe("BASIC_IN_PROGRESS");
  });

  it("rejection keeps the trimmed HR comment and creates no user", () => {
    const { state } = registered();
    const next = decideRegistration(state, {
      regId: "REG-001",
      decision: "REJECT",
      comment: "  Wrong department. ",
      actorId: "u-priya",
    });
    expect(next.registrations[0]).toMatchObject({ status: "REJECTED", hrComment: "Wrong department." });
    expect(next.users).toHaveLength(5);
    expect(loginableUsers(next)).toHaveLength(5);
  });

  it("only HR can decide, only pending registrations, comments ≤ 500 chars (BR9, BR21)", () => {
    const { state } = registered();
    expect(() => decideRegistration(state, { regId: "REG-001", decision: "APPROVE", actorId: "u-mgr-a" })).toThrow(
      "Only HR can decide registrations.",
    );
    expect(() =>
      decideRegistration(state, { regId: "REG-001", decision: "APPROVE", comment: "x".repeat(501), actorId: "u-priya" }),
    ).toThrow(DomainError);
    const decided = decideRegistration(state, { regId: "REG-001", decision: "APPROVE", actorId: "u-priya" });
    expect(() => decideRegistration(decided, { regId: "REG-001", decision: "REJECT", actorId: "u-priya" })).toThrow(
      "already been decided",
    );
  });
});
