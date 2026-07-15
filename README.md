# AI Agent Frontend

A React and Vite dashboard for the AI Agent System backend. It provides JWT authentication, task summaries, task filtering and search, status updates, role-aware deletion, backend readiness feedback, and responsive accessible states.

## Requirements

- Node.js 20+
- npm
- A running compatible Flask backend

## Local setup

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Set the complete API base URL in `.env.local`:

```env
VITE_API_URL=http://localhost:5000/api
```

`VITE_*` values are embedded in the browser bundle and must never contain credentials or server-side secrets.

## Commands

```bash
npm run dev        # local Vite server
npm run lint       # ESLint
npm test           # dependency-free Node tests
npm run audit:repo # tracked configuration and credential checks
npm run build      # production bundle
npm run check      # all verification gates
```

## Authentication behavior

Access and refresh tokens are stored in `sessionStorage`, not persistent local storage. Existing installations migrate the previous token keys once. Protected routes validate the cached session against `/api/auth/me`, and concurrent 401 responses share one refresh request.

## Deployment

The included `vercel.json` preserves React Router routes and applies baseline browser security headers. Set `VITE_API_URL` in the deployment dashboard to the full backend API path, including `/api`.

## Repository review

The implementation choices derived from three comparable open-source projects are recorded in [`docs/reference-review.md`](docs/reference-review.md). Changed-area security notes are in [`docs/security-audit.md`](docs/security-audit.md).
