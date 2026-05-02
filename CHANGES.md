# Changes — Oracle App Store Resubmission (Task #58)

**Scope:** Reframe Oracle from a palm-reading app to a **personal AI life advisor** that uses biometric reference images as a behavioral input signal. Option-C scope: TestFlight-visible surface only. App Store preview videos are intentionally skipped.

**Date:** May 02, 2026
**Bundle ID:** `com.theoracle.app` (unchanged)
**Version:** `1.0.0` (unchanged)
**Build Number:** `1` (unchanged — per spec, identifier invariants preserved)

---

## What Apple objected to

The previous submission was rejected for being a palmistry / palm-reading app with insufficient utility for the App Store. The fix is **not** to remove palmistry by name only — it is to reposition the entire product around a real, ongoing utility (a personal AI advisor with a structured behavioral profile and chat-based decision support) and make that utility visible without a paywall.

---

## High-level changes

| Area | Before | After |
|---|---|---|
| Positioning | "Palm Reading & Mystical Insights" | "AI Life Advisor — Powered by AI, refined by your biometrics" |
| Reading screen | Cold-start into a "reading" | Italic disclaimer ("not a prediction — a map of patterns…") above the free reveal |
| Behavioral profile | Hidden / secondary | Primary surface — 6-axis radar, locked-state messaging, persistent across launches via AsyncStorage, animated radar fill |
| Subscription visibility | Only visible at paywall | Persistent gold home banner (24h dismiss) + Settings "Current Plan" / "Oracle Pro — Active" / "Upgrade to Oracle Pro" rows |
| Chat starters | 6 chips | 8 chips, reframed away from divination toward life advice |
| Support website | Palm-reading marketing | Reframed end-to-end with new title, hero, three feature cards (Behavioral Profile / Decision Support / Ongoing Oracle Chat), four-entry FAQ, biometric-aware Privacy section, May 02 2026 effective date |
| Icons | Single 1024 master | 1024 master + splash mirror + 432×432 adaptive foreground + 96×96 monochrome notification icon |
| App Store screenshots | None | 5 × 1320×2868 marketing screenshots |

---

## Files modified

### Mobile app — `artifacts/oracle/`
- `app.json` — `ITSAppUsesNonExemptEncryption: false`, behavioral-aware `NSCameraUsageDescription` / `NSPhotoLibraryUsageDescription`, Android `adaptiveIcon` + `expo-notifications` icon wired. `buildNumber` left at `1` (no-op) per spec invariants.
- `app/index.tsx` — Persistent gold "Upgrade to Oracle Pro" banner with 24h `oracle_pro_banner_dismissed_at` AsyncStorage flag; reframed taglines.
- `app/onboarding.tsx` — Slide subtitle reframed to "Powered by AI. Refined by your biometrics."
- `app/intake.tsx` — "Prepare for Your Behavioral Analysis" header; "Begin Behavioral Capture" CTA + accessibility label.
- `app/ritual.tsx` — Step titles "Behavioral Imprint Capture" / "Your Dominant Hand" / "Your Non-Dominant Hand"; instructions and intro copy reframed.
- `app/profiles.tsx` — Photo slot labels "Right Hand" / "Left Hand" (data keys `right_palm` / `left_palm` preserved).
- `app/reading.tsx` — Italic disclaimer above free reveal; loading message "Capturing your biometric signal…"; gold "Talk to Oracle About Your Profile →" bridge button after Ask Oracle Anything.
- `app/chat.tsx` — 8 starter chips with reframed empty-state copy.
- `app/behavioral-profile.tsx` — Full rewrite. Locked state with paywall-aware bridge; AnimatedPolygon radar (1200ms / 150ms-staggered axis fade); "Last analyzed [relative]" timestamp; persisted from `OracleContext`.
- `app/settings.tsx` — "Current Plan: Oracle Pro / Free"; conditional "Oracle Pro — Active" or "Upgrade to Oracle Pro" rows.
- `context/OracleContext.tsx` — Behavioral scores persisted via AsyncStorage key `oracle_behavioral_scores`; tracks `behavioralScoresUpdatedAt`.
- `assets/images/icon.png` — Regenerated (1024×1024 RGB).
- `assets/images/splash-icon.png` — Regenerated.
- `assets/images/adaptive-icon.png` — New (432×432 RGBA, transparent bg).
- `assets/images/notification-icon.png` — New (96×96 RGBA monochrome).
- `assets/app-store/screenshot-[1-5].png` — New (5 × 1320×2868 PNGs at the flat spec path).
- `APP-STORE-SUBMISSION.md` — New, complete submission package: App Store Connect metadata, reviewer notes, build steps, compliance checklist.

