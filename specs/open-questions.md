# Open Questions

All questions are **decided** (2026-10-18). Q1 was answered explicitly; Q2–Q6 accept the recommended defaults; Q7 reflects the actual setup.

| # | Question | Decision | Where it matters |
|---|---|---|---|
| Q1 | Where does a **rejected** new joiner see the HR comment? They cannot log in. | ✅ **Decided:** a public "Check registration status" page linked from Home. Look up by **request ID only**, no login. | frontend §3.3, AC3 |
| Q2 | Who can use **Internal Movement**: only Rahul, or any active employee with a team (for example a new joiner who finished Journey A)? | ✅ **Decided:** any active employee with a current team. | data BR13, frontend §3.4 |
| Q3 | Rahul's starting **Team A checklist**: fully complete, or not started? | ✅ **Decided:** fully complete, so his overall status starts as `Completed`. | data §8.5 |
| Q4 | While a move is pending, should Rahul's overall status show `Pending Team Approval`, or stay `Completed` for Team A? And should Manager A still see him in Team Progress? | ✅ **Decided:** `Pending Team Approval`; Manager A still sees him until approval. | data §5 |
| Q5 | Can a new joiner **untick** basic items after submitting a team request? | ✅ **Decided:** no. Basic items become read-only after submission (BR18). | data BR18 |
| Q6 | Should managers' display names stay "Manager A/B/C", or get real-looking names (for example "Anita Sharma (Manager A)")? | ✅ **Decided:** keep "Manager A/B/C" as in the vision. | data §8.2 |
| Q7 | Is the GitHub repo already created, and is the Vercel account linked to it? | ✅ **Decided:** repo not created yet; Vercel account exists and is linked to GitHub. Local branch is `main`. We create a public `onboarding-portal` repo with `gh` (user runs `gh auth login`), and the user imports it in Vercel via the website. | plan Phase 1 step 10 |
| Q8 | Rahul never had a NEW_JOINER request, so BR18 as written would let him untick basic items. Lock them too? | ✅ **Decided:** yes — basic items are also read-only once the employee has a current team. | data BR18 |
