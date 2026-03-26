# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## The Oracle App

**"The Oracle"** is a mystical AI reading mobile app (Expo React Native) that analyzes palm/iris/face photos via Claude AI alongside pre-computed numerology and astrology to generate personalized life readings.

### Architecture
- **Frontend**: Expo React Native app (`artifacts/oracle`) — 5-screen flow with gold/dark mystical theme
- **Backend**: Express API (`artifacts/api-server`) — SSE streaming, Claude `claude-opus-4-5`, sharp image processing

### Screens
1. `app/index.tsx` — Landing page with animated hexagram sigil and starfield
2. `app/intake.tsx` — User data form (name, DOB, birth time, city, gender, dominant hand, eye color, 3 life questions)
3. `app/ritual.tsx` — 9-step photo ritual wizard (intro → right palm → left palm → biometric consent → right iris → left iris → face → face reading session → review)
4. `app/reading.tsx` — SSE streaming reading, paywall gate after Section 2, archetype card, share + chat CTA
5. `app/chat.tsx` — Oracle chat with streaming responses, inverted FlatList, starter questions

### API Routes (`/api`)
- `POST /api/generate` — SSE stream, free sections 1–2 then paywall event
- `POST /api/generate/continue` — SSE stream, paid sections 3–7 + archetype
- `POST /api/chat` — Oracle persona chat, rate-limited 10 msg/session

### Fonts
- `@expo-google-fonts/cinzel-decorative` — CinzelDecorative_400Regular, CinzelDecorative_700Bold (headings)
- `@expo-google-fonts/eb-garamond` — EBGaramond_400Regular, EBGaramond_500Medium, EBGaramond_400Regular_Italic (body)

### Colors (mystical gold/dark)
- Background: `#04040f`, Surface: `#0b0b1e`, Gold: `#c9a84c`, Cream: `#f0e6cc`

### AI Integration
- Uses Replit AI Integrations proxy for Anthropic (no personal API key needed)
- Env vars: `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`, `AI_INTEGRATIONS_ANTHROPIC_API_KEY`
- Falls back to `ANTHROPIC_API_KEY` if proxy env vars are absent
- oracle.ts initializes the Anthropic client with the proxy base URL + key

### Monetization

**RevenueCat** is integrated for payment processing.

- **Product**: `oracle_full_reading` — $4.99/month auto-renewing subscription (`$rc_monthly` package, `P1M` duration)
- **Entitlement**: `full_reading` — gates the paid sections 3–7, archetype, and Oracle Chat
- **Client SDK**: `react-native-purchases` initialized in `app/_layout.tsx` via `initializeRevenueCat()`
- **Subscription context**: `lib/revenuecat.tsx` → `SubscriptionProvider` / `useSubscription` hook
- **Paywall UI**: `app/reading.tsx` `PaywallGate` component — shows price from RC, subscription renewal terms, custom confirm modal with terms, restore purchase
- **Subscription management**: `app/profiles.tsx` — "Manage Subscription" link (opens App Store subscriptions) + "Restore Purchases" at bottom of vault screen
- **Server verification**: `POST /api/generate/continue` accepts `rcAppUserId`, calls `listCustomerActiveEntitlements` via `@replit/revenuecat-sdk` to verify `full_reading` entitlement before streaming paid sections
- **Seed script**: `pnpm --filter @workspace/scripts run seed:revenuecat` — idempotent, re-runnable

**Environment variables set**:
- `EXPO_PUBLIC_REVENUECAT_TEST_API_KEY`, `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- `REVENUECAT_PROJECT_ID`, `REVENUECAT_TEST_STORE_APP_ID`, `REVENUECAT_APPLE_APP_STORE_APP_ID`, `REVENUECAT_GOOGLE_PLAY_STORE_APP_ID`

**RevenueCat initialization is graceful**: missing keys log a warning listing the missing variable names instead of crashing. The paywall disables purchase/restore buttons when RevenueCat is unconfigured.

**Backend client** (`artifacts/api-server/src/lib/revenueCatClient.ts`): uses Replit integration credentials (via `REPL_IDENTITY` + connectors API) with `REVENUECAT_SECRET_KEY` env var as fallback. API server starts without errors even if credentials are unavailable — entitlement errors surface per-request.

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── oracle/             # Expo React Native — The Oracle app
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
