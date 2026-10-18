# Frontend Spec — Employee Onboarding & Internal Movement Portal (MVP 1.0)

**Source:** `docs/vision.md` §2, §4–§7, §10
**Related:** [`goal-spec.md`](./goal-spec.md) · [`data-spec.md`](./data-spec.md)

---

## 1. Stack and structure

- Next.js (App Router), TypeScript (strict), Tailwind CSS. No UI library is needed. A few small shared components are enough.
- Every page that reads state is a **client component** (`"use client"`). Data comes from a `StoreProvider` React context that wraps `src/lib/store.ts` and re-renders on every change.
- Until the store has loaded from `localStorage`, pages show a small "Loading…" placeholder. This avoids hydration mismatch.
- No API routes and no server actions.

Suggested layout:

```
src/
  app/
    layout.tsx              # <StoreProvider>, <AppHeader>, container
    page.tsx                # Home
    register/page.tsx       # Registration form + confirmation
    register/status/page.tsx# Registration status lookup
    login/page.tsx          # Demo login (?flow=internal-movement)
    employee/page.tsx       # New joiner / employee dashboard
    movement/page.tsx       # Internal movement page
    manager/page.tsx        # Manager dashboard
    hr/page.tsx             # HR dashboard
  components/               # AppHeader, Banner, StatusBadge, ChecklistTable,
                            # ProgressSummary, DecisionControls, TeamSelect, EmptyState
  data/seed.ts
  lib/types.ts  store.ts  domain.ts  labels.ts
```

## 2. Global elements

### 2.1 App header (every page)
- Left: app name **"Onboarding Portal"**. Links to `/`.
- Right, when logged in: "Signed in as **{name}** · {Role label}", a **Switch user** button (logs out and goes to `/login`), and a **Reset demo data** button.
- Right, when logged out: a **Demo login** link and a **Reset demo data** button.
- On mobile: the items wrap under the app name. No hamburger menu is needed.

### 2.2 Reset demo data
- Asks with the browser's `confirm()`: "Reset all demo data? This removes all registrations, requests and progress and restores the original demo users."
- On OK: `resetDemoData()`, then go to `/`, then show a success banner "Demo data has been reset."

### 2.3 Demo-mode notice
A thin bar under the header on every page: "Demo prototype — data is stored only in this browser."

### 2.4 Route guards

| Route | Who can open it | Otherwise |
|---|---|---|
| `/`, `/register`, `/register/status`, `/login` | Anyone | — |
| `/employee`, `/movement` | Logged-in `EMPLOYEE` | redirect to `/login` |
| `/manager` | Logged-in `MANAGER` | redirect to `/login` |
| `/hr` | Logged-in `HR` | redirect to `/login` |

After login, go to: HR → `/hr`; Manager → `/manager`; Employee → `/employee`, **unless** `?flow=internal-movement`, then go to `/movement`.

### 2.5 Shared components

| Component | Purpose |
|---|---|
| `Banner` | Variants `success`, `info`, `warning`, `error`. Used for every message the vision calls a "banner" or "message". |
| `StatusBadge` | Coloured pill for registration, request and overall statuses. Labels come from `labels.ts`. Colours: pending = amber, approved/completed = green, rejected = red, in progress = blue, not started/awaiting = grey. |
| `ChecklistTable` | Columns: **S.No.**, **Name**, **{Procedure link \| Training link}**, **Completed**. Links open in a new tab (`target="_blank" rel="noopener noreferrer"`), with the text "Open procedure" or "Open training". The checkbox has an `aria-label` of the item name. It has a `readOnly` prop. |
| `ProgressSummary` | Per section: **Total**, **Completed**, **Pending**, plus a thin progress bar. |
| `DecisionControls` | A comment `<textarea>` (optional, max 500 characters) and **Approve** / **Reject** buttons. Shared by HR and manager. |
| `TeamSelect` | A team `<select>` showing "Team X — Department", and a read-only **Manager** field that fills in from the chosen team. An `excludeTeamId` prop hides one team. |

## 3. Pages

### 3.1 Home `/`
- Title: "Employee Onboarding & Internal Movement Portal".
- Two large cards side by side (stacked on mobile):
  - **New Joiner** — "Register, get HR approval and complete your onboarding." Buttons: **Register** → `/register`. Secondary link: **"Check registration status"** → `/register/status`. Secondary link: "Approved? Log in" → `/login`.
  - **Internal Movement** — "Moving to a new team? Request the move and complete the new team's onboarding." Button: **Start internal movement** → `/login?flow=internal-movement`.
