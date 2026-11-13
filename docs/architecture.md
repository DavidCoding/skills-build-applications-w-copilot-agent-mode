# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep the React app thin and route-driven: page components should read from a shared API client and render the server-driven data, while the browser remains responsible only for UI state and navigation. The current failing frontend tests confirm the app is still in a placeholder state and needs to replace the static “Implementation pending” content with real data fetching.
- Logic tier decision: Build the Express API as the contract boundary for the app. Validations belong here for request/response contract checks, while business logic remains centralized in route handlers or small service helpers. This is the layer that must convert invalid references into deliberate 4xx responses instead of leaking Mongo/Mongoose cast errors as 500s.
- Data tier decision: Use Mongoose schemas as the source of truth for required fields, relationships, and seed data. The data model should validate required identity and goal fields, maintain team membership arrays, and ensure activities reference valid users and teams. The failing data tests show the schema is still too permissive.
- Activity tracking approach: Store activity records with `user`, `team`, `type`, `minutes`, `points`, and `occurredAt`, and derive points from the activity minutes according to the contract. Validation should reject missing or invalid `userId` / `teamId` inputs with a clear 4xx and should never rely on a raw `CastError` path.
- Team management approach: Require a non-empty team `name`, a `mascot`, and a `members` array. The API should accept new teams, append member references, and expose members in the list response. The current failing team contract tests confirm this is not implemented yet.
- Leaderboard approach: Aggregate activity points by team, sort descending by total points, and assign 1-based ranks to each team. This is a read-only calculation derived from the activity records, not a separate persisted leaderboard table.
- Workout suggestions approach: Match the request email to a seeded user, inspect the user’s recent activity pattern or fitness goal, and return ranked workout suggestions with a focus, title, duration, difficulty, and a reason string. The first suggestion should align to the user’s goal or recent pattern and respond with a deliberate 4xx when no user matches.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — validates the Mongoose schema and seed data contract. Current failures show missing required validation for user identity, team metadata, activity references, and workout requirements; this is the first layer to fix.
- API command: `npm run test:api --prefix octofit-tracker/backend` — validates the Express `/api/*` contract for invalid-request handling, team creation, leaderboard ordering, and workout suggestions. Current failures indicate server routes are still unimplemented or returning 501s and empty results instead of the required 400/201/200 data.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — validates the React pages and API integration contract. Current failures show the app still renders the placeholder “Implementation pending” text and not the real activity, team, leaderboard, or workout pages.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — catches TypeScript and runtime-usage issues in the server code once the data and API contracts are corrected.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — catches TypeScript/Vite build issues after the UI is wired to the real API behavior. This should be run after the backend contract is stable so the frontend is validating the real payload shape instead of placeholders.
