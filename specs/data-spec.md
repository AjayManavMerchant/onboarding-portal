# Data Spec — Employee Onboarding & Internal Movement Portal (MVP 1.0)

**Source:** `docs/vision.md` §2, §3, §8, §9, §10
**Related:** [`goal-spec.md`](./goal-spec.md) · [`frontend-spec.md`](./frontend-spec.md)

All data lives in the browser. There is no server. This spec defines what the stored state looks like, how statuses work, which rules every write must follow, and the exact seed data.

---

## 1. Storage

| Key | Contents |
|---|---|
| `onboarding-portal:state:v1` | The whole `AppState` object (§3) as JSON. |
| `onboarding-portal:session:v1` | `{ "currentUserId": string \| null }`. Kept separate so "switch user" never changes app data. |

Rules:
- **Load:** on first client render, read the key. If it is missing, cannot be parsed, or has a different `schemaVersion`, write a fresh copy of the seed and use that.
- **Save:** write the whole state after every change. Saves happen right away. There is no "Save" button.
- **Reset demo data:** replace the state with a **deep copy** of the seed and clear the session (`currentUserId = null`). Then go to `/`.
- **SSR:** `localStorage` is only read inside client components after mount. Pages show a short loading state until the data has loaded. This avoids hydration mismatches.
- All reads and writes go through one store module (`src/lib/store.ts`). Components never touch `localStorage` directly.
- Dates are stored as ISO strings (`"2026-10-18"` for dates, full ISO for timestamps).

## 2. Entity overview

```
Team 1 ──── 1 User(Manager)
Team 1 ──── * Requirement (scope = TEAM)
Requirement (scope = BASIC) ── shared by all employees

Registration 1 ── 0..1 User(Employee)       (User is created on HR approval)
User(Employee) 1 ── * TeamRequest           (NEW_JOINER or INTERNAL_MOVEMENT)
User(Employee) 1 ── * TeamAssignment        (team history; at most one open)
User(Employee) * ── * Requirement  via  Completion
```

## 3. Types

Written as TypeScript for precision. These are the contract for `src/lib/types.ts`.

```ts
type Role = "HR" | "MANAGER" | "EMPLOYEE";

interface Team {
  id: "team-a" | "team-b" | "team-c";
  name: string;            // "Team A"
  department: string;      // "Engineering"
  managerId: string;       // User.id of the manager
}

interface User {
  id: string;              // seeded: "u-priya"; new joiners: "u-" + registration id lower-case, e.g. "u-reg-001"
  name: string;
  email: string;
  role: Role;
  employeeId?: string;     // optional, from registration
  department?: string;     // optional, from registration
  dateOfJoining?: string;  // ISO date
  registrationId?: string; // set for new joiners only
  isExistingEmployee: boolean; // true for Rahul. Only changes the welcome copy.
}

type RequirementScope = "BASIC" | "TEAM";
type RequirementKind  = "ACCESS" | "TRAINING";

interface Requirement {
  id: string;              // e.g. "basic-acc-1", "team-a-trn-2"
  scope: RequirementScope;
  kind: RequirementKind;
  teamId?: Team["id"];     // required when scope = TEAM
  name: string;
  link: string;            // procedure link (ACCESS) or training link (TRAINING)
  order: number;           // for S.No.
}

type RegistrationStatus = "PENDING_HR_APPROVAL" | "APPROVED" | "REJECTED";

interface Registration {
  id: string;              // "REG-001"
  fullName: string;
  email: string;           // stored trimmed and lower-case
  employeeId?: string;
  department?: string;
  dateOfJoining: string;   // ISO date
  status: RegistrationStatus;
  submittedAt: string;
  decidedAt?: string;
  decidedBy?: string;      // HR User.id
  hrComment?: string;
  userId?: string;         // set on approval
}

type TeamRequestType   = "NEW_JOINER" | "INTERNAL_MOVEMENT";
type TeamRequestStatus = "PENDING_MANAGER_APPROVAL" | "APPROVED" | "REJECTED";

interface TeamRequest {
  id: string;              // "TEAM-001" (NEW_JOINER) or "MOVE-001" (INTERNAL_MOVEMENT)
  type: TeamRequestType;
  employeeId: string;      // User.id
  fromTeamId?: Team["id"]; // INTERNAL_MOVEMENT only: team at the time of submission
  toTeamId: Team["id"];
  managerId: string;       // copied from Team.managerId at submit time (auto-filled)
  employeeComment?: string;
  status: TeamRequestStatus;
  submittedAt: string;
  decidedAt?: string;
  managerComment?: string;
}

interface TeamAssignment {
  employeeId: string;
  teamId: Team["id"];
  startDate: string;       // ISO date
  endDate?: string;        // missing = current team
  viaRequestId?: string;   // TeamRequest that caused it; missing for seed
}

interface Completion {
  employeeId: string;
  requirementId: string;
  completedAt: string;
}

interface Counters { REG: number; TEAM: number; MOVE: number }

interface AppState {
  schemaVersion: 1;
  teams: Team[];
  users: User[];
  requirements: Requirement[];
  registrations: Registration[];
  teamRequests: TeamRequest[];
  teamAssignments: TeamAssignment[];
  completions: Completion[];
  counters: Counters;      // last number used per prefix
}
```

