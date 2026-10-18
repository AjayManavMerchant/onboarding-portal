// Derived values — see specs/data-spec.md §5. Pure functions: they read state and never write.
import type {
  AppState,
  Counters,
  OverallStatus,
  Registration,
  Requirement,
  Team,
  TeamAssignment,
  TeamId,
  TeamRequest,
  User,
} from "./types";

export class DomainError extends Error {
  constructor(
    message: string,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "DomainError";
  }
}

/** BR20: `PREFIX-NNN` from the per-prefix counter. Returns the new ID and the bumped counters. */
export function nextId(counters: Counters, prefix: keyof Counters): { id: string; counters: Counters } {
  const n = counters[prefix] + 1;
  return { id: `${prefix}-${String(n).padStart(3, "0")}`, counters: { ...counters, [prefix]: n } };
}

export function userById(s: AppState, id: string | null | undefined): User | undefined {
  return id ? s.users.find((u) => u.id === id) : undefined;
}

export function teamById(s: AppState, id: TeamId | undefined): Team | undefined {
  return id ? s.teams.find((t) => t.id === id) : undefined;
}

export function managedTeam(s: AppState, managerId: string): Team | undefined {
  return s.teams.find((t) => t.managerId === managerId);
}

/** Matches a request ID ignoring case and whitespace, e.g. " reg-001 " → REG-001. */
export function findRegistration(s: AppState, rawId: string): Registration | undefined {
  const id = rawId.replace(/\s+/g, "").toUpperCase();
  return id ? s.registrations.find((r) => r.id === id) : undefined;
}

/** BR1: HR, managers, and employees whose registration is approved (or who never registered). */
export function loginableUsers(s: AppState): User[] {
  return s.users.filter((u) => {
    if (u.role !== "EMPLOYEE" || !u.registrationId) return true;
    return s.registrations.find((r) => r.id === u.registrationId)?.status === "APPROVED";
  });
}

export function currentTeamId(s: AppState, empId: string): TeamId | undefined {
  return s.teamAssignments.find((a) => a.employeeId === empId && !a.endDate)?.teamId;
}

export function teamHistory(s: AppState, empId: string): TeamAssignment[] {
  return s.teamAssignments
    .filter((a) => a.employeeId === empId)
    .sort((a, b) => b.startDate.localeCompare(a.startDate) || (a.endDate ? 1 : 0) - (b.endDate ? 1 : 0));
}

const byKindThenOrder = (a: Requirement, b: Requirement) =>
  a.kind.localeCompare(b.kind) || a.order - b.order;

export function basicRequirements(s: AppState): Requirement[] {
  return s.requirements.filter((r) => r.scope === "BASIC").sort(byKindThenOrder);
}

export function teamRequirements(s: AppState, teamId: TeamId): Requirement[] {
  return s.requirements.filter((r) => r.scope === "TEAM" && r.teamId === teamId).sort(byKindThenOrder);
}

export function isCompleted(s: AppState, empId: string, reqId: string): boolean {
  return s.completions.some((c) => c.employeeId === empId && c.requirementId === reqId);
}

export function progress(s: AppState, empId: string, reqs: Requirement[]) {
  const completed = reqs.filter((r) => isCompleted(s, empId, r.id)).length;
  return { total: reqs.length, completed, pending: reqs.length - completed };
}

export function basicComplete(s: AppState, empId: string): boolean {
  return progress(s, empId, basicRequirements(s)).pending === 0;
}

export function pendingTeamRequest(s: AppState, empId: string): TeamRequest | undefined {
  return s.teamRequests.find((r) => r.employeeId === empId && r.status === "PENDING_MANAGER_APPROVAL");
}

export function latestTeamRequest(s: AppState, empId: string): TeamRequest | undefined {
  return s.teamRequests
    .filter((r) => r.employeeId === empId)
    .reduce<TeamRequest | undefined>((latest, r) => (!latest || r.submittedAt >= latest.submittedAt ? r : latest), undefined);
}

/** BR7: overall status is always computed — data-spec §5 algorithm, first match wins. */
export function overallStatus(s: AppState, empId: string): OverallStatus {
  const user = userById(s, empId);
  if (user?.registrationId) {
    const reg = s.registrations.find((r) => r.id === user.registrationId);
    if (reg?.status !== "APPROVED") return "REGISTRATION_PENDING";
  }
  if (!basicComplete(s, empId)) return "BASIC_IN_PROGRESS";
  if (pendingTeamRequest(s, empId)) return "PENDING_TEAM_APPROVAL";
  const teamId = currentTeamId(s, empId);
  if (!teamId) return "AWAITING_TEAM_SELECTION";
  if (progress(s, empId, teamRequirements(s, teamId)).pending > 0) return "TEAM_ONBOARDING_IN_PROGRESS";
  return "COMPLETED";
}

export function registrationOverallStatus(reg: Registration): OverallStatus | undefined {
  return reg.status === "PENDING_HR_APPROVAL" ? "REGISTRATION_PENDING" : undefined;
}

/** BR18: basic items are read-only once a NEW_JOINER request is pending/approved, or the employee has a team (Q8). */
export function basicLocked(s: AppState, empId: string): boolean {
  return (
    currentTeamId(s, empId) !== undefined ||
    s.teamRequests.some((r) => r.employeeId === empId && r.type === "NEW_JOINER" && r.status !== "REJECTED")
  );
}

/** BR6: pending requests whose target team is this manager's team, oldest first. */
export function managerPendingRequests(s: AppState, managerId: string): TeamRequest[] {
  const team = managedTeam(s, managerId);
  if (!team) return [];
  return s.teamRequests
    .filter((r) => r.toTeamId === team.id && r.status === "PENDING_MANAGER_APPROVAL")
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
}

/** Last `limit` decided requests for this manager's team, newest first. */
export function managerRecentDecisions(s: AppState, managerId: string, limit = 5): TeamRequest[] {
  const team = managedTeam(s, managerId);
  if (!team) return [];
  return s.teamRequests
    .filter((r) => r.toTeamId === team.id && r.status !== "PENDING_MANAGER_APPROVAL")
    .sort((a, b) => (b.decidedAt ?? "").localeCompare(a.decidedAt ?? ""))
    .slice(0, limit);
}

export interface TeamProgressRow {
  employee: User;
  access: ReturnType<typeof progress>;
  training: ReturnType<typeof progress>;
  status: OverallStatus;
}

/** BR6, AC9: employees currently on this manager's team, with progress on this team's items only. */
export function managerTeamProgress(s: AppState, managerId: string): TeamProgressRow[] {
  const team = managedTeam(s, managerId);
  if (!team) return [];
  const reqs = teamRequirements(s, team.id);
  return s.users
    .filter((u) => u.role === "EMPLOYEE" && currentTeamId(s, u.id) === team.id)
    .map((u) => ({
      employee: u,
      access: progress(s, u.id, reqs.filter((r) => r.kind === "ACCESS")),
      training: progress(s, u.id, reqs.filter((r) => r.kind === "TRAINING")),
      status: overallStatus(s, u.id),
    }));
}
