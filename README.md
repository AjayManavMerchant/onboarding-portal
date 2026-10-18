# Employee Onboarding & Internal Movement Portal

**Live demo:** https://onboarding-portal-lake.vercel.app

A one-day MVP demo prototype for two employee journeys:

- **New Joiner** — register → HR approval → basic onboarding (accesses + trainings) → choose a team → manager approval → team-specific onboarding → **Completed**.
- **Internal Movement** — an existing employee requests a new team → the new team's manager approves → new team onboarding → **Completed**.

HR, managers and employees are demo users picked from a dropdown — no passwords. Everything runs in the browser, so one reviewer can play every role in a single browser window.

> **Demo prototype:** all data is stored in your browser's `localStorage`. Use **Reset demo data** in the header to return to the starting state at any time.

---

## Demo users

| User | Role | Notes |
|---|---|---|
| Priya (HR) | HR | Approves or rejects registrations. Activates accounts only — never assigns teams. |
| Manager A / B / C | Manager | Team A (Engineering), Team B (Data & Analytics), Team C (IT). Each sees only their own team's requests and progress. |
| Rahul | Employee | Existing employee on Team A, onboarding already complete. Used for Internal Movement. |
| New joiners | Employee | Created when HR approves a registration; then appear in the login dropdown as "(New joiner)". |

## Demo steps

Start with **Reset demo data** (header) so IDs begin at `REG-001`, `TEAM-001`, `MOVE-001`. Use **Switch user** to change roles.

### Journey A — New Joiner

1. Home → **Register**. Fill Full Name, Official Email and Date of Joining → **Submit registration**. The confirmation shows request ID **REG-001** and status *Pending HR Approval*.
2. *(Optional)* Home → **Check registration status** → enter `REG-001` to see its status without logging in.
3. Log in as **Priya (HR)** → approve **REG-001** (comment optional).
   *To see a rejection:* register a second person, reject it with a comment, then look it up on **Check registration status** — the HR comment is shown.
4. Log in as the new joiner (listed as "(New joiner)"). You see *"Your account has been approved. Welcome aboard!"* and a **locked** team section.
5. Tick all 4 basic accesses and 4 trainings. Progress survives a page refresh. When all 8 are done, the congratulations banner appears and team selection **unlocks**.
6. Choose **Team B** — Manager B is filled in automatically → **Submit team request** → **TEAM-001** is *Pending Manager Approval*. Basic items become read-only.
7. Log in as **Manager A**: no pending requests. Log in as **Manager B**: **TEAM-001** is listed → **Approve**.
8. Log in as the new joiner: only **Team B** checklists are shown. Tick all 6 → overall status **Completed**.
9. Log in as **Manager B**: *Team Progress* shows the new joiner with Access 3/3, Training 3/3, *Completed*.

### Journey B — Internal Movement

1. Home → **Start internal movement** → log in as **Rahul**. You see the welcome message and *Current Team: Team A*.
2. Choose **Team C** (Team A is not offered; Manager C is filled in), add a comment → **Submit movement request** → **MOVE-001** pending. The current team **stays Team A**.
3. Log in as **Manager C** → the request shows *Internal Movement, From Team A* and the comment → **Reject** with a comment.
4. Log in as **Rahul** → the rejection and manager comment are shown; current team is still Team A → resubmit → **MOVE-002**.
5. Log in as **Manager C** → **Approve**.
6. Log in as **Rahul** → Current Team is now **Team C**, team history shows Team A (ended) and Team C (current, via MOVE-002), and Team C checklists appear. Tick all 6 → **Completed**.
7. **Manager C**'s Team Progress now lists Rahul; **Manager A**'s no longer does.

### Reset

Click **Reset demo data** → confirm. All registrations, requests and progress are removed and the seed users and state are restored.

## Screenshots

All screenshots are in [`docs/screenshots/`](docs/screenshots/) and were taken on the live Vercel deployment.

