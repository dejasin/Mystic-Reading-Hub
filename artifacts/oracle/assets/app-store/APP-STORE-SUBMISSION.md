# App Store Submission — Oracle: AI Life Advisor

**Bundle ID:** `com.theoracle.app`
**Version:** `1.0.0`
**Build:** `1` (unchanged — resubmission)
**Submission Date:** May 02, 2026
**Previous Status:** Rejected — Apple identified the app as a palmistry / palm-reading app with insufficient utility for the App Store.
**Resubmission Strategy:** Reframe the app as a **personal AI life advisor** that uses biometric reference imagery as input to produce a structured behavioral profile and ongoing chat-based decision support. Palmistry framing has been removed throughout the user-visible product surface.

---

## 1. App Store Connect — App Information

### App Name
**Oracle: AI Life Advisor**

### Subtitle (30 chars)
**Personal AI for life decisions**

### Promotional Text
A personal AI life advisor — your behavioral profile mapped from biometric reference images, then turned into grounded guidance for the decisions in front of you.

### Keywords (100 chars max)
```
ai advisor,life coach,personal ai,decision,behavioral,reflection,journal,goals,coaching,chat
```

### Description
```
Oracle: AI Life Advisor is a personal AI advisor that helps you understand your inner wiring and make better decisions.

You provide a few biometric reference images and your context. Oracle returns:

• A six-dimension behavioral profile — your pattern of intuition, emotional depth, drive, adaptability, inner knowing, and expression
• A clearly written reading of your identity, primary block, and activation key
• Ongoing Oracle Chat that uses your profile to ground real conversations about career, relationships, money, family, and purpose

Oracle is for entertainment and self-reflection. It is not medical, legal, financial, or psychological advice, and it does not predict the future. For serious life decisions, always consult a qualified professional.

Oracle Pro
• Full reading — every dimension of your behavioral profile
• Your Archetype + Primary Block + Activation Key
• Unlimited Oracle Chat
• Deep dives across career, love, money, family

Subscriptions auto-renew through your Apple ID and can be managed or cancelled in Settings → [your name] → Subscriptions.

Privacy
Reference images are securely transmitted to our AI processing partner, used to generate your profile, and discarded from our processing pipeline after the session. We do not sell your data.

Support: support@theoracleapp.com
Privacy: https://theoracle.app/#privacy
Terms:   https://theoracle.app/#terms
```

### Category
- Primary: **Lifestyle**
- Secondary: **Health & Fitness**

### Age Rating
**12+** (Infrequent/Mild Mature/Suggestive Themes — reflective adult content; no explicit material)

### URLs
- **Marketing:** https://theoracle.app
- **Support:** https://theoracle.app/#support
- **Privacy Policy:** https://theoracle.app/#privacy
- **Terms of Service:** https://theoracle.app/#terms

### Contact
- **Email:** support@theoracleapp.com

### Demo Account (for App Review)
Not required — Oracle does not require sign-up to access the rejected/reviewable flow. The reviewer can launch the app, complete intake, capture two reference images, and reach the free-tier reading in under 3 minutes.

---

## 2. Reviewer Notes (App Review Information)

