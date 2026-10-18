// Seed data — see specs/data-spec.md §8. The only place demo data is defined.
import type { AppState, Requirement, RequirementKind, TeamId } from "@/lib/types";

export const SCHEMA_VERSION = 1 as const;

const SEED_DATE = "2025-01-06";
const SEED_COMPLETED_AT = "2025-01-31T09:00:00.000Z";
const E = "https://example.com";

function req(
  id: string,
  kind: RequirementKind,
  order: number,
  name: string,
  link: string,
  teamId?: TeamId,
): Requirement {
  return teamId
    ? { id, scope: "TEAM", kind, teamId, order, name, link }
    : { id, scope: "BASIC", kind, order, name, link };
}

const requirements: Requirement[] = [
  req("basic-acc-1", "ACCESS", 1, "Corporate Email & Calendar", `${E}/procedures/email`),
  req("basic-acc-2", "ACCESS", 2, "VPN & Remote Access", `${E}/procedures/vpn`),
  req("basic-acc-3", "ACCESS", 3, "HR Self-Service Portal", `${E}/procedures/hr-portal`),
  req("basic-acc-4", "ACCESS", 4, "Laptop & Building Badge", `${E}/procedures/laptop-badge`),
  req("basic-trn-1", "TRAINING", 1, "Code of Conduct", `${E}/training/code-of-conduct`),
  req("basic-trn-2", "TRAINING", 2, "Information Security Awareness", `${E}/training/infosec`),
  req("basic-trn-3", "TRAINING", 3, "Data Privacy & Protection", `${E}/training/data-privacy`),
  req("basic-trn-4", "TRAINING", 4, "Workplace Health & Safety", `${E}/training/health-safety`),

  req("team-a-acc-1", "ACCESS", 1, "Source Code Repository", `${E}/procedures/team-a/repo`, "team-a"),
  req("team-a-acc-2", "ACCESS", 2, "CI/CD Pipeline", `${E}/procedures/team-a/ci-cd`, "team-a"),
  req("team-a-acc-3", "ACCESS", 3, "Development Cloud Environment", `${E}/procedures/team-a/dev-cloud`, "team-a"),
  req("team-a-trn-1", "TRAINING", 1, "Secure Coding Practices", `${E}/training/team-a/secure-coding`, "team-a"),
  req("team-a-trn-2", "TRAINING", 2, "Code Review & Branching Workflow", `${E}/training/team-a/code-review`, "team-a"),
  req("team-a-trn-3", "TRAINING", 3, "Production Support Basics", `${E}/training/team-a/prod-support`, "team-a"),

  req("team-b-acc-1", "ACCESS", 1, "Data Warehouse", `${E}/procedures/team-b/warehouse`, "team-b"),
  req("team-b-acc-2", "ACCESS", 2, "BI & Dashboard Tool", `${E}/procedures/team-b/bi-tool`, "team-b"),
  req("team-b-acc-3", "ACCESS", 3, "Data Catalog", `${E}/procedures/team-b/catalog`, "team-b"),
  req("team-b-trn-1", "TRAINING", 1, "Data Governance Fundamentals", `${E}/training/team-b/governance`, "team-b"),
  req("team-b-trn-2", "TRAINING", 2, "SQL for Analytics", `${E}/training/team-b/sql`, "team-b"),
  req("team-b-trn-3", "TRAINING", 3, "Handling Personal Data (PII)", `${E}/training/team-b/pii`, "team-b"),

  req("team-c-acc-1", "ACCESS", 1, "IT Service Desk Ticketing", `${E}/procedures/team-c/ticketing`, "team-c"),
  req("team-c-acc-2", "ACCESS", 2, "Device Management Console", `${E}/procedures/team-c/device-mgmt`, "team-c"),
  req("team-c-acc-3", "ACCESS", 3, "Asset Inventory System", `${E}/procedures/team-c/assets`, "team-c"),
  req("team-c-trn-1", "TRAINING", 1, "Incident Management Process", `${E}/training/team-c/incident`, "team-c"),
  req("team-c-trn-2", "TRAINING", 2, "Endpoint Security", `${E}/training/team-c/endpoint`, "team-c"),
  req("team-c-trn-3", "TRAINING", 3, "Change Management", `${E}/training/team-c/change`, "team-c"),
];

const SEED: AppState = {
  schemaVersion: SCHEMA_VERSION,
  teams: [
    { id: "team-a", name: "Team A", department: "Engineering", managerId: "u-mgr-a" },
    { id: "team-b", name: "Team B", department: "Data & Analytics", managerId: "u-mgr-b" },
    { id: "team-c", name: "Team C", department: "IT", managerId: "u-mgr-c" },
  ],
  users: [
    { id: "u-priya", name: "Priya (HR)", email: "priya.hr@example.com", role: "HR", isExistingEmployee: true },
    { id: "u-mgr-a", name: "Manager A", email: "manager.a@example.com", role: "MANAGER", isExistingEmployee: true },
    { id: "u-mgr-b", name: "Manager B", email: "manager.b@example.com", role: "MANAGER", isExistingEmployee: true },
    { id: "u-mgr-c", name: "Manager C", email: "manager.c@example.com", role: "MANAGER", isExistingEmployee: true },
    {
      id: "u-rahul",
      name: "Rahul",
      email: "rahul@example.com",
      role: "EMPLOYEE",
      employeeId: "EMP-1001",
      department: "Engineering",
      isExistingEmployee: true,
    },
  ],
  requirements,
  registrations: [],
  teamRequests: [],
  teamAssignments: [{ employeeId: "u-rahul", teamId: "team-a", startDate: SEED_DATE }],
  // Rahul has finished basic + Team A onboarding (Q3), so he starts as Completed.
  completions: requirements
    .filter((r) => r.scope === "BASIC" || r.teamId === "team-a")
    .map((r) => ({ employeeId: "u-rahul", requirementId: r.id, completedAt: SEED_COMPLETED_AT })),
  counters: { REG: 0, TEAM: 0, MOVE: 0 },
};

/** Returns a fresh deep copy of the seed, so callers can never mutate it. */
export function createSeedState(): AppState {
  return structuredClone(SEED);
}
