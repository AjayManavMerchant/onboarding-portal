// Store actions — see specs/data-spec.md §6–7. Each takes the current state and returns a new one,
// or throws DomainError. Rules are enforced here, not only in the UI.
import { DomainError, basicLocked, currentTeamId, nextId, userById } from "./domain";
import type { AppState, Decision, Registration, User } from "./types";

const MAX_COMMENT = 500;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** BR21: trimmed, at most 500 characters, empty → undefined. */
export function normalizeComment(comment: string | undefined): string | undefined {
  const c = comment?.trim();
  if (!c) return undefined;
  if (c.length > MAX_COMMENT) throw new DomainError(`Comments can be at most ${MAX_COMMENT} characters.`);
  return c;
}

function isValidDate(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
}

export interface RegistrationInput {
  fullName: string;
  email: string;
  employeeId?: string;
  department?: string;
  dateOfJoining: string;
}

/** BR16, BR17: returns field → message for every problem; empty when valid. */
export function validateRegistration(s: AppState, input: RegistrationInput): Record<string, string> {
  const errors: Record<string, string> = {};
  const email = input.email.trim().toLowerCase();
  if (!input.fullName.trim()) errors.fullName = "Please enter your full name.";
  if (!EMAIL_RE.test(email)) {
    errors.email = "Please enter a valid email address.";
  } else if (
    s.users.some((u) => u.email.toLowerCase() === email) ||
    s.registrations.some((r) => r.email === email && r.status !== "REJECTED")
  ) {
    errors.email = "A registration with this email already exists.";
  }
  if (!isValidDate(input.dateOfJoining)) errors.dateOfJoining = "Please select your date of joining.";
  return errors;
}

export function submitRegistration(
  s: AppState,
  input: RegistrationInput,
  now = new Date(),
): { state: AppState; id: string } {
  const errors = validateRegistration(s, input);
  if (Object.keys(errors).length > 0) throw new DomainError(Object.values(errors)[0], errors);

  const { id, counters } = nextId(s.counters, "REG");
  const registration: Registration = {
    id,
    fullName: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    employeeId: input.employeeId?.trim() || undefined,
    department: input.department?.trim() || undefined,
    dateOfJoining: input.dateOfJoining,
    status: "PENDING_HR_APPROVAL",
    submittedAt: now.toISOString(),
  };
  return { state: { ...s, registrations: [...s.registrations, registration], counters }, id };
}

/** BR9, BR10, BR21: HR decides a pending registration. Approval creates the User only — no team, no request. */
export function decideRegistration(
  s: AppState,
  input: { regId: string; decision: Decision; comment?: string; actorId: string },
  now = new Date(),
): AppState {
  if (userById(s, input.actorId)?.role !== "HR") throw new DomainError("Only HR can decide registrations.");
  const reg = s.registrations.find((r) => r.id === input.regId);
  if (!reg) throw new DomainError(`Registration ${input.regId} was not found.`);
  if (reg.status !== "PENDING_HR_APPROVAL") throw new DomainError(`Registration ${reg.id} has already been decided.`);

  const approved = input.decision === "APPROVE";
  const userId = approved ? `u-${reg.id.toLowerCase()}` : undefined;
  const decided: Registration = {
    ...reg,
    status: approved ? "APPROVED" : "REJECTED",
    decidedAt: now.toISOString(),
    decidedBy: input.actorId,
    hrComment: normalizeComment(input.comment),
    userId,
  };
  const users: User[] = userId
    ? [
        ...s.users,
        {
          id: userId,
          name: reg.fullName,
          email: reg.email,
          role: "EMPLOYEE",
          employeeId: reg.employeeId,
          department: reg.department,
          dateOfJoining: reg.dateOfJoining,
          registrationId: reg.id,
          isExistingEmployee: false,
        },
      ]
    : s.users;

  return { ...s, users, registrations: s.registrations.map((r) => (r.id === reg.id ? decided : r)) };
}

/** BR3, BR18, BR19: tick or untick one checklist item for an employee. */
export function toggleCompletion(
  s: AppState,
  input: { empId: string; reqId: string; checked: boolean },
  now = new Date(),
): AppState {
  const { empId, reqId, checked } = input;
  if (userById(s, empId)?.role !== "EMPLOYEE") throw new DomainError("Only employees have checklists.");
  const req = s.requirements.find((r) => r.id === reqId);
  if (!req) throw new DomainError(`Checklist item ${reqId} was not found.`);
  if (req.scope === "BASIC" && basicLocked(s, empId)) {
    throw new DomainError("Basic items are locked because your team request has been submitted.");
  }
  if (req.scope === "TEAM" && req.teamId !== currentTeamId(s, empId)) {
    throw new DomainError("You can only update checklist items for your current team.");
  }

  const done = s.completions.some((c) => c.employeeId === empId && c.requirementId === reqId);
  if (checked === done) return s;
  const completions = checked
    ? [...s.completions, { employeeId: empId, requirementId: reqId, completedAt: now.toISOString() }]
    : s.completions.filter((c) => !(c.employeeId === empId && c.requirementId === reqId));
  return { ...s, completions };
}
