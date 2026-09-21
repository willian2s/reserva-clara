<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Repository map

- Single-package npm app; `package-lock.json` is authoritative.
- Next.js 16 App Router lives in `src/app`. `@/*` resolves to `src/*`.
- `src/components/ui` contains shadcn components configured by `components.json` (`base-nova`, Base UI, RSC). Add components with `npx shadcn add <component>` rather than hand-copying another shadcn style.
- Tailwind CSS 4 is CSS-first: theme tokens and imports live in `src/app/globals.css`; there is no Tailwind config file.
- Browser Firebase initialization is centralized in `src/lib/firebase/client.ts`. It reuses an existing app during hot reload and reads the public variables listed in `.env.example`; use `.env.local`, which is intentionally ignored.

## Commands

- Install exactly from lockfile: `npm ci`
- Develop: `npm run dev`
- Lint all files: `npm run lint`; lint one file: `npm run lint -- src/app/page.tsx`
- Type-check from a clean tree: `npm exec next typegen` then `npx tsc --noEmit`. Route helpers such as `LayoutProps` do not exist until type generation.
- Production verification: `npm run build`
- No test runner or formatter is configured. Do not claim test coverage or add tool-specific commands without first adding corresponding tooling.
