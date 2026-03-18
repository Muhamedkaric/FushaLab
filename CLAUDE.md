# FushaLab – Claude Instructions

## Allowed without prompting

- All `pnpm` commands (install, dev, build, lint, format, typecheck, preview)
- All `git` commands (add, commit, push, pull, status, diff, log, branch)
- Standard shell: `find`, `grep`, `ls`, `cat`, `mkdir`, `rm`, `mv`, `cp`, `curl`
- Read/write/edit any file in this repo

## Deployment

- Production: https://fusha-lab.vercel.app
- Platform: Vercel, static SPA, no backend
- Build: `pnpm build` → `dist/`, served via `vercel.json` filesystem handler

## Code style

- Prettier: single quotes, no semicolons, 100 col, trailing commas (es5)
- Run `pnpm format` before committing if touching many files
- Pre-commit hook runs automatically: lint-staged → full build

## Stack reminders

- MUI v7 — Grid is `@mui/material/Grid` with `size={{ xs, sm }}` prop (no `item`)
- TanStack Router — code-based in `src/router.tsx`, no file generation
- Content JSON lives in `public/data/{category}/{level}/` — never in `src/`
- `localStorage` only — no backend, no auth, no API calls
