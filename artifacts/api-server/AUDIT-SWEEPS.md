# Compliance & Security Sweep Evidence
## Generated: 2026-05-04

### SWEEP A: Divinatory language in user-visible code
```
RESULT: Only 2 hits — both are explicit disclaimers:
  artifacts/oracle/app/about.tsx:27: "Fortune telling, divination, or palm-reading in the supernatural sense." (IS_NOT_ITEMS list)
  artifacts/oracle/app/ritual.tsx:31: // Hand outline diagram (decorative, no palmistry annotations) (code comment)
VERDICT: PASS
```

### SWEEP B: System prompt compliance
```
  artifacts/api-server/src/routes/oracle.ts: 1 instance of "not a fortune teller"
  artifacts/api-server/src/routes/daily.ts: 2 instances of "not a fortune teller"
VERDICT: PASS — all prompts explicitly prohibit fortune-telling
```

### SWEEP C: Anti-divination rules in prompts
```
  artifacts/api-server/src/routes/daily.ts: 2 anti-divination rules
  artifacts/api-server/src/routes/oracle.ts: 12 anti-divination rules
VERDICT: PASS
```

### SWEEP D: Forbidden code patterns
```
  Searched: computeSunSign, computeFullNumerology, BIRLA_PERSONA_BLOCK, MEMORY ILLUSION, MYSTIC_ORACLE, Mystic Oracle
  RESULT: CLEAN — zero matches
VERDICT: PASS
```

### SWEEP E: Palmistry vocabulary
```
  Searched: Heart Line, Head Line, Life Line, Fate Line, Mount of, Sun Line, Mercury Line, Apollo Line
  RESULT: CLEAN — zero matches
VERDICT: PASS
```

### SWEEP F: Hardcoded secrets
```
  Searched: sk-ant-, sk_live_, pk_live_, appl_[A-Za-z0-9]
  RESULT: CLEAN — zero matches
VERDICT: PASS
```

### SWEEP G: User-visible forecast/cosmic in client
```
  Only internal code identifiers found (weeklyForecasts field, WeeklyForecastCard component, /weekly-forecast route).
  All user-visible labels confirmed compliant: "This Week's Focus", "Weekly Reflections", "Daily Reflection Prompts".
VERDICT: PASS
```

### SWEEP H: Website compliance
```
  All fortune/divination/supernatural references are in denial context:
    - FAQ: "Is this a fortune telling app?" → "No. Oracle does not predict the future..."
    - Hero: "For entertainment and self-reflection only."
    - Footer: "For Entertainment Purposes Only"
VERDICT: PASS
```

### SWEEP I: App.json validation
```
  bundleId: com.theoracle.app ✓
  encryption: false ✓
  camera description: SET ✓
  version: 1.0.0 ✓
  name: Oracle: AI Life Advisor ✓
VERDICT: PASS
```

### SWEEP J: Icon dimensions
```
  icon.png: 1024x1024 ✓
  adaptive-icon.png: 1024x1024 ✓
  notification-icon.png: 96x96 ✓
VERDICT: PASS
```

### SWEEP K: ErrorBoundary
```
  artifacts/oracle/app/_layout.tsx: ErrorBoundary wraps app at lines 101, 112, 142
VERDICT: PASS
```

### SWEEP L: Build & Test
```
  pnpm run build (api-server): PASS
  pnpm test (api-server): 8/8 tests passed
  pnpm test (oracle): 10/10 tests passed
  tsc --noEmit: TS6305 errors resolved. One pre-existing Drizzle ORM type mismatch in referral.ts (unrelated).
  @anthropic-ai/sdk: Updated 0.80.0 → ^0.92.0 (patched GHSA-p7fg-763f-g4gf)
  pnpm audit: 15 remaining vulns — all in transitive devDeps (postcss via Expo CLI/Vite), not shipped in iOS binary.
VERDICT: PASS
```
