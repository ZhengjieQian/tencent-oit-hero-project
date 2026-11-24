# Northstar SaaS Admin Interview Project

A local Vibe Coding interview project for junior full-stack engineers. The front end, API, and PostgreSQL database run locally without external service accounts or credentials. For Chinese, see [`README.md`](README.md).

## Requirements

- Git, an internet connection, and a modern browser (Chrome, Edge, or Firefox recommended)
- macOS, Windows PowerShell, or glibc-based Linux (x64/ARM64)
- Docker Desktop (to run local PostgreSQL)
- Node.js/npm do not need to be preinstalled. First launch downloads Node.js 24.22.3 into this repo's ignored `.tools/` directory, verifies the official SHA-256 checksum, and installs locked npm dependencies. It does not modify a system-wide installation.

The first dependency install needs internet and may take a few minutes. Clone and launch once before the interview; setup is outside the 30–40 minute exercise. If your network blocks the download, install [Node.js 24.x](https://nodejs.org/en/download) manually and use the regular npm commands.

## Run locally

macOS/Linux:

```bash
./scripts/start-interview.sh
```

Windows PowerShell:

```powershell
.\scripts\start-interview.ps1
```

Open <http://127.0.0.1:5173/>; the API health check is <http://127.0.0.1:3001/api/health>. The startup script starts PostgreSQL through Docker Compose. Press `Ctrl+C` to stop the front end and API; the database container keeps running, with data stored in a Docker volume. Dependencies are installed only on the first launch or when `package-lock.json` changes. Normal launches do not reset the database.

Before each candidate, the interviewer explicitly runs `./scripts/npm.sh run db:reset` (Windows PowerShell: `./scripts/npm.ps1 run db:reset`) in a repo that has been launched once, then starts the app. This resets the local PostgreSQL demo database. Run `./scripts/npm.sh run db:stop` to stop and remove the container; the data volume is preserved.

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
./scripts/npm.sh test                  # Existing starter behavior; should pass
./scripts/npm.sh run test:challenge    # Stage 1 search acceptance test; fails before the fix
./scripts/npm.sh run typecheck
./scripts/npm.sh run build
./scripts/npm.sh run db:inspect        # Read-only view of tenant status in PostgreSQL
```

In Windows PowerShell, replace `./scripts/npm.sh` with `./scripts/npm.ps1`. These wrappers use the project-local Node/npm downloaded at first launch and do not require PATH setup in another terminal.

The interviewer sends one requirement at a time. Stage 1 is a front-end search bug fix. Later-stage prompts are sent separately and are not included in the candidate repository.

## Interview prompt

General candidate instructions: [`docs/interview/candidate-prompt.en.md`](docs/interview/candidate-prompt.en.md). Interviewers send each stage’s prompt separately. The interviewer answer card, rubric, and scorecard are kept private. After starting the app, run the Stage 1 acceptance check with `./scripts/npm.sh run test:challenge` (Windows: `./scripts/npm.ps1 run test:challenge`).

If you want to use the Vercel CLI locally, install it with `npm i -g vercel` for workflows such as `vercel env pull`, `vercel deploy`, and `vercel logs`. The CLI is not required to run this interview project locally.
