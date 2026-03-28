# Overview

This project is a pnpm workspace monorepo using TypeScript, designed for a mystical AI reading mobile application called "The Oracle". The application analyzes palm, iris, and face photos using Claude AI, combined with numerology and astrology, to generate personalized life readings for users. The project aims to deliver a unique and engaging user experience in the AI-powered personal insights market.

## User Preferences

I prefer simple language and clear explanations. I want iterative development with frequent, small updates. Ask before making major architectural changes or introducing new dependencies. Do not make changes to folder `artifacts/oracle/lib/analytics.ts` and `artifacts/api-server/src/routes/legal.ts` as they have been audited for privacy compliance.

# System Architecture

The project is structured as a pnpm monorepo with `artifacts/` for deployable applications and `lib/` for shared libraries.

**Core Stack:**
- **Monorepo:** pnpm workspaces
- **Node.js:** 24
- **TypeScript:** 5.9
- **API:** Express 5
- **Database:** PostgreSQL + Drizzle ORM
- **Validation:** Zod, `drizzle-zod`
- **API Codegen:** Orval (from OpenAPI spec)
- **Build:** esbuild

**The Oracle App (Mobile - `artifacts/oracle`):**
- **Frontend:** Expo React Native
- **UI/UX:** Dark and gold mystical theme, animated hexagram sigil, StarField, GoldSigil, custom fonts (Cinzel Decorative for headings, EB Garamond for body).
- **Core Screens:** Onboarding, Landing, User Intake, Photo Ritual Wizard, Reading (SSE streaming, paywall), Chat, Journal (history), Journal Detail, Daily History, Settings, Notification Settings.
- **Journal/Reading History:** Manages entries in AsyncStorage, supports various reading types, auto-saves readings, features favorite/bookmark toggles and filters.
- **Authentication:** Email magic code login (no passwords), JWT-based sessions, optional login for basic app use.
- **Profile Sync:** Merges local and server profiles on login, pushes changes to server in background, clears local data on logout (server data preserved). Photos remain local.
- **Shareable Image Cards:** Branded cards for social sharing (Archetype, Synastry, Deep Dive), captured via `react-native-view-shot`, supporting Story and Feed aspect ratios.
- **Referral Program:** Generates unique codes, tracks redemptions, grants free deep-dive credits to both referrer and referee. Supports deep linking for invites.

**API Server (`artifacts/api-server`):**
- **Framework:** Express 5.
- **Key Features:** SSE streaming for readings, Claude AI integration, image processing (sharp), authentication, profile management, daily/weekly content generation, account deletion, push notification management, referral API.
- **Database Schema:** `sessions`, `daily_content`, `users`, `user_profiles`, `verification_codes`, `push_tokens`, `notification_preferences`, `referrals`, `referral_redemptions`, `referral_rewards`.

**Shared Libraries (`lib/`):**
- **`lib/db`:** Drizzle ORM for PostgreSQL, defining schema models for users, sessions, profiles, push tokens, and referral data.
- **`lib/api-spec`:** Contains OpenAPI 3.1 spec and Orval configuration for API client and Zod schema generation.
- **`lib/api-zod`:** Generated Zod schemas for API validation.
- **`lib/api-client-react`:** Generated React Query hooks for API interaction.

**Monorepo Structure:**
- `artifacts/`: `api-server`, `oracle`
- `lib/`: `api-spec`, `api-client-react`, `api-zod`, `db`
- `scripts/`: Utility scripts.
- `tsconfig.base.json`: Shared TypeScript config with `composite: true`.
- Root `tsconfig.json`: Lists all packages as project references for unified type-checking.

# External Dependencies

- **AI Integration:** Replit AI Integrations proxy for Anthropic (specifically `claude-opus-4-5`).
- **Payment Processing:** RevenueCat (for in-app subscriptions).
  - **SDKs:** `react-native-purchases` (client), `@replit/revenuecat-sdk` (server).
- **Analytics:** PostHog (backend support via environment variables; falls back to console logging if unconfigured).
- **Push Notifications:** Expo Push Notifications.
- **Image Processing:** Sharp.
- **Database:** PostgreSQL.
- **Fonts:** Google Fonts (`@expo-google-fonts/cinzel-decorative`, `@expo-google-fonts/eb-garamond`).
- **Networking:** CORS.
- **Environment Management:** `dotenv`.
- **Utilities:** Zod, Drizzle ORM, Orval, esbuild, pnpm.