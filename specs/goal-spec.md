# Goal Spec — Employee Onboarding & Internal Movement Portal (MVP 1.0)

**Source:** `docs/vision.md` (MVP 1.0)
**Status:** Approved — all open questions decided (2026-10-18)
**Related specs:** [`data-spec.md`](./data-spec.md) · [`frontend-spec.md`](./frontend-spec.md) · [`implementation-plan.md`](./implementation-plan.md) · [`open-questions.md`](./open-questions.md)

---

## 1. Problem

New joiners and employees moving teams have no single place that tells them what to complete, in what order, and who must approve them. HR and managers have no simple view of who is waiting on them and how far each person has got.

## 2. Product goal

Build a **single-browser demo prototype** in one day, deployed publicly on Vercel. It shows two complete journeys from start to finish:

- **Journey A — New Joiner:** register → HR approval → basic onboarding → choose team → manager approval → team onboarding → **Completed**.
- **Journey B — Internal Movement:** existing employee requests a new team → new manager approval → new team onboarding → **Completed**.

The prototype is meant to be **demonstrated**, not used in production. A reviewer must be able to run both journeys alone in one browser by switching between demo users.

## 3. Users and roles

| Role | Seeded users | What they do in the MVP |
|---|---|---|
| **HR** | Priya | Approve or reject new joiner registrations. Activates the account only. Does not assign teams. |
| **Manager** | Manager A (Team A, Engineering), Manager B (Team B, Data & Analytics), Manager C (Team C, IT) | Approve or reject team requests for **their own team only**. Track progress of **their own team only**. |
| **Employee (existing)** | Rahul (Team A, basic onboarding done) | Runs the internal movement journey. |
| **Employee (new joiner)** | Created through registration | Runs the new joiner journey after HR approval. |
| **Visitor (not logged in)** | — | Sees the Home page, can register, can pick a demo user, can reset demo data. |

## 4. Goals (in scope)

| # | Goal | Vision ref |
|---|---|---|
| G1 | Demo login: pick a seeded or approved user from a dropdown. No passwords. | §2 |
| G2 | New joiner registration that creates a `REG-xxx` request with status `Pending HR Approval`. | §4.2 |
| G3 | HR dashboard: list registrations, count pending, approve or reject with an optional comment. | §4.3, §7 |
| G4 | Basic onboarding checklists (4 accesses + 4 trainings) with progress summary that persists. | §4.4 |
| G5 | Team selection unlocks only after all basic items are complete. Manager is auto-filled. | §4.5–4.6 |
| G6 | Team request (`TEAM-xxx`) → manager approves or rejects → team checklists appear. | §4.6–4.8 |
| G7 | Internal movement request (`MOVE-xxx`). Current team does not change until approval. Team history is kept. | §5 |
| G8 | Manager dashboard: pending approvals and team progress, scoped to own team. | §6 |
| G9 | Overall onboarding status that is always calculated, never stored or set by hand. | §8 |
| G10 | "Reset demo data" restores the seed state. | §2 |
| G11 | Responsive, clean UI (desktop and mobile width). | §10 |
| G12 | Public Vercel deployment from GitHub, with README and screenshots. | §10, §13 |

## 5. Non-goals (explicitly out of scope)

Taken from vision §11. Do **not** build:

- Real authentication, SSO or passwords
- Real email or push notifications (banners on dashboards only)
- A "Request additional information" status
- An admin or configuration page (seed data lives in one code file)
- A database, API routes or multi-user server storage
- Audit logs, overdue tracking or analytics
- Integration with real access-management or training systems
- AI features

Also not in scope (implied by MVP):
- Editing or withdrawing a submitted registration or team request
- Adding new teams, managers or HR users
- Internationalisation, dark mode, email templates

## 6. Constraints

- **Time:** one developer, one day, deployed today.
- **Stack:** Next.js (App Router) + TypeScript + Tailwind CSS.
- **Storage:** browser `localStorage` only. Data is per browser. Two browsers do not share data. This is expected.
- **Seed data:** one file in the code (`src/data/seed.ts`).
- **Hosting:** Vercel, deployed from a GitHub repository.
- **Trust model:** checklist completion is **employee-confirmed**. Nothing is verified by an external system, and the UI must say so.

## 7. Success criteria (acceptance)

The MVP is done when **all** of these pass in a manual demo on the deployed Vercel URL. They map 1:1 to vision §12.

| # | Acceptance criterion | Covered by |
|---|---|---|
| AC1 | A new joiner can register and sees the confirmation message with a request ID. | G2 · FE `/register` |
| AC2 | HR sees the request and can approve it; the new joiner then appears in the login dropdown. | G1, G3 |
| AC3 | A rejected registration shows the HR comment. | G3 · FE `/register/status` + HR dashboard |
| AC4 | Basic checklist progress persists after page refresh. | G4 · Data §7 |
| AC5 | Team selection stays locked until all basic items are completed. | G5 · rule BR2 |
| AC6 | The selected team's manager (and no other manager) sees the team request. | G6, G8 · rule BR6 |
| AC7 | After approval, only the approved team's requirements are shown. | G6 · rule BR3 |
| AC8 | Internal movement: Rahul's current team is unchanged while pending, and changes only after approval. | G7 · rule BR5 |
| AC9 | Manager progress table shows correct counts for their team only. | G8 · rule BR6 |
| AC10 | "Reset demo data" restores the initial state. | G10 |
| AC11 | The app is live on a public Vercel URL. | G12 |

## 8. Demo scripts (what the reviewer will do)

**Script A — New Joiner**
1. Home → **New Joiner** → fill the form → submit → see `REG-001` confirmation.
2. Login as **Priya (HR)** → approve `REG-001`.
3. Login as the new joiner → see the approval banner → tick all 8 basic items → see the congratulations banner and the unlocked team section.
4. Select **Team B** → see Manager B auto-filled → submit → `TEAM-001` pending.
5. Login as **Manager A** → confirm `TEAM-001` is **not** visible. Login as **Manager B** → approve.
6. Login as the new joiner → see Team B checklists only → tick all 6 → overall status `Completed`.
7. Login as **Manager B** → Team Progress shows the new joiner as 3/3, 3/3, Completed.

**Script B — Internal Movement**
1. Home → **Internal Movement** → login as **Rahul** → see the welcome message, Current Team = Team A.
2. Choose **Team C** (Manager C auto-filled), add a comment → submit → `MOVE-001` pending. Current Team still shows Team A.
3. Login as **Manager C** → reject with a comment. Login as Rahul → see the comment and resubmit → `MOVE-002`.
4. Login as **Manager C** → approve. Login as Rahul → Current Team = Team C, Team A shown in history, Team C checklists shown.
5. Complete Team C items → `Completed`. Manager C's progress table shows Rahul. Manager A's no longer does.

**Reset:** click **Reset demo data** → everything above is gone and the seed state is back.

## 9. Assumptions

All of these are decided; see `open-questions.md`.

- **Decided (Q1):** a rejected new joiner checks the result on a public **"Check registration status"** page linked from Home, by entering their request ID. No login needed.
- **Decided (Q2):** Internal Movement can be used by **any active employee who has a current team**. Rahul is the only one at seed time.
- **Decided (Q3):** Rahul's Team A checklist is seeded as **fully complete**, so his starting overall status is `Completed`.
- **Decided (Q4):** during a pending team or movement request, the employee's overall status is `Pending Team Approval`.
- **Decided (Q5):** basic checklist items become **read-only** once a team request has been submitted. This stops the unlock rule from being undone.
