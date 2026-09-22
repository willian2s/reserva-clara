<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project

- Use npm; this is a single package and `package-lock.json` is authoritative. App Router entrypoints are under `src/app`; `@/*` resolves to `src/*`.
- `src/components/ui` uses shadcn `base-nova` with Base UI and RSC. Generate additions with `npx shadcn add <component>`; do not copy another shadcn style.
- Tailwind 4 is CSS-first. Theme and imports belong in `src/app/globals.css`; no Tailwind config exists.
- Auth is currently browser-only: `src/lib/firebase/client.ts` initializes Firebase, and the auth components observe client state and redirect. `/dashboard` has no server-side authorization boundary; do not treat `DashboardGate` as access control for sensitive data.
- Copy `.env.example` to ignored `.env.local` and provide its `NEXT_PUBLIC_FIREBASE_*` values before exercising Google sign-in.

## Commands

```bash
npm ci
npm run dev
npm run lint
npm exec next typegen && npx tsc --noEmit
npm run build
```

Run type generation before TypeScript checks; global route helpers such as `LayoutProps` are generated. No test runner, formatter, CI workflow, or pre-commit hook is configured.