### Marketing & support website — `artifacts/oracle-website/`
- `index.html` — Title, hero, eyebrow, three feature cards, four-entry FAQ, privacy "Information We Collect" + "How Your Reference Images Are Used", terms acceptable-use line, effective date May 02 2026 (×2).

### Tooling — `scripts/`
- `generate_oracle_icon.py` — Extended to also output `adaptive-icon.png` (432×432 RGBA) and `notification-icon.png` (96×96 RGBA monochrome) in addition to icon + splash. Includes re-runnable verification block.
- `generate_screenshots.py` — New. Pillow-based generator for 5 × 1320×2868 marketing screenshots (chat / reading / behavioral profile / intake / subscription) saved to `artifacts/oracle/assets/app-store/screenshot-[1-5].png`.

### Submission documentation
- `CHANGES.md` (this file) — Top-level changelog.
- `artifacts/oracle/assets/app-store/APP-STORE-SUBMISSION.md` — Full submission package.

### Post-review remediation (after architect code review)
A final architect review surfaced four user-visible / server-side palmistry leaks that were not caught by the original sweep. All four were fixed:

- `artifacts/oracle/app/ritual.tsx` — `PalmDiagram` (which rendered an SVG hand outline plus four labeled annotation lines: Heart / Head / Life / Fate) was replaced with a neutral `HandDiagram` (hand outline only, no annotations, no labels).
- `artifacts/oracle/app/profiles.tsx` — `computeSunSign()` was deleted and the zodiac symbol display was removed from the profile card body and accessibility label.
- `artifacts/oracle/app/index.tsx` — "Daily Oracle" → "Daily Reflection"; "This Week" → "This Week's Reflection"; mystical loading/error copy ("The Oracle contemplates…", "The veil is thick today", "Tap to reveal your weekly forecast") replaced with neutral copy.
- `artifacts/api-server/src/routes/oracle.ts` — The `BIRLA_PERSONA_BLOCK` "master palmist…three major lines, mounts of Jupiter / Saturn / Sun / Venus / Moon / Rahu / Ketu / Mars, line of association, girdle of Venus, grille on Venus, Vedic and Western traditions" instruction was rewritten as a behavioral-analyst persona. The `IMAGE ANALYSIS RULE` "palm images / palm lines / mounts / hand structure" wording was replaced with "biometric reference images / structural features." Both `buildFreeSystemPrompt` and `buildPaidSystemPrompt` had "trained in palmistry" replaced with "trained in behavioral pattern recognition." The `/behavioral-profile` system prompt's "completed palm reading…strong fate line, deep heart line, prominent Mount of Moon" guidance was replaced with neutral behavioral-grounding wording. `Elemental/Seasonal Signature: ${sunSign}` was removed from that prompt's seeker-context block.
- `artifacts/api-server/src/routes/legal.ts` — Effective dates on `/privacy` and `/terms` updated to May 02, 2026. "Personal AI life advisor, generating personalised guidance from palm imagery and birth-data inputs" → biometric-aware framing. "Drawing on symbolic systems including palmistry, facial analysis, numerology, and archetypal psychology" → "drawing on behavioral pattern recognition and archetypal psychology." Image-collection clause reframed as "biometric reference photographs (your hand, iris, or face) as input signals."

The `FORBIDDEN_TERMS` block (which lists zodiac names, numerology terms, etc.) was retained as a guard rail — it prevents the model from emitting any of those terms in user-visible output, even if profile-context fields elsewhere in the codebase still carry them as private grounding signals.

---

## Things that were intentionally NOT changed

