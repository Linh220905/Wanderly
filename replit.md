# Wanderly

Wanderly turns walking, running, and hiking into a private map-revealing adventure with rewards and personal journey history.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/wanderly/app/index.tsx` — persisted first-launch gates, onboarding, paywall, setup, map shell, missions, journey, collection, and profile.
- `artifacts/wanderly/constants/colors.ts` — Wanderly’s dark outdoor-adventure palette.
- `artifacts/wanderly/assets/images/icon.png` — generated app icon and splash artwork.

## Architecture decisions

- The first-launch order is an explicit persisted gate state: onboarding, explorer summary, premium presentation, account, location, then the main app.
- AsyncStorage is the local-first source for the first build so the map and progress survive relaunch without requiring production credentials.
- The map surface is intentionally designed as a fog/reveal experience first; native GPS permission is requested only after account setup.

## Product

The MVP includes a ten-step personalized onboarding flow, a soft premium gate, account/location setup, a map-first five-section shell, active exploration controls, mission progress, journey history, collection badges, and profile settings. Local progress persists across relaunches.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
