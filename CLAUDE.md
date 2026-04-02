# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands are run from `http-bulk-runner/` (the project root).

```bash
# Install dependencies (first time or after package.json changes)
npm install

# Start both client and server in dev mode
npm run dev

# Build everything (server first, then client)
npm run build

# Client only (port 5173)
npm run dev -w client

# Server only (port 3001)
npm run dev -w server
```

No test framework is configured.

## GitHub Workflow

All changes must go through a branch + Pull Request flow. Never push directly to `main`.

```bash
# 1. Create a feature branch
git checkout -b feat/<short-description>

# 2. Stage and commit your changes
git add <files>
git commit -m "feat: describe what changed"

# 3. Push the branch
git push origin feat/<short-description>

# 4. Open a Pull Request targeting main
#    Use the GitHub API or the GitHub UI:
#    https://github.com/rcannuto/http-bulk-runner/compare
```

**Rules:**
- Branch naming: `feat/`, `fix/`, `chore/` prefixes
- Commit messages: follow conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)
- PR must be reviewed and approved before merging to `main`
- The remote uses `main` as the default branch (local `master` is unrelated)

## Architecture

TypeScript monorepo (`client/` + `server/`) for running bulk HTTP requests against CSV data rows, with Postman Collection Runner-style UX.

**Request flow:**
1. User uploads a CSV and configures a request template (URL, method, auth, body with `{columnName}` and `{{envVar}}` placeholders)
2. Client POSTs to `/api/preview` or `/api/run` on the Express backend (port 3001)
3. Server streams results back as **newline-delimited JSON via Server-Sent Events (SSE)**
4. Client reads the stream incrementally and renders real-time progress + Postman-style results panel

**Backend (`server/src/`):**
- `index.ts` — Express entry point; CORS allows `localhost:5173`
- `routes/runner.ts` — `/run` and `/preview` handlers; iteration loop with stop-on-failure; sends `RunSummary` on done
- `services/csvParser.ts` — Parses uploaded CSV buffer via `csv-parse` streams → `Record<string, string>[]`
- `services/httpRunner.ts` — Executes requests via axios; 30s timeout; evaluates assertions; returns `RowResult` with `assertionResults`
- `services/templateEngine.ts` — Interpolates `{columnName}` (CSV) and `{{varName}}` (env vars) tokens
- `services/assertionRunner.ts` — Evaluates assertion rules (status, response time, body contains, JSONPath)

**Frontend (`client/src/`):**
- `App.tsx` — Two-panel layout after first run (config left, results right); manages all state
- `types.ts` — Shared interfaces (`RunConfig`, `AuthConfig`, `RowResult`, `CsvPreview`, `AssertionRule`, `RunSummary`, etc.)
- `vite.config.ts` — Proxies `/api/*` to `http://localhost:3001`
- Components: `RequestConfig`, `AssertionsConfig`, `EnvVarsConfig`, `RunnerOptions`, `CsvUploader`, `ColumnMapper`, `RunControls`, `RunnerResults`

**Auth types** (defined in `AuthConfig`): `none`, `bearer`, `apikey-header`, `apikey-query`, `basic`.

**Template syntax:**
- `{columnName}` — replaced with CSV row value
- `{{varName}}` — replaced with environment variable value (env vars resolved first)

**SSE streaming pattern:** The backend sets `Content-Type: text/event-stream` and flushes one JSON object per line. The frontend reads via `fetch` + `ReadableStream`, splitting on `\n` to parse each `RowResult` as it arrives. The final event is a `RunSummary` with `done: true`. Abort is supported via `AbortController`.

**Assertion types:** `status-equals`, `status-not-equals`, `response-time-lt`, `body-contains`, `jsonpath-equals` (dot-notation, e.g. `$.data.id`).
