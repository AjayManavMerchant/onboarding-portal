# Implementation Plan — MVP 1.0 (one day)

**Specs:** [`goal-spec.md`](./goal-spec.md) · [`data-spec.md`](./data-spec.md) · [`frontend-spec.md`](./frontend-spec.md)

How we work: each phase ends with a **demo-able, deployable** app, a commit, and a check against the acceptance criteria (AC) listed for it. Domain logic (`src/lib/domain.ts` and store actions) is written as pure functions with a few Vitest tests, because that is where the business rules live. UI is checked by hand against the demo scripts in goal-spec §8.

We deploy to Vercel at the **end of Phase 1** (not only in Phase 5). That way deployment problems show up early and every later push redeploys automatically.

Time estimates assume ~8 focused hours.

---

## Phase 1 — Setup, seed data, demo login, registration, HR approval (~2.5 h)

**Tasks**
1. `create-next-app` with TypeScript, Tailwind, App Router, ESLint, `src/` dir. Add Vitest.
2. `src/lib/types.ts`: all types from data-spec §3.
3. `src/data/seed.ts`: all seed data from data-spec §8. Export a `createSeedState()` that returns a deep copy.
4. `src/lib/store.ts`: load/save/reset with a versioned key; `StoreProvider` context; session key (data-spec §1).
5. `src/lib/domain.ts`: `nextId`, `loginableUsers`, `overallStatus` (full algorithm now, so later phases only use it), progress helpers.
6. Actions: `submitRegistration` (BR16, BR17, BR20), `decideRegistration` (BR9, BR10, BR21).
7. UI: layout, `AppHeader` (switch user, reset), demo-mode bar, `Banner`, `StatusBadge`, `DecisionControls`.
8. Pages: Home, `/register`, `/register/status`, `/login` (with `?flow`), `/hr`, plus a placeholder `/employee` showing the welcome banner. Route guards.
9. Tests: seed checks (data-spec §8.6), ID format, duplicate email, approve creates a user without a team, reject keeps the comment.
10. `git init` commit, push to GitHub, connect to Vercel, **first deploy**.

**Done when:** AC1, AC2, AC3, AC10 pass; the app is live on a Vercel URL (early AC11).

## Phase 2 — Basic checklists, progress, team selection unlock (~1.5 h)

**Tasks**
1. `ChecklistTable`, `ProgressSummary` components.
2. `toggleCompletion` action (BR3, BR18, BR19).
3. `/employee`: header strip, approval banner, self-confirmation note, both basic tables with progress, congratulations banner.
4. "Select Team and Manager" section in its **locked** and **unlocked** states. `TeamSelect` with the manager auto-filled (submit is wired in Phase 3).
5. Tests: progress counts; `basicComplete`; status moves from `BASIC_IN_PROGRESS` to `AWAITING_TEAM_SELECTION`.

**Done when:** AC4, AC5 pass; ticks survive a refresh and switching users.

## Phase 3 — Team request, manager approval, team checklists, manager dashboard (~2 h)

**Tasks**
1. Actions: `submitTeamRequest` (BR2, BR4, BR11, BR13), `decideTeamRequest` (BR6, BR14, BR15).
2. `/employee`: pending, rejected-then-resubmit and approved states of the team section; team-specific tables for the **current team only**; completed banner; basic items read-only (BR18).
3. `/manager`: Section A (pending approvals, scoped), Section B (team progress, scoped), empty states.
4. Tests: wrong manager cannot decide; approval creates an assignment; rejection allows resubmit with a new ID; the full status sequence ends at `COMPLETED`; manager progress counts.

**Done when:** AC6, AC7, AC9 pass; Script A (goal-spec §8) runs end to end.

## Phase 4 — Internal movement (~1 h)

**Tasks**
1. `submitMoveRequest` (BR4, BR5, BR11, BR12, BR13). `decideTeamRequest` already closes the old assignment (BR14).
2. `/movement`: welcome message, read-only current team, form without the current team, pending banner, rejection banner + resubmit, team history, new team checklists (or link to `/employee`).
3. `/login?flow=internal-movement` filter; manager dashboard shows "Internal Movement" type and "From" team.
4. Tests: current team unchanged while pending; changed after approval; history keeps Team A; Manager A no longer sees Rahul in progress.

**Done when:** AC8 passes; Script B runs end to end.

## Phase 5 — README, polish, final deploy (~1 h)

**Tasks**
1. Mobile-width pass (375px) on every page; fix overflow and spacing.
2. Run both demo scripts on the **deployed** URL; fix anything that breaks.
3. Screenshots in `docs/screenshots/` (Home, Registration confirmation, HR dashboard, Employee locked/unlocked, Team checklists, Manager dashboard, Internal movement pending/approved).
4. `README.md`: summary, live link, demo steps for both journeys, tech stack, spec-driven development process (vision → specs → phased plan → build), project structure, limitations (single browser), future work (vision §11).
5. Final push → Vercel production deploy. Check that the public URL loads in a private window.

**Done when:** AC1–AC11 all pass on the public URL; the repo contains code, `docs/vision.md`, `specs/`, the README and the screenshots.

---

## Cut list (if we run out of time, drop these in this order)

1. HR "All" tab and summary tiles beyond the pending count
2. Manager "Recent decisions" panel
3. Checklists on `/movement` (link to `/employee` instead)
4. Stacked mobile cards for tables (keep horizontal scroll)
5. Vitest tests beyond `overallStatus` and the scoping rules

Never cut: anything an AC depends on, the "Reset demo data" button, or the Vercel deploy.

## Risks

| Risk | Mitigation |
|---|---|
| Hydration mismatch from reading `localStorage` | Read only after mount; loading placeholder (data-spec §1). |
| Old saved state breaks after a schema change | Versioned key; a version mismatch reseeds automatically. |
| Vercel build fails late in the day | First deploy in Phase 1; every push redeploys. |
| Data looks "lost" to a reviewer using a different browser | Demo-mode notice; README explains single-browser storage. |
