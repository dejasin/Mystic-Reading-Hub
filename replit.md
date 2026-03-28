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
1. `app/index.tsx` — Landing page with animated hexagram sigil and starfield, settings gear icon top-right
2. `app/intake.tsx` — User data form (name, DOB, birth time, city, gender, dominant hand, eye color, 3 life questions)
3. `app/ritual.tsx` — 9-step photo ritual wizard (intro → right palm → left palm → biometric consent → right iris → left iris → face → face reading session → review)
4. `app/reading.tsx` — SSE streaming reading, paywall gate after Section 2, archetype card, image share card + chat CTA
5. `app/chat.tsx` — Oracle chat with streaming responses, inverted FlatList, starter questions
6. `app/journal.tsx` — Reading history / journal screen: chronological list of all past readings with type badges, previews, and favorite filter
7. `app/journal-detail.tsx` — Full reading detail view with section-aware rendering and favorite toggle
8. `app/daily-history.tsx` — Scrollable history of past Daily Oracle messages
9. `app/settings.tsx` — Settings screen with Account (sign out, delete account), Subscription (plan status, manage, restore purchases), Notifications (toggles), Legal (privacy/terms links), Support (contact email), app version

### Journal / Reading History
- **Context**: `context/JournalContext.tsx` — manages journal entries in AsyncStorage (`oracle_journal_v1`)
- **Entry types**: Full Reading, Deep Dive, Synastry, Profile Reading
- **Auto-save**: readings are automatically saved to journal on completion from `reading.tsx`, `deep-dive.tsx`, `synastry.tsx`, and `profile-reading.tsx`
- **Features**: reverse chronological list, favorite/bookmark toggle, favorites-only filter, synastry entries show both profile names
- **Navigation**: accessible from home screen "Journal" button

### API Routes (`/api`)
- `POST /api/generate` — SSE stream, free sections 1–2 then paywall event
- `POST /api/generate/continue` — SSE stream, paid sections 3–7 + archetype
- `POST /api/chat` — Oracle persona chat, rate-limited 10 msg/session
- `POST /api/auth/send-code` — sends 6-digit magic code (logged to console, no email service)
- `POST /api/auth/verify-code` — validates code, creates/retrieves user, returns JWT
- `GET /api/auth/me` — returns current user from JWT
- `GET /api/profiles` — returns all profiles for authenticated user
- `POST /api/profiles` — upsert a profile (matched by localId)
- `DELETE /api/profiles/:id` — delete a server-side profile
- `POST /api/daily-oracle` — Personalized daily message (cached per profile per day)
- `POST /api/weekly-forecast` — Weekly outlook (cached per profile per week)
- `GET /api/daily-history/:profileId` — Past daily oracle messages
- `POST /api/account/delete` — Account deletion endpoint (App Store compliance); clears server-side references

### Authentication
- Email magic code login (no passwords). JWT-based sessions (30-day expiry).
- JWT secret via `JWT_SECRET` env var (falls back to default in development).
- Auth context (`AuthContext.tsx`) stores JWT in AsyncStorage, wires `setAuthTokenGetter` for automatic bearer tokens.
- Login is optional — unauthenticated users can use the app normally.

### Profile Sync
- On login, local profiles merge with server profiles (deduplicated by name+dob).
- On add/edit/delete, changes are pushed to server in background.
- On logout, local profile data is cleared; server data preserved for next login.
- Photos remain local-only (only metadata syncs).

### Shareable Image Cards
- `components/ShareCardModal.tsx` — Modal with ViewShot-captured branded cards for social sharing
- Three card types: Archetype (post-reading), Synastry (compatibility), Deep Dive (category summary)
- Story (1080x1920) and Feed (1080x1080) aspect ratio toggle
- Uses `react-native-view-shot` for capture, `expo-sharing` for native share sheet, web download fallback
- Share triggers on reading completion, synastry completion, and deep-dive completion screens
- Dark + gold mystical aesthetic with sigil, traits/highlights, and "Discover yours at theoracle.app" CTA

### Database Tables
- `sessions` — User reading sessions
- `daily_content` — Cached daily/weekly content with unique constraint on (profile_id, content_type, content_date)

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

### Analytics

- **Module**: `artifacts/oracle/lib/analytics.ts` — lightweight, privacy-respecting event tracking
- **Initialization**: `initAnalytics()` called in `app/_layout.tsx` at app startup
- **Event schema**: `AnalyticsEvent` enum with ~30 named events covering the full funnel
- **Funnel tracking**: `trackFunnelStep()` for `app_open → intake → ritual → reading → paywall → purchase`
- **No PII**: Only anonymous device IDs and action metadata are tracked — no names, DOB, photos, or personal data
- **Backend support**: Ready for PostHog via `EXPO_PUBLIC_POSTHOG_KEY` and `EXPO_PUBLIC_POSTHOG_HOST` env vars; falls back to console logging in dev when no keys are configured
- **Privacy Policy**: Updated in `artifacts/api-server/src/routes/legal.ts` to disclose anonymous analytics collection

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
- `src/schema/sessions.ts` — `sessions` table for persisting Oracle session state (paid status, reading text, message count, etc.)
- `src/schema/users.ts` — `users` table (id, email, email_verified), `user_profiles` table (profile data synced from mobile), `verification_codes` table (magic code auth)
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas
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