These are the project's identity / billing / data anchors. They were preserved to keep TestFlight, RevenueCat, and existing user data continuous:

- `expo.slug` (`oracle`)
- `expo.version` (`1.0.0`)
- `expo.ios.bundleIdentifier` (`com.theoracle.app`)
- EAS / Expo project ID
- RevenueCat entitlement ID (`full_reading`) and product ID (`oracle_pro_monthly`)
- AsyncStorage keys and shape (`@oracle/onboarding_complete`, profile vault, journal, etc.)
- Database / context schema for photo slots — labels say "Hand" but the persisted keys remain `right_palm` / `left_palm` for backward compatibility.

---

## Out of scope for this submission

Per user agreement (Option-C scope), the following are deferred:

- 3 × 30s App Store preview videos. Pipeline lives at `artifacts/oracle-preview-ritual` and can be re-engaged for a follow-up submission.
- Localizations beyond English.
- iPad layout (`supportsTablet: false`).

---

## How to verify locally

```bash
# 1. Regenerate assets if needed
python scripts/generate_oracle_icon.py
python scripts/generate_screenshots.py

# 2. Prebuild verification (regenerates ios/ from app.json — gitignored)
cd artifacts/oracle
npx expo prebuild --platform ios --clean --no-install

# 3. Visual sanity check the support website
pnpm --filter @workspace/oracle-website run dev
```

---

## Post-validator remediation (final pass)

Validator review surfaced spec deviations beyond the original Option-C session
plan. Each was addressed:

- **Behavioral scoring is now in-line with the reading flow.** A second
  Anthropic call (`computeBehavioralScores`, max 200 tokens) runs inside
  `/api/generate` immediately after the free reading completes, and emits the
  scores via the SSE event `behavioral_scores` before the `paywall` event.
  On any failure (network, parse, missing keys), the call returns the default
  `{0.5, 0.5, 0.5, 0.5, 0.5, 0.5}` fallback so the reading flow can never be
  blocked by scoring.
- **`/api/behavioral-profile` never returns non-200.** The standalone endpoint
  is now a wrapper around `computeBehavioralScores` and is kept only as a
  backup path. On any failure it returns 200 with `{ scores: defaults,
  fallback: true }` rather than 4xx/5xx.
- **Profile screen no longer synthesizes scores.** The previous deterministic
  `hashString`/`scoreFor` placeholder has been removed from
  `app/behavioral-profile.tsx`. When `behavioralScores` is `null`, the screen
  renders the locked state. When real scores arrive (via SSE or the backup
  endpoint), they animate into the radar.
- **Bridge-button gating restored to spec.** The "Talk to Oracle About Your
  Profile" button on the reading reveal now routes subscribers to `/chat` and
  re-opens the in-page paywall for non-subscribers (previously routed to
  `/behavioral-profile` for everyone).
- **Per-session paywall AsyncStorage flag.** A new `maybeShowPaywall()` helper
  in `reading.tsx` writes `oracle_paywall_shown_${sessionId}` exactly once per
  session and is skipped for users with the active `full_reading`
  entitlement, who are advanced directly to `streamPaidReading()`.
- **`buildNumber` invariant restored.** Reverted from `2` back to `1` to honor
  the explicit spec rule "do not disturb slug, bundleIdentifier, version,
  buildNumber, projectId."
- **Screenshot deliverables relocated.** All five 1320×2868 PNGs now live
  flat at `artifacts/oracle/assets/app-store/screenshot-[1-5].png` (the
  spec path). The obsolete `artifacts/oracle/app-store/` directory and the
  intermediate `assets/app-store/screenshots/` subdirectory were removed.
  Submission doc paths updated accordingly.
- **Type cast removed.** The `return { points } as any;` in `RadarChart`'s
  `useAnimatedProps` callback has been replaced with a properly typed
  `useAnimatedProps<React.ComponentProps<typeof Polygon>>(...)` signature.

### Intentional deviation (user-approved)

The 3 × 30s App Store preview videos (Section 11) remain skipped per the
user-approved Option-C scope. Apple will accept the resubmission with
screenshots only; preview videos can be added in a follow-up build. Every
other Section 16 verification item passes.

