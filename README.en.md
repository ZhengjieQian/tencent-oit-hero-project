# Northstar SaaS Admin Interview Project

A local Vibe Coding interview project for junior full-stack engineers. The front end, API, and seeded SQLite data run locally without external service accounts or credentials. For Chinese, see [`README.md`](README.md).

## Requirements

- Node.js 22.12.x or 24.x
- npm 10 or later

If Node.js is not installed, get it from the [official Node.js download page](https://nodejs.org/en/download) and select version 24.x (or 22.12.x or later within the 22.x line). The Node.js installer includes npm. Reopen the terminal after installation and verify:

```bash
node --version
npm --version
```

Please install and verify the environment before the interview; setup time is not part of the 30–40 minute exercise.

## Run locally

```bash
npm install
npm run db:reset
npm run dev
```

- Web app: <http://localhost:5173>
- API health check: <http://localhost:3001/api/health>

The app starts as a platform operator. Use the **Demo identity** selector to switch accounts:

| Account | Role | Tenant |
|---|---|---|
| `ops@northstar.example` | Platform operator | All tenants |
| `admin@acme.example` | Tenant admin | Acme Studio |
| `admin@globex.example` | Tenant admin | Globex Labs |
| `member@acme.example` | Member | Acme Studio |

The identity selector is for local interview practice only. The demo-session API is disabled in production. Do not use this authentication approach in a production service.

## Checks

```bash
npm test                 # Existing starter behavior; should pass
npm run test:challenge   # Stage 1 front-end search acceptance test; fails before the fix
npm run typecheck
npm run build
npm run db:inspect       # Read-only view of tenant status in SQLite
```

The interviewer sends one requirement at a time. Stage 1 is a front-end search bug fix. Later-stage prompts are sent separately and are not included in the candidate repository.

## Interview prompt

General candidate instructions: [`docs/interview/candidate-prompt.en.md`](docs/interview/candidate-prompt.en.md). Interviewers send each stage’s prompt separately. The interviewer answer card, rubric, and scorecard are kept private.

If you want to use the Vercel CLI locally, install it with `npm i -g vercel` for workflows such as `vercel env pull`, `vercel deploy`, and `vercel logs`. The CLI is not required to run this interview project locally.
