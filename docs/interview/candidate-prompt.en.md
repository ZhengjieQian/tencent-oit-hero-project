# Interview Project: SaaS Tenant Management

## Your role

You are an engineer on a SaaS platform team. The interviewer will play the requester and provide requirements in stages. You will receive each task only when that stage begins. Clarify the current stage’s business rules before implementing it; do not guess future requirements.

## Interview guidelines

- The exercise takes about 30–40 minutes. The interviewer will send the tasks one stage at a time.
- This interview evaluates Vibe Coding. Use an AI coding assistant you are familiar with in at least one stage; tool choice is up to you. Review and verify the changes you keep, and be able to explain why the key code changes are appropriate.
- Briefly share your plan, assumptions, progress, and risks. Ask the requester about unclear business rules.
- Keep Git changes small and reviewable. Add tests for the behavior you implement.
- The local demo identities are for local testing only. Do not add real identity-service credentials or send data to external services.
- At the end, demonstrate the behavior, list the checks you ran, and call out any remaining risks.

The repository includes a runnable React front end, REST API, SQLite database, demo identities, and starter pages. Start the project before working on the current stage. The candidate-visible `npm run test:challenge` command covers Stage 1 only.

## Okta/OIDC

A real Okta/OIDC integration is outside this time-boxed coding exercise. The interviewer may ask how you would connect the local demo identities to Okta/OIDC and securely map external identities to local users, tenants, and roles.
