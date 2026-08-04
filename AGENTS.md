<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Nomadio project rules

## Product boundary

Nomadio is a trip-centric travel application. A trip owns its itinerary,
places, accommodation, transport, budget, documents, checklist, travellers,
sharing permissions, and offline state. Keep every feature scoped by `trip_id`.

This repository is in foundation phase. Do not build complete product modules,
create external Supabase/Vercel projects, deploy, or add real credentials unless
the user explicitly authorizes the next phase.

## Architecture and code

- Use Next.js App Router, React Server Components by default, strict TypeScript,
  Tailwind CSS, and local shadcn/ui components.
- Organize business code by feature under `src/features`; keep reusable UI in
  `src/components` and infrastructure adapters in `src/lib`.
- Keep Supabase and Mapbox behind small adapters. Domain code must not depend on
  provider response shapes.
- Validate input at trust boundaries. Never rely on browser-only authorization.
- Prefer Server Components. Add `"use client"` only for browser APIs or genuine
  interaction.
- Keep files focused, avoid barrel files with side effects, and use the `@/*`
  import alias.
- Maintain desktop-first planning workflows and mobile-first in-trip usability.

## Delivery workflow

- Implement changes as small, closed, and independently verifiable functional
  slices.
- Do not combine large refactors or several unrelated modules in one change.
- Before a significant technical decision, describe the viable options and the
  selected approach.
- Do not implement future capabilities preemptively without a current need.

## Data and security

- Make every database schema change through a versioned Supabase migration.
  Never change the production database manually outside migrations.
- New trips are private. Access must eventually be enforced with Supabase Row
  Level Security for `owner`, `editor`, and `viewer` memberships.
- Enable Row Level Security on every table that contains user or trip data.
- Add or update tests for the relevant RLS policies with every migration.
- Documents use private storage buckets and signed URLs. Never make trip files
  public by default.
- Never use a service-role key in client code or expose it to the browser. Only
  `NEXT_PUBLIC_*` values may be referenced from client code.
- Do not commit `.env*` files except `.env.example`; keep examples empty of real
  tokens.
- Treat offline data as sensitive. Scope device data per user and trip, version
  schemas, and clear it on sign-out or revoked access.

## Responsive design

- Every screen must work from a 320 px viewport through a large desktop.
- Prevent page-level horizontal scrolling and do not design for one specific
  device.
- Verify both mobile and desktop variants for every user-facing change.
- Desktop is primary for planning; mobile is primary for Travel mode.

## Git workflow

- Develop each functional slice on its own branch with a descriptive name such
  as `feature/google-auth`.
- Keep commits small, single-purpose, and formatted as Conventional Commits.
- Review the complete diff before committing.
- Do not commit unless lint, typecheck, tests, and the production build pass.
- Never force-push or rewrite history without explicit user instruction.

## Quality gates

Before handing off a change, run the relevant checks. For normal code changes,
the full gate is:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Add Vitest and Testing Library coverage for behavior, not implementation
details. Update `docs/product-spec.md` when product rules change and
`docs/implementation-plan.md` when sequencing or architecture changes.