| # | Screen | File |
|---|---|---|
| 1 | Home — New Joiner and Internal Movement entry points | [01-home.png](docs/screenshots/01-home.png) |
| 2 | Registration form | [02-registration_1.png](docs/screenshots/02-registration_1.png) |
| 2 | Registration confirmation — REG-001, Pending HR Approval | [02-registration_2.png](docs/screenshots/02-registration_2.png) |
| 3 | Demo login as Priya (HR) | [03-hr-dashboard_1.png](docs/screenshots/03-hr-dashboard_1.png) |
| 3 | HR dashboard — pending registration | [03-hr-dashboard_2.png](docs/screenshots/03-hr-dashboard_2.png) |
| 3 | HR dashboard — approve / reject controls | [03-hr-dashboard_3.png](docs/screenshots/03-hr-dashboard_3.png) |
| 3 | HR dashboard — REG-001 approved | [03-hr-dashboard_4.png](docs/screenshots/03-hr-dashboard_4.png) |
| 4 | Approved new joiner in the login dropdown | [04-employee-checklist_1.png](docs/screenshots/04-employee-checklist_1.png) |
| 4 | Employee dashboard — basic checklists, nothing completed | [04-employee-checklist_2.png](docs/screenshots/04-employee-checklist_2.png) |
| 4 | Basic onboarding complete — team selection unlocked, manager auto-filled | [04-employee-checklist_3.png](docs/screenshots/04-employee-checklist_3.png) |
| 4 | Team request TEAM-001 pending — basic items locked | [04-employee-checklist_4.png](docs/screenshots/04-employee-checklist_4.png) |
| 5 | Manager dashboard — pending approval and team progress | [05-manager-dashboard_1.png](docs/screenshots/05-manager-dashboard_1.png) |
| 5 | Manager dashboard — TEAM-001 approved, new joiner in team progress | [05-manager-dashboard_2.png](docs/screenshots/05-manager-dashboard_2.png) |
| 6 | New joiner after approval — team assigned, basics locked | [06-team-checklist_1.png](docs/screenshots/06-team-checklist_1.png) |
| 6 | Team-specific checklists for the approved team only | [06-team-checklist_2.png](docs/screenshots/06-team-checklist_2.png) |
| 7 | Existing employee (Rahul) — dashboard before internal movement | [07-internal-movement_1.png](docs/screenshots/07-internal-movement_1.png) |
| 7 | Existing employee (Rahul) — onboarding Completed, "Start internal movement" link | [07-internal-movement_2.png](docs/screenshots/07-internal-movement_2.png) |

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4**
- **Vitest** for unit tests of the domain rules
- **localStorage** for persistence — no backend, database or API routes
- Hosted on **Vercel**, auto-deployed from the `main` branch on **GitHub**

## How it was built — spec-driven development

The project went from idea to deployed app in one day through four explicit stages. Each stage's output is committed to the repo.

1. **Vision** — [`docs/vision.md`](docs/vision.md): the product brief — roles, both journeys, status model, business rules, acceptance criteria and out-of-scope list.
2. **Specs** — [`specs/`](specs/): the vision was turned into precise, reviewable specs before any code was written:
   - [`goal-spec.md`](specs/goal-spec.md) — goals, non-goals, constraints, acceptance criteria AC1–AC11 and the two demo scripts.
   - [`data-spec.md`](specs/data-spec.md) — TypeScript data model, status values, the derived overall-status algorithm, business rules BR1–BR21 and exact seed data.
   - [`frontend-spec.md`](specs/frontend-spec.md) — routes, route guards, every page section and its copy, shared components, responsiveness and accessibility.
   - [`open-questions.md`](specs/open-questions.md) — every ambiguity, with a default so work was never blocked, and the final decision (Q1–Q8).
3. **Phased plan** — [`implementation-plan.md`](specs/implementation-plan.md): five phases, each ending in a deployable, demo-able app checked against specific acceptance criteria, plus a cut list ordered by what to drop first if time ran short (nothing needed cutting).
4. **Build** — one commit per phase, each pushed to `main` and auto-deployed to Vercel (first deploy at the end of Phase 1 to surface hosting issues early):
   1. Setup, seed data, demo login, registration, HR approval
   2. Basic checklists, progress, team-selection unlock
   3. Team requests, manager approval, team checklists, manager dashboard
   4. Internal movement
   5. Mobile pass, README, final deploy

Business rules are enforced in pure store actions (`src/lib/actions.ts`), not only in the UI, and are covered by unit tests named after the rules and acceptance criteria they check. Overall onboarding status is never stored — it is always derived (`overallStatus()` in `src/lib/domain.ts`).

## Project structure

```
docs/vision.md            product vision (input)
specs/                    goal, data, frontend specs, implementation plan, open questions
src/
  app/                    pages: / · /register · /register/status · /login · /employee · /movement · /manager · /hr
  components/             AppHeader, Banner, StatusBadge, ChecklistTable, ChecklistSection,
                          ProgressSummary, DecisionControls, TeamSelect, RequireRole, Loading
  data/seed.ts            all demo data (teams, users, requirements, starting state)
  lib/
    types.ts              data model
    domain.ts             derived values (status, progress, scoping) — pure functions
    actions.ts            state changes with business-rule checks — pure functions
    store.ts              the only module that touches localStorage
    labels.ts             display labels and copy
    *.test.ts             Vitest unit tests
```

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # unit tests
npm run lint
npm run build
```

## Limitations

- **Single browser only.** Data lives in `localStorage`, so it is not shared between browsers, devices or people. A reviewer on another machine starts from the seed state.
- **No real authentication.** Anyone can pick any demo user; the login is a role switcher for demonstration.
- **Self-confirmed checklists.** Ticking an item is trusted; nothing is verified against real access or training systems (the UI says so).
- **No notifications.** Updates appear only as banners on dashboards.
- **Fixed configuration.** Teams, managers and checklist items come from `src/data/seed.ts`; there is no admin page.
- Submitted registrations and team requests cannot be edited or withdrawn.

## Future work

From the vision's out-of-scope list:

- Real authentication / corporate SSO
- Email notifications for submissions and decisions
- A "Request additional information" status for HR and managers
- An administrator page to configure teams, managers and checklist items
- A database and multi-user server storage
- Audit logs, overdue tracking and analytics
- Integration with real access-management and training systems
- AI features, such as an onboarding help assistant
