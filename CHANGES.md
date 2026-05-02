# Changes — Oracle App Store Resubmission (Task #58)

**Scope:** Reframe Oracle from a palm-reading app to a **personal AI life advisor** that uses biometric reference images as a behavioral input signal. Option-C scope: TestFlight-visible surface only. App Store preview videos are intentionally skipped.

**Date:** May 02, 2026
**Bundle ID:** `com.theoracle.app` (unchanged)
**Version:** `1.0.0` (unchanged)
**Build Number:** `1` → `2`

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
- `app.json` — `ITSAppUsesNonExemptEncryption: false`, behavioral-aware `NSCameraUsageDescription` / `NSPhotoLibraryUsageDescription`, Android `adaptiveIcon` + `expo-notifications` icon wired, `buildNumber` 1 → 2.
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
- `app-store/screenshots/screenshot_{1..5}*.png` — New (5 × 1320×2868).
- `APP-STORE-SUBMISSION.md` — New, complete submission package: App Store Connect metadata, reviewer notes, build steps, compliance checklist.

### Marketing & support website — `artifacts/oracle-website/`
- `index.html` — Title, hero, eyebrow, three feature cards, four-entry FAQ, privacy "Information We Collect" + "How Your Reference Images Are Used", terms acceptable-use line, effective date May 02 2026 (×2).

### Tooling — `scripts/`
- `generate_oracle_icon.py` — Extended to also output `adaptive-icon.png` (432×432 RGBA) and `notification-icon.png` (96×96 RGBA monochrome) in addition to icon + splash. Includes re-runnable verification block.
- `generate_app_store_screenshots.py` — New. Pillow-based generator for 5 × 1320×2868 marketing screenshots (hero / behavioral profile / reading / chat / subscription).

### Submission documentation
- `CHANGES.md` (this file) — Top-level changelog.
- `artifacts/oracle/APP-STORE-SUBMISSION.md` — Full submission package.

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
- Auto-paywall AsyncStorage per-session flag — current SSE-driven paywall trigger is correct on the server side and was left as-is.

---

## How to verify locally

```bash
# 1. Regenerate assets if needed
python scripts/generate_oracle_icon.py
python scripts/generate_app_store_screenshots.py

# 2. Prebuild verification (regenerates ios/ from app.json — gitignored)
cd artifacts/oracle
npx expo prebuild --platform ios --clean --no-install

# 3. Visual sanity check the support website
pnpm --filter @workspace/oracle-website run dev
```
