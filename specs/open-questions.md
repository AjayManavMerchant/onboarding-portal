# Open Questions

Each question has a **default** that the specs already use, so building is not blocked. Answering a question only changes the specs where noted.

| # | Question | Default used in specs | Where it matters |
|---|---|---|---|
| Q1 | Where does a **rejected** new joiner see the HR comment? They cannot log in. | ✅ **Decided:** a public "Check registration status" page linked from Home. Look up by **request ID only**, no login. | frontend §3.3, AC3 |
| Q2 | Who can use **Internal Movement**: only Rahul, or any active employee with a team (for example a new joiner who finished Journey A)? | Any active employee with a current team. | data BR13, frontend §3.4 |
| Q3 | Rahul's starting **Team A checklist**: fully complete, or not started? | Fully complete, so his overall status starts as `Completed`. | data §8.5 |
| Q4 | While a move is pending, should Rahul's overall status show `Pending Team Approval`, or stay `Completed` for Team A? And should Manager A still see him in Team Progress? | `Pending Team Approval`; Manager A still sees him until approval. | data §5 |
| Q5 | Can a new joiner **untick** basic items after submitting a team request? | No. Basic items become read-only after submission (BR18). | data BR18 |
| Q6 | Should managers' display names stay "Manager A/B/C", or get real-looking names (for example "Anita Sharma (Manager A)")? | Keep "Manager A/B/C" as in the vision. | data §8.2 |
| Q7 | Is the GitHub repo already created, and is the Vercel account linked to it? The local repo is on `master` with no commits and no remote, but the main branch is `main`. | We will create the repo on `main` with `gh` and import it in Vercel. | plan Phase 1 step 10 |