**Not stored:** overall onboarding status, progress counts, a user's "current team", locked or unlocked flags. These are always **derived** (§5). This keeps vision rule 9.7 true.

## 4. Statuses

### 4.1 Registration status

| Stored value | Display label | Set by |
|---|---|---|
| `PENDING_HR_APPROVAL` | Pending HR Approval | Registration submit |
| `APPROVED` | Approved | HR Approve |
| `REJECTED` | Rejected | HR Reject |

Allowed changes: `PENDING_HR_APPROVAL → APPROVED` and `PENDING_HR_APPROVAL → REJECTED`. Approved and Rejected are final.

### 4.2 Team request status

| Value | Display label | Notes |
|---|---|---|
| *(no request)* | Not Started | Derived: the employee has no pending or approved request for the current journey. Never stored. |
| `PENDING_MANAGER_APPROVAL` | Pending Manager Approval | |
| `APPROVED` | Approved | Final |
| `REJECTED` | Rejected | Final. The employee can submit a **new** request with a new ID. |

### 4.3 Requirement item status

Derived per (employee, requirement): **Completed** if a `Completion` row exists, otherwise **Not Completed**.

### 4.4 Overall onboarding status (derived, never stored)

Values and display labels, in order:

1. `REGISTRATION_PENDING` — Registration Pending
2. `BASIC_IN_PROGRESS` — Basic Onboarding In Progress
3. `AWAITING_TEAM_SELECTION` — Awaiting Team Selection
4. `PENDING_TEAM_APPROVAL` — Pending Team Approval
5. `TEAM_ONBOARDING_IN_PROGRESS` — Team-Specific Onboarding In Progress
6. `COMPLETED` — Completed

## 5. Derived values (pure functions in `src/lib/domain.ts`)

All of these take `AppState` and return a value. They never write. Unit tests cover them.

| Function | Definition |
|---|---|
| `currentTeamId(s, empId)` | `teamId` of the assignment for `empId` with no `endDate`, otherwise `undefined`. |
| `teamHistory(s, empId)` | All assignments for `empId`, newest first. |
| `basicRequirements(s)` | Requirements with `scope = BASIC`, sorted by `kind` then `order`. |
| `teamRequirements(s, teamId)` | Requirements with `scope = TEAM` and that `teamId`. |
| `isCompleted(s, empId, reqId)` | A matching `Completion` exists. |
| `progress(s, empId, reqs)` | `{ total, completed, pending }` for the list given. |
| `basicComplete(s, empId)` | Every basic requirement is completed. |
| `pendingTeamRequest(s, empId)` | The employee's request with status `PENDING_MANAGER_APPROVAL`, if any. At most one (BR11). |
| `latestTeamRequest(s, empId)` | The most recent request by `submittedAt`. Used to show a rejection comment. |
| `overallStatus(s, empId)` | See below. |
| `registrationOverallStatus(reg)` | `REGISTRATION_PENDING` when the registration is pending. Used on the HR dashboard. |