- Below the cards: a small "Demo login for HR and managers" link → `/login`.

### 3.2 Registration `/register`
Fields:

| Label | Input | Required | Validation message |
|---|---|---|---|
| Full Name | text | yes | "Please enter your full name." |
| Official Email | email | yes | "Please enter a valid email address." / "A registration with this email already exists." (BR16) |
| Employee ID | text | no | — |
| Department | text | no | — |
| Date of Joining | date | yes | "Please select your date of joining." |

- Errors show inline under each field after submit.
- **Submit registration** button.
- On success the form is replaced by a success `Banner`:
  > **Your registration request has been submitted successfully. Your account will be activated once HR approves your request.**
  > Request ID: **REG-001** · Status: `Pending HR Approval`

  Links: "Check status" → `/register/status?id=REG-001`, "Back to home".

### 3.3 Check registration status `/register/status`
- Public page, no login needed. Linked from Home and from the registration confirmation.
- One input: "Request ID" (placeholder `REG-001`; matching ignores case and extra spaces), and a **Check status** button. It reads `?id=` from the URL and checks it straight away.
- Result card: Request ID, Name, Submitted date, `StatusBadge`.
  - Pending: info text "HR has not reviewed your request yet."
  - Approved: success text "Your account has been approved. You can now log in." plus a **Log in** button → `/login`.
  - Rejected: error banner "Your registration was rejected." plus **HR comment:** "{comment}" (or "No comment provided."). Also "You can submit a new registration." → `/register`. (Covers AC3.)
- Not found: "No registration found with that request ID."

### 3.4 Demo login `/login`
- Title: "Demo login". Subtitle: "No password needed — pick a demo user."
- A `<select>` with `<optgroup>`s: **HR**, **Managers**, **Employees**. It lists `loginableUsers()` (BR1). Each new joiner shows as "{Full name} (New joiner)".
- With `?flow=internal-movement`: the title becomes "Internal Movement — demo login", and only employees **with a current team** are listed (Rahul at seed time).
- **Log in** button (disabled until a user is chosen). Redirects as described in §2.4.
- Help text under the select: "New joiners appear here after HR approves their registration."

### 3.5 Employee dashboard `/employee`
Sections, top to bottom. Each one appears only when its condition is true.

1. **Header strip:** name, Current Team (or "Not assigned"), overall status `StatusBadge`.
2. **Approval banner** (success). Shown for new joiners, i.e. users with `registrationId`: "Your account has been approved. Welcome aboard!"
3. **Self-confirmation note** (info, small): "Completion is self-confirmed by you and is not verified by any external system." (BR8)
4. **Mandatory Basic Accesses** — `ChecklistTable` + `ProgressSummary`. Read-only once BR18 applies, with the note "Basic items are locked because your team request has been submitted."
5. **Mandatory Training** — `ChecklistTable` + `ProgressSummary`. Same lock rule.
6. **Basic complete banner** (success), when `basicComplete`: "Congratulations! You have completed your basic onboarding requirements."
7. **Select Team and Manager**:
   - **Locked** (not `basicComplete`): grey card with a lock icon. "Complete all basic accesses and trainings to unlock team selection ({n} items remaining)." (AC5)
   - **Unlocked, no team, no pending request:** `TeamSelect` + **Submit team request**. If the latest request was rejected, show a warning banner above it: "Your request {id} for {team} was rejected by {manager}." and "Manager comment: …".
   - **Pending:** info banner "Your request **{TEAM-001}** to join **{Team B}** is `Pending Manager Approval` with **{Manager B}**." The form is hidden (BR11).
   - **Approved (has a current team):** the section shows "Team: {Team B} · Manager: {Manager B}" with a success badge.
8. **Team-Specific Accesses** and **Team-Specific Training** — only when the employee has a current team (BR3). Heading: "Team-Specific Accesses — {Team B}". `ChecklistTable` + `ProgressSummary` for **current team items only** (AC7).
9. **Completed banner** (success), when overall = `COMPLETED`: "All onboarding requirements are complete. Your onboarding status is Completed."
10. **Internal movement link**, for employees with a current team: "Moving to another team? Start internal movement" → `/movement`.

