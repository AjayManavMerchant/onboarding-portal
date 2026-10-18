// Data contract — see specs/data-spec.md §3.

export type Role = "HR" | "MANAGER" | "EMPLOYEE";

export type TeamId = "team-a" | "team-b" | "team-c";

export interface Team {
  id: TeamId;
  name: string;
  department: string;
  managerId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  employeeId?: string;
  department?: string;
  dateOfJoining?: string;
  registrationId?: string;
  isExistingEmployee: boolean;
}

export type RequirementScope = "BASIC" | "TEAM";
export type RequirementKind = "ACCESS" | "TRAINING";

export interface Requirement {
  id: string;
  scope: RequirementScope;
  kind: RequirementKind;
  teamId?: TeamId;
  name: string;
  link: string;
  order: number;
}

export type RegistrationStatus = "PENDING_HR_APPROVAL" | "APPROVED" | "REJECTED";

export interface Registration {
  id: string;
  fullName: string;
  email: string;
  employeeId?: string;
  department?: string;
  dateOfJoining: string;
  status: RegistrationStatus;
  submittedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  hrComment?: string;
  userId?: string;
}

export type TeamRequestType = "NEW_JOINER" | "INTERNAL_MOVEMENT";
export type TeamRequestStatus = "PENDING_MANAGER_APPROVAL" | "APPROVED" | "REJECTED";

export interface TeamRequest {
  id: string;
  type: TeamRequestType;
  employeeId: string;
  fromTeamId?: TeamId;
  toTeamId: TeamId;
  managerId: string;
  employeeComment?: string;
  status: TeamRequestStatus;
  submittedAt: string;
  decidedAt?: string;
  managerComment?: string;
}

export interface TeamAssignment {
  employeeId: string;
  teamId: TeamId;
  startDate: string;
  endDate?: string;
  viaRequestId?: string;
}

export interface Completion {
  employeeId: string;
  requirementId: string;
  completedAt: string;
}

export interface Counters {
  REG: number;
  TEAM: number;
  MOVE: number;
}

export interface AppState {
  schemaVersion: 1;
  teams: Team[];
  users: User[];
  requirements: Requirement[];
  registrations: Registration[];
  teamRequests: TeamRequest[];
  teamAssignments: TeamAssignment[];
  completions: Completion[];
  counters: Counters;
}

export type OverallStatus =
  | "REGISTRATION_PENDING"
  | "BASIC_IN_PROGRESS"
  | "AWAITING_TEAM_SELECTION"
  | "PENDING_TEAM_APPROVAL"
  | "TEAM_ONBOARDING_IN_PROGRESS"
  | "COMPLETED";

export type Decision = "APPROVE" | "REJECT";