**`overallStatus` algorithm** (first rule that matches wins):

```
1. user has registrationId and that registration is not APPROVED  → REGISTRATION_PENDING
2. NOT basicComplete                                               → BASIC_IN_PROGRESS
3. pendingTeamRequest exists                                       → PENDING_TEAM_APPROVAL
4. currentTeamId is undefined                                      → AWAITING_TEAM_SELECTION
5. any requirement of currentTeamId is not completed               → TEAM_ONBOARDING_IN_PROGRESS
6. otherwise                                                       → COMPLETED
```

Notes:
- Rule 3 comes before rule 4. A new joiner with a pending request shows *Pending Team Approval*. One whose request was rejected (no pending, no team) goes back to *Awaiting Team Selection*.
- For Rahul during a pending move, rule 3 gives *Pending Team Approval*, even though his current team is still Team A (see open question Q4).
- After a move is approved, rule 5 looks only at the **new** team's items. Old team completions are kept but do not count.

## 6. Business rules

Every rule is checked inside the store action that performs the write, not only in the UI. If a check fails, the action throws a `DomainError` with a user-facing message. The UI shows that message.

| # | Rule | Enforced in | Vision ref |
|---|---|---|---|
| BR1 | Only users with role `EMPLOYEE` whose registration is `APPROVED` (or who have no registration, like Rahul) appear in the login dropdown as employees. Pending and rejected registrants cannot log in. | `loginableUsers()` | §9.1 |
| BR2 | A NEW_JOINER team request can be submitted only if `basicComplete` is true. | `submitTeamRequest` | §9.2 |
| BR3 | Team checklists are shown only for `currentTeamId`. If there is no current team, no team checklists are shown. Items of other teams are never shown or toggleable. | `toggleCompletion`, employee page | §9.3 |
| BR4 | `TeamRequest.managerId` is always set from `Team.managerId` of `toTeamId`. The form has no free manager field. | `submitTeamRequest` / `submitMoveRequest` | §9.4 |
| BR5 | Submitting a MOVE request does **not** change `teamAssignments`. Only manager approval does. | `submitMoveRequest`, `decideTeamRequest` | §9.5 |
| BR6 | A manager can see and decide only requests where `toTeamId` is their team. Team Progress lists only employees whose `currentTeamId` is their team. | `managerPendingRequests`, `managerTeamProgress`, `decideTeamRequest` | §9.6 |
| BR7 | Overall status is never stored. It is always `overallStatus()`. | types | §9.7 |
| BR8 | Checklist items show the note "Completion is self-confirmed by you and is not verified by any external system." | UI | §9.8 |
| BR9 | Only HR can decide registrations. Only `PENDING_HR_APPROVAL` registrations can be decided. | `decideRegistration` | §4.3, §7 |
| BR10 | HR approval creates the employee `User` only. It creates **no** team assignment and **no** team request. | `decideRegistration` | §7 |
| BR11 | An employee can have at most **one** pending team request at a time. The submit form is hidden while one is pending. | `submitTeamRequest` / `submitMoveRequest` | §4.7, §5.5 |
| BR12 | A MOVE request's `toTeamId` must differ from `currentTeamId`. The current team is left out of the dropdown. | `submitMoveRequest` | §5.3 |
| BR13 | A MOVE request needs a current team. A NEW_JOINER request needs **no** current team. Once a new joiner has a team, any later change is a MOVE. | both submit actions | §5 |
| BR14 | On approval of a team request: (a) set status `APPROVED`, `decidedAt`, `managerComment`; (b) if there is an open assignment, set its `endDate` to today; (c) add a new assignment for `toTeamId` with `viaRequestId`. Steps (a)–(c) happen in one state update. | `decideTeamRequest` | §4.7, §5.5 |
| BR15 | On rejection: set status `REJECTED`, `decidedAt`, `managerComment`. Nothing else changes. | `decideTeamRequest` | §4.7, §5.5 |
| BR16 | Registration email must be a valid email. It must not match (case-insensitive) a registration that is `PENDING_HR_APPROVAL` or `APPROVED`, or any seeded user. Rejected emails may register again. | `submitRegistration` | — (data integrity) |
| BR17 | Required registration fields: Full Name (non-empty after trim), Official Email, Date of Joining (valid date). Employee ID and Department are optional. | `submitRegistration` | §4.2 |
| BR18 | Basic checklist items can be toggled only while the employee has **no** pending or approved NEW_JOINER request **and no current team**. After that they are read-only. This stops the unlock from being undone (and covers existing employees like Rahul, who never had a NEW_JOINER request). | `toggleCompletion`, `basicLocked()` | §4.5 (Q5, Q8) |
| BR19 | Team checklist items for the current team can be ticked and unticked freely. The status updates right away. | `toggleCompletion` | §4.8 |
| BR20 | IDs are `PREFIX-NNN`, zero-padded to 3 digits, from `counters`. Each prefix has its own counter. A counter never goes back down except on Reset. | `nextId()` | §4.2, §4.6, §5.4 |
| BR21 | Comments (HR, manager, employee) are optional, trimmed and at most 500 characters. An empty comment is stored as `undefined`. | all decide/submit actions | §4.3, §4.7 |