### 3.6 Internal movement `/movement`
1. **Welcome message** (info): "Welcome! Please select your new team and reporting manager to begin your internal movement onboarding."
2. **Current Team** (read-only field): "{Team A} — {Engineering} · Manager: {Manager A}". This must keep showing the old team while a request is pending (AC8).
3. **Request form**, when there is no pending request:
   - `TeamSelect` with `excludeTeamId = currentTeamId` (BR12). Label: "New Team". The manager is filled in automatically.
   - **Comment (optional)** textarea.
   - **Submit movement request** button.
   - If the latest MOVE request was rejected, show a warning banner with the manager comment above the form.
4. **Pending** (replaces the form): info banner "Your request **{MOVE-001}** to move to **{Team C}** is `Pending Manager Approval` with **{Manager C}**. Your current team stays **{Team A}** until it is approved."
5. **Just approved**, when the latest MOVE was approved and the new team's items are not all done: success banner "Your move to {Team C} has been approved. Complete your new team's onboarding below."
6. **New team checklists:** after approval this page shows the current team's `ChecklistTable`s and `ProgressSummary`s, and the overall status badge. Uses the same components as `/employee`.
7. **Team history** table: Team, Department, From, To ("Current" if open), Via request (ID or "—").
8. Link: "Go to my dashboard" → `/employee`.

> Simple option if time is short: `/movement` can show items 1–4 and 7, and link to `/employee` for the checklists. The employee dashboard already shows current-team checklists.

### 3.7 Manager dashboard `/manager`
Title: "Manager Dashboard — {Team X} ({Department})".

**Section A — Pending Approvals** (BR6: `toTeamId` = my team, status pending).

| Request ID | Employee Name | Request Type | Requested Team | Status | Actions |
|---|---|---|---|---|---|
| TEAM-001 | Asha Rao | New Joiner | Team B | Pending Manager Approval | `DecisionControls` |

- For Internal Movement rows, a second line shows "From {Team A}" and the employee comment, if any.
- Empty state: "No pending requests for your team."
- After a decision, the row disappears and a banner appears: "{Request ID} approved." or "{Request ID} rejected."
- **Recent decisions** (collapsible, optional): the last 5 decided requests for this team, with status and comment.

**Section B — Team Progress** (BR6: `currentTeamId` = my team).

| Employee | Access progress | Training progress | Overall status |
|---|---|---|---|
| Rahul | 3/3 | 3/3 | Completed |

- Progress counts use **this team's** requirements only (AC9).
- Empty state: "No employees in your team yet."

### 3.8 HR dashboard `/hr`
- **Summary tiles:** Pending approval (count, highlighted), Approved, Rejected, Total.
- **Filter tabs:** Pending (default) · All.
- **Registrations table:**

| Request ID | Full Name | Official Email | Employee ID | Department | Date of Joining | Submitted | Status | Actions / Comment |
|---|---|---|---|---|---|---|---|---|

  - Pending rows show `DecisionControls`.
  - Decided rows show the status and the HR comment (or "—").
  - Empty state (Pending tab): "No registrations awaiting approval."
- Note under the title: "Approving a registration activates the employee's account only. Team assignment is approved by the selected team's manager."

## 4. Copy reference (`labels.ts`)

| Key | Text |
|---|---|
| Registration statuses | Pending HR Approval · Approved · Rejected |
| Team request statuses | Not Started · Pending Manager Approval · Approved · Rejected |
| Request types | New Joiner · Internal Movement |
| Overall statuses | Registration Pending · Basic Onboarding In Progress · Awaiting Team Selection · Pending Team Approval · Team-Specific Onboarding In Progress · Completed |
| Item statuses | Not Completed · Completed |
| Roles | HR · Manager · Employee |

Copy taken word for word from the vision (do not reword):
- "Your registration request has been submitted successfully. Your account will be activated once HR approves your request."
- "Your account has been approved. Welcome aboard!"
- "Congratulations! You have completed your basic onboarding requirements."
- "Welcome! Please select your new team and reporting manager to begin your internal movement onboarding."

## 5. Responsive and accessibility

- Mobile first. Content max width `max-w-5xl`, centred, with `px-4` padding.
- Tables: on screens narrower than `md`, wrap them in `overflow-x-auto` (checklists stay readable because they have only 4 columns). The manager and HR tables may become stacked cards on mobile if time allows. Otherwise horizontal scroll is fine.
- Buttons and checkboxes have a touch target of at least 40px.
- Every form input has a `<label>`. Errors use `aria-describedby`. Banners use `role="status"` (info and success) or `role="alert"` (error).
- Colour is never the only signal: status badges always show text.

## 6. Out of scope for the UI

Dark mode, toasts or animations beyond Tailwind defaults, pagination, search, sorting, editing submitted forms, notification emails, and an admin page.
