# Interview Project: SaaS Tenant Management

## Your role

You are an engineer on a SaaS platform team. The interviewer will play the requester and provide requirements in stages. You will receive each task only when that stage begins. Clarify the current stage’s business rules before implementing it; do not guess future requirements.

## Interview guidelines

- The exercise takes about 30–40 minutes. The interviewer will send the tasks one stage at a time.
- This interview evaluates Vibe Coding. Use an AI coding assistant you are familiar with in at least one stage; tool choice is up to you. Review and verify the changes you keep, and be able to explain why the key code changes are appropriate.
- Briefly share your plan, assumptions, progress, and risks. Ask the requester about unclear business rules.
- Keep Git changes small and reviewable. Add tests for the behavior you implement.
- The local demo identities are for local testing only. Do not add real identity-service credentials or send data to external services.
- Before the interview, clone the repository and run the `scripts/start-interview` launcher for your OS to confirm the app starts. First launch requires Git, internet access, and a modern browser; it downloads a project-local Node.js runtime and installs dependencies. Setup time is not part of the interview. If your network blocks the download, install Node.js 24.x manually and tell the interviewer.
- At the end, demonstrate the behavior, list the checks you ran, and call out any remaining risks.

- The interviewer may offer an optional bonus after the three required stages. The bonus does not affect the required-stage pass decision.

The repository includes a runnable React front end, REST API, SQLite database, demo identities, and starter pages. On macOS/Linux run `./scripts/start-interview.sh`; in Windows PowerShell run `./scripts/start-interview.ps1`. Open `http://127.0.0.1:5173/` and press `Ctrl+C` to stop. Start the project before working on the current stage. To run checks, use `./scripts/npm.sh` on macOS/Linux or `./scripts/npm.ps1` in Windows PowerShell. For example, `./scripts/npm.sh run test:challenge` covers Stage 1 only.


## Okta/OIDC

A real Okta/OIDC integration is outside this time-boxed coding exercise. The interviewer may ask how you would connect the local demo identities to Okta/OIDC and securely map external identities to local users, tenants, and roles.