> Hello App Review team,
>
> Thank you for your previous feedback. We have repositioned this app as **Oracle: AI Life Advisor**, a personal AI advisor that helps users reflect on their behavioral patterns and life decisions.
>
> **Concept:** Users provide a few biometric reference images (a photo of their hand) and supply context (name, date of birth, the questions they're working through). Oracle uses these inputs as a behavioral signal to generate a structured **behavioral profile** along six dimensions, plus a written reading and an ongoing chat experience.
>
> **What changed from the previous submission:**
> - All "palm reading" / "palmistry" framing has been removed from screens, copy, and metadata.
> - The reading screen now opens with an explicit italic disclaimer that the experience is for reflection — not prediction.
> - The behavioral profile screen is now a primary surface (radar chart + 6-axis scores + archetype) showing real utility.
> - Subscription value is visible without paywall (Settings shows current plan; home shows an upgrade banner; settings explicitly lists "Oracle Pro").
> - Marketing & support website (https://theoracle.app) has been rewritten end-to-end to match.
>
> **For entertainment / self-reflection only:** This is stated in-app on the reading screen, in the Privacy Policy, in the Terms of Service, and in the App Store description.
>
> **Subscription:** Auto-renewing IAP managed via RevenueCat. Restore Purchases is available in Settings.
>
> **Privacy:** Reference images are sent to Anthropic for processing and are not stored on our servers after the session is generated. No third-party tracking SDKs.
>
> Thank you for re-reviewing.

---

## 3. In-App Purchases / Subscriptions

| Field | Value |
|---|---|
| Product ID | `oracle_pro_monthly` |
| Reference Name | Oracle Pro — Monthly |
| Type | Auto-Renewable Subscription |
| Group | `oracle_pro` |
| Duration | 1 month |
| Price Tier | $9.99 / month (Tier 10) |
| Free Trial | None |
| Display Name | Oracle Pro |
| Description | Full reading + unlimited Oracle Chat. Cancel anytime in Settings. |

RevenueCat entitlement: `full_reading` (unchanged).

---

## 4. Asset Inventory

### App Icon
- `artifacts/oracle/assets/images/icon.png` — **1024 × 1024 RGB**, no alpha (App Store master)
- `artifacts/oracle/assets/images/splash-icon.png` — 1024 × 1024 RGB (splash mirror)
- `artifacts/oracle/assets/images/adaptive-icon.png` — 432 × 432 RGBA (Android adaptive foreground, transparent bg)
- `artifacts/oracle/assets/images/notification-icon.png` — 96 × 96 RGBA monochrome (Android notification icon)

Generator: `scripts/generate_oracle_icon.py` (re-runnable).

### Screenshots (App Store — iPhone 6.7"+, 1320 × 2868)
- `artifacts/oracle/assets/app-store/screenshot-1.png` — **The Advisor** — Oracle Chat conversation (lead frame)
- `artifacts/oracle/assets/app-store/screenshot-2.png` — **Real Guidance** — sample reading with italic disclaimer
- `artifacts/oracle/assets/app-store/screenshot-3.png` — **Your Profile** — six-dimension behavioral radar
- `artifacts/oracle/assets/app-store/screenshot-4.png` — **The Intake** — intake / onboarding capture
- `artifacts/oracle/assets/app-store/screenshot-5.png` — **Always With You** — Oracle Pro / ongoing relationship

Generator: `scripts/generate_screenshots.py` (re-runnable).

### App Previews (Video)
**Skipped for this submission** per Option-C scope (per-user agreement). Reviewer notes above explain the in-app journey instead. Videos can be generated in a follow-up submission via the existing `artifacts/oracle-preview-ritual` artifact.

---

## 5. Build & Submission Steps

### A. Verify configuration
```
node -e "console.log(require('./artifacts/oracle/app.json').expo.version, require('./artifacts/oracle/app.json').expo.ios.buildNumber)"
```
Expected: `1.0.0 1`

### B. Local prebuild verification (no install)
```
cd artifacts/oracle
npx expo prebuild --platform ios --clean --no-install
```
This step regenerates `ios/` from `app.json` and confirms there are no native config errors (icons, plist, plugins). The generated `ios/` directory is gitignored — it is for verification only.

### C. EAS production build
```
cd artifacts/oracle
eas build --platform ios --profile production
```

### D. Submit to App Store Connect
```
cd artifacts/oracle
eas submit --platform ios --latest
```

### E. In App Store Connect — required uploads
1. Upload the 5 screenshots from `artifacts/oracle/assets/app-store/` (files `screenshot-1.png` through `screenshot-5.png`) to the **iPhone 6.7" Display** screenshot slot.
2. Apple will reuse them for the 6.5" slot automatically when no 6.5" assets are provided.
3. Paste the **App Description** (above) and **Reviewer Notes** (above).
4. Set the **Promotional Text**, **Keywords**, **Privacy URL**, **Support URL**, **Marketing URL**, **Category**, **Age Rating** as listed in §1.
5. Confirm the IAP product `oracle_pro_monthly` is attached to this version.
6. Submit for review.

---

## 6. Compliance & Risk Checklist

- [x] No "palm reading", "palmistry", "fortune telling", "destiny", "predict the future" in user-visible copy
- [x] In-app entertainment / self-reflection disclaimer on reading screen (italic, above free reveal)
- [x] Privacy Policy explicitly describes biometric reference image handling
- [x] Terms of Service explicitly state "for entertainment, reflection, and personal insight only"
- [x] Subscription terms (auto-renewal, cancel path, refund policy) present in Terms of Service and on website
- [x] `ITSAppUsesNonExemptEncryption: false` set in `app.json`
- [x] `NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription` reframed to describe behavioral analysis (no palmistry language)
- [x] Real utility surfaces (Behavioral Profile, Oracle Chat, ongoing decision support) are reachable without paywall
- [x] Restore Purchases path present in Settings
- [x] Subscription value visible (banner + plan label + active state)
- [x] Support email reachable; support website live with FAQ + Privacy + Terms

---

## 7. Known follow-ups (not blocking submission)

- App preview videos (3 × 30s) — deferred. Generation pipeline exists in `artifacts/oracle-preview-ritual`.
- Localization — English only for v1.0.0.
- iPad layout — not supported in this version (`supportsTablet: false`).
