# Employee Onboarding & Internal Movement Portal — MVP

**Document Type:** MVP Vision (one-day build)
**Version:** MVP 1.0
**Constraint:** One developer, one day, deployed on Vercel from GitHub.

---

## 1. Objective

A web application where:
- **New joiners** register, get HR approval, complete basic onboarding (accesses + trainings), choose a team and manager, get manager approval, and complete team-specific onboarding.
- **Existing employees (Internal Movement)** request a move to a new team, get approval from the new manager, and complete the new team's onboarding.
- **Managers** approve team requests and track their team members' progress.
- **HR** approves new joiner registrations.

This MVP is a **single-browser demo prototype**. All data is stored in browser localStorage.

---

## 2. Roles and Demo Users

There is no real login. A **demo login page** lets the user pick a seeded user from a dropdown.

| Demo user | Role | Notes |
|---|---|---|
| Priya (HR) | HR | Approves new joiner registrations |
| Manager A | Manager | Manages Team A (Engineering) |
| Manager B | Manager | Manages Team B (Data & Analytics) |
| Manager C | Manager | Manages Team C (IT) |
| Rahul (existing employee) | Employee | Already in Team A, basic onboarding completed. Used for Internal Movement demo. |

New joiners appear in the login dropdown **after HR approves them**.

A **"Reset demo data"** button restores the seed data.

---

## 3. Seed Data (no admin page)

Stored in one seed data file in the code.

**Teams:**

| Team | Manager | Department |
|---|---|---|
| Team A | Manager A | Engineering |
| Team B | Manager B | Data & Analytics |
| Team C | Manager C | IT |

**Basic requirements (all new joiners):**
- 4 Basic Accesses (name + procedure link)
- 4 Mandatory Trainings (name + training link)

**Team-specific requirements:**
- Each team has 3 Team Accesses and 3 Team Trainings (different per team).

Links can be placeholder URLs.

---

## 4. Journey A — New Joiner

1. **Home page** shows two options: **New Joiner** and **Internal Movement**.
2. **Registration form:** Full Name, Official Email, Employee ID (optional), Department (optional), Date of Joining.
   - Submit creates a request with a unique ID (e.g. REG-001) and status `Pending HR Approval`.
   - Confirmation message: "Your registration request has been submitted successfully. Your account will be activated once HR approves your request."
3. **HR dashboard:** lists pending registrations. HR can **Approve** or **Reject** (with optional comment).
   - Approved → employee account active, appears in login dropdown.
   - Rejected → status `Rejected` with HR comment shown.
4. **Employee dashboard (after approval):** banner "Your account has been approved. Welcome aboard!"
   - **Mandatory Basic Accesses** table: S.No., Name, Procedure link, Completed checkbox.
   - **Mandatory Training** table: S.No., Name, Training link, Completed checkbox.
   - **Progress summary:** total / completed / pending for each section.
   - Checkbox state is saved and survives page refresh and switching users.
5. **Unlock rule:** when all basic items are completed, banner "Congratulations! You have completed your basic onboarding requirements." and the **Select Team and Manager** section unlocks.
6. **Team request:** employee selects a team (manager is auto-filled from the team, so mappings cannot be wrong) and submits.
   - Request ID (e.g. TEAM-001), status `Pending Manager Approval`.
7. **Manager approves or rejects** (with optional comment).
   - Approved → employee mapped to team; **Team-Specific Accesses** and **Team-Specific Training** tables appear.
   - Rejected → comment shown; employee can submit a new request.
8. When all team-specific items are completed → overall status `Completed`.

---

## 5. Journey B — Internal Movement

1. From Home, choose **Internal Movement** → demo login as an existing employee (Rahul).
2. Message: "Welcome! Please select your new team and reporting manager to begin your internal movement onboarding."
3. Form shows **Current Team** (read-only) and lets the employee select **New Team** (manager auto-filled) plus optional comment.
   - The new team cannot be the same as the current team.
4. Submit → request ID (e.g. MOVE-001), status `Pending Manager Approval`.
   - **The current team does not change while the request is pending.**
5. **New manager approves or rejects.**
   - Approved → employee moves to the new team; previous team history is kept; new team's checklists appear.
   - Rejected → comment shown; employee can submit again.
6. Employee completes the new team's checklists → status `Completed`.

---

## 6. Manager Dashboard

**Section A — Pending Approvals:** Request ID, Employee Name, Request Type (New Joiner / Internal Movement), Requested Team, Status, Approve / Reject buttons, comment box.
- A manager sees **only requests for their own team**.

**Section B — Team Progress:** Employee, Access progress (e.g. 2/3), Training progress (e.g. 1/3), Overall status.
- A manager sees **only employees in their own team**.

---

## 7. HR Dashboard

- List of new joiner registrations with status.
- Count of requests pending approval.
- Approve / Reject with optional comment.
- HR approval activates the account only; it does **not** approve the team assignment.

---

## 8. Status Model

**Registration:** Pending HR Approval → Approved / Rejected
**Team request:** Not Started → Pending Manager Approval → Approved / Rejected
**Requirement item:** Not Completed / Completed
**Overall onboarding status (calculated, never set manually):**
1. Registration Pending
2. Basic Onboarding In Progress
3. Awaiting Team Selection
4. Pending Team Approval
5. Team-Specific Onboarding In Progress
6. Completed

---

## 9. Business Rules

1. HR approval is required before a new joiner can log in.
2. Team selection unlocks only after all basic items are completed.
3. Team-specific items stay locked until the manager approves the team request.
4. Manager is auto-filled from the selected team.
5. Internal movement does not change the current team until approval.
6. Managers see only their own team's requests and employees.
7. Overall status is calculated from the underlying data.
8. Checkbox completion is **employee-confirmed** (not verified by any external system). The UI says so.

---

## 10. Technical Decisions

- Next.js + TypeScript + Tailwind CSS.
- No backend, no database: all data in browser **localStorage**.
- Seed data in a single file.
- Deployed on **Vercel** from a **GitHub** repository.
- Clean, simple, responsive UI (works on desktop and mobile width).

---

## 11. Out of Scope (Future Work)

- Real authentication / corporate SSO, passwords
- Real email notifications (MVP uses dashboard banners)
- "Request additional information" status
- Administrator configuration page
- Database and multi-user server storage
- Audit logs, overdue tracking, analytics
- Integration with real access-management or training systems
- AI features (e.g. onboarding help assistant)

---

## 12. Acceptance Criteria

1. A new joiner can register and sees the confirmation message with a request ID.
2. HR sees the request and can approve it; the new joiner then appears in the login dropdown.
3. A rejected registration shows the HR comment.
4. Basic checklist progress persists after page refresh.
5. Team selection stays locked until all basic items are completed.
6. The selected team's manager (and no other manager) sees the team request.
7. After approval, only the approved team's requirements are shown.
8. Internal movement: Rahul's current team is unchanged while pending, and changes only after approval.
9. Manager progress table shows correct counts for their team only.
10. "Reset demo data" restores the initial state.
11. The app is live on a public Vercel URL.

---

## 13. Submission Deliverables

- Public **Vercel** link
- **GitHub** repository containing code, `docs/vision.md` and `specs/`
- **README.md** with: project summary, demo steps for both journeys, tech stack, how it was built with spec-driven development, and future work
- Screenshots of key screens