## 7. Store actions (the only way to change state)

| Action | Input | Effect |
|---|---|---|
| `submitRegistration` | form fields | BR16, BR17 → new `Registration` (pending), `counters.REG++`. Returns the ID. |
| `decideRegistration` | `regId, decision, comment?, actorId` | BR9 → update the registration; on approve, BR10 → create the `User`. |
| `toggleCompletion` | `empId, reqId, checked` | BR3, BR18, BR19 → add or remove a `Completion`. |
| `submitTeamRequest` | `empId, toTeamId` | BR2, BR4, BR11, BR13 → `TEAM-xxx`. |
| `submitMoveRequest` | `empId, toTeamId, comment?` | BR4, BR5, BR11, BR12, BR13 → `MOVE-xxx` with `fromTeamId`. |
| `decideTeamRequest` | `reqId, decision, comment?, actorId` | BR6 (the actor must be the request's manager) → BR14 / BR15. |
| `resetDemoData` | — | §1 Reset. |
| `setCurrentUser` / `logout` | `userId \| null` | Session key only. |

## 8. Seed data (`src/data/seed.ts`)

All links are placeholders on `https://example.com/...`. Date used for seed history: `2025-01-06`.

### 8.1 Teams

| id | name | department | managerId |
|---|---|---|---|
| `team-a` | Team A | Engineering | `u-mgr-a` |
| `team-b` | Team B | Data & Analytics | `u-mgr-b` |
| `team-c` | Team C | IT | `u-mgr-c` |

### 8.2 Users

| id | name | email | role | notes |
|---|---|---|---|---|
| `u-priya` | Priya (HR) | priya.hr@example.com | HR | |
| `u-mgr-a` | Manager A | manager.a@example.com | MANAGER | Team A |
| `u-mgr-b` | Manager B | manager.b@example.com | MANAGER | Team B |
| `u-mgr-c` | Manager C | manager.c@example.com | MANAGER | Team C |
| `u-rahul` | Rahul | rahul@example.com | EMPLOYEE | `employeeId: "EMP-1001"`, `department: "Engineering"`, `isExistingEmployee: true`, no `registrationId` |

### 8.3 Basic requirements (all employees)

| id | kind | order | name | link |
|---|---|---|---|---|
| `basic-acc-1` | ACCESS | 1 | Corporate Email & Calendar | https://example.com/procedures/email |
| `basic-acc-2` | ACCESS | 2 | VPN & Remote Access | https://example.com/procedures/vpn |
| `basic-acc-3` | ACCESS | 3 | HR Self-Service Portal | https://example.com/procedures/hr-portal |
| `basic-acc-4` | ACCESS | 4 | Laptop & Building Badge | https://example.com/procedures/laptop-badge |
| `basic-trn-1` | TRAINING | 1 | Code of Conduct | https://example.com/training/code-of-conduct |
| `basic-trn-2` | TRAINING | 2 | Information Security Awareness | https://example.com/training/infosec |
| `basic-trn-3` | TRAINING | 3 | Data Privacy & Protection | https://example.com/training/data-privacy |
| `basic-trn-4` | TRAINING | 4 | Workplace Health & Safety | https://example.com/training/health-safety |

### 8.4 Team requirements

**Team A — Engineering**

| id | kind | order | name | link |
|---|---|---|---|---|
| `team-a-acc-1` | ACCESS | 1 | Source Code Repository | https://example.com/procedures/team-a/repo |
| `team-a-acc-2` | ACCESS | 2 | CI/CD Pipeline | https://example.com/procedures/team-a/ci-cd |
| `team-a-acc-3` | ACCESS | 3 | Development Cloud Environment | https://example.com/procedures/team-a/dev-cloud |
| `team-a-trn-1` | TRAINING | 1 | Secure Coding Practices | https://example.com/training/team-a/secure-coding |
| `team-a-trn-2` | TRAINING | 2 | Code Review & Branching Workflow | https://example.com/training/team-a/code-review |
| `team-a-trn-3` | TRAINING | 3 | Production Support Basics | https://example.com/training/team-a/prod-support |

**Team B — Data & Analytics**

| id | kind | order | name | link |
|---|---|---|---|---|
| `team-b-acc-1` | ACCESS | 1 | Data Warehouse | https://example.com/procedures/team-b/warehouse |
| `team-b-acc-2` | ACCESS | 2 | BI & Dashboard Tool | https://example.com/procedures/team-b/bi-tool |
| `team-b-acc-3` | ACCESS | 3 | Data Catalog | https://example.com/procedures/team-b/catalog |
| `team-b-trn-1` | TRAINING | 1 | Data Governance Fundamentals | https://example.com/training/team-b/governance |
| `team-b-trn-2` | TRAINING | 2 | SQL for Analytics | https://example.com/training/team-b/sql |
| `team-b-trn-3` | TRAINING | 3 | Handling Personal Data (PII) | https://example.com/training/team-b/pii |

**Team C — IT**

| id | kind | order | name | link |
|---|---|---|---|---|
| `team-c-acc-1` | ACCESS | 1 | IT Service Desk Ticketing | https://example.com/procedures/team-c/ticketing |
| `team-c-acc-2` | ACCESS | 2 | Device Management Console | https://example.com/procedures/team-c/device-mgmt |
| `team-c-acc-3` | ACCESS | 3 | Asset Inventory System | https://example.com/procedures/team-c/assets |
| `team-c-trn-1` | TRAINING | 1 | Incident Management Process | https://example.com/training/team-c/incident |
| `team-c-trn-2` | TRAINING | 2 | Endpoint Security | https://example.com/training/team-c/endpoint |
| `team-c-trn-3` | TRAINING | 3 | Change Management | https://example.com/training/team-c/change |

### 8.5 Starting state

- `registrations: []`, `teamRequests: []`
- `teamAssignments: [{ employeeId: "u-rahul", teamId: "team-a", startDate: "2025-01-06" }]`
- `completions`: Rahul has all 8 basic items **and** all 6 Team A items completed (`completedAt: "2025-01-31T09:00:00.000Z"`). His overall status starts as `COMPLETED` (Q3).
- `counters: { REG: 0, TEAM: 0, MOVE: 0 }`, so the first IDs are `REG-001`, `TEAM-001`, `MOVE-001`.

### 8.6 Expected state checks after seed (for tests)

- `loginableUsers()` returns 5 users: Priya, Managers A–C, Rahul.
- `overallStatus(u-rahul) = COMPLETED`, `currentTeamId(u-rahul) = team-a`.
- Manager A's Team Progress has 1 row: Rahul — Access 3/3, Training 3/3, Completed.
- Managers B and C have 0 rows and 0 pending approvals.
- HR pending count = 0.