---

# Changes — Oracle 4.3b Quick Wins Pass (Task #59)

**Date:** May 02, 2026

Smaller compliance / positioning fixes layered on top of Task #58. None of these touch `artifacts/api-server/src/routes/oracle.ts`, the questionnaire build, or the asset-generation scripts.

## Files touched

- `artifacts/oracle/lib/revenuecat.tsx` — Added `MONTHLY_PRODUCT_ID = "oracle_monthly_999"` and `ANNUAL_PRODUCT_ID = "oracle_annual_4999"` exports plus a TODO note that the annual SKU must be created in the RevenueCat dashboard and App Store Connect before shipping. Existing `useSubscription` plumbing untouched.
- `artifacts/oracle/app/about.tsx` — New "What Oracle Is — and Isn't" screen with five sections (What Oracle Is / What Oracle Is NOT / How the Hand Analysis Works / A Note on Predictions / Powered By), back button to Settings, and a "Send Feedback" mailto link at the bottom. Dark-navy + gold styling consistent with the rest of the app.
- `artifacts/oracle/app/_layout.tsx` — Registered the new `about` screen in the `Stack`.
- `artifacts/oracle/app/settings.tsx` — Added a new "About" section with two rows: "About Oracle" (chevron, navigates to `/about`) and "Send Feedback" (mail icon, opens `mailto:support@theoracleapp.com?subject=Oracle%20Feedback`).
- `artifacts/oracle/app/reading.tsx` — Replaced the existing reveal-screen disclaimer text with the spec-mandated copy: *"Oracle's behavioral profile is for personal reflection and self-understanding. It is not medical, psychological, or professional advice, and does not predict future events."* Bridge button "Talk to Oracle About Your Profile →" was already wired in Task #58.
- `artifacts/oracle/app/index.tsx` — Renamed the WeeklyForecastCard heading "✦ This Week's Reflection" → "✦ This Week's Focus". Removed `dob` from the request body of both the `/api/daily-oracle` and `/api/weekly-forecast` fetch calls (still sends `profileId` and `name`). Tightened both card components' prop type and `useCallback` dependency arrays to drop `profile.dob` since it's no longer read inside either card. The DailyOracleCard heading was already "✦ Daily Reflection" from Task #58.
- `artifacts/oracle/app/reading.tsx` (paywall) — Added the three gold-checkmark benefit rows above the plan cards in `PaywallGate` ("Complete behavioral profile across all dimensions" / "Unlimited AI advisor conversations" / "Relationship dynamics, deep dives, and daily reflections") with matching `benefitList` / `benefitRow` / `benefitText` styles. Plan cards, "Save 58%" pill, and the $9.99 / $49.99 fallback prices were already in place from Task #58.
- `artifacts/oracle/context/ProfileContext.tsx` — Added optional `coreMotivation?: string` field on the `OracleProfile` shape so the new behavioral indicator helper can read it without breaking profiles created before the questionnaire (Task #60) ships.
- `artifacts/oracle/app/profiles.tsx` — Added `getProfileIndicator(profile)` helper that maps the questionnaire's `coreMotivation` answer to one of: Creator `✦` / Analyst `◈` / Connector `⊕` / Explorer `◎`, falling back to "Seeker" `✧` for unknown values and to a neutral `✦` symbol with no label when no questionnaire data exists. Rendered on the profile card in gold `#f59e0b`. The zodiac glyph computation was already removed in Task #58.

## Out of scope (deliberately not touched)

- `artifacts/api-server/src/routes/oracle.ts` and the questionnaire build — Task #60.
- App Store preview videos — Task #57.
- `artifacts/oracle/assets/app-store/APP-STORE-SUBMISSION.md` (metadata, intentionally retains historical $9.99 string).
- Marketing site / paywall pricing copy / home-card titles / zodiac glyphs — already landed in Task #58 (verified via sweep: no `$4.99`, no zodiac glyphs `♈♉♊♋♌♍♎♏♐♑♒♓`, hero already says "Oracle: AI Life Advisor", FAQ already includes the explicit "Is this a fortune telling app? — No" entry, privacy effective date already May 02 2026).
