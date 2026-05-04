import { Router, type IRouter, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { eq, and, gt } from "drizzle-orm";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { db, usersTable, verificationCodesTable } from "@workspace/db";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === "production"
  ? (() => { throw new Error("JWT_SECRET must be set in production"); })()
  : "oracle-dev-jwt-secret");
const CODE_EXPIRY_MINUTES = 10;

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const SEND_CODE_MAX = 5;
const VERIFY_CODE_MAX = 10;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, max: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function signToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "30d" });
}

function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  } catch {
    return null;
  }
}

export function extractUser(req: Request): { userId: string; email: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  return verifyToken(token);
}

router.post("/auth/send-code", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      res.status(400).json({ error: "Valid email is required" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!checkRateLimit(`send:${normalizedEmail}`, SEND_CODE_MAX)) {
      res.status(429).json({ error: "Too many requests. Please try again later." });
      return;
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

    await db.insert(verificationCodesTable).values({
      email: normalizedEmail,
      code,
      expiresAt,
    });

    if (process.env.NODE_ENV !== "production") {
      logger.info({ email: normalizedEmail, code }, "Verification code generated (dev only — logging to console)");
      console.log(`\n========================================`);
      console.log(`  VERIFICATION CODE for ${normalizedEmail}`);
      console.log(`  Code: ${code}`);
      console.log(`  Expires: ${expiresAt.toISOString()}`);
      console.log(`========================================\n`);
    } else {
      logger.info({ email: normalizedEmail }, "Verification code generated");
    }

    res.json({ success: true, message: "Verification code sent" });
  } catch (error) {
    logger.error(error, "Failed to send verification code");
    res.status(500).json({ error: "Failed to send verification code" });
  }
});

router.post("/auth/verify-code", async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      res.status(400).json({ error: "Email and code are required" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!checkRateLimit(`verify:${normalizedEmail}`, VERIFY_CODE_MAX)) {
      res.status(429).json({ error: "Too many attempts. Please try again later." });
      return;
    }

    const [verification] = await db
      .select()
      .from(verificationCodesTable)
      .where(
        and(
          eq(verificationCodesTable.email, normalizedEmail),
          eq(verificationCodesTable.code, code),
          eq(verificationCodesTable.used, false),
          gt(verificationCodesTable.expiresAt, new Date()),
        ),
      )
      .orderBy(verificationCodesTable.createdAt)
      .limit(1);

    if (!verification) {
      res.status(400).json({ error: "Invalid or expired verification code" });
      return;
    }

    await db
      .update(verificationCodesTable)
      .set({ used: true })
      .where(eq(verificationCodesTable.id, verification.id));

    let [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, normalizedEmail))
      .limit(1);

    if (!user) {
      [user] = await db
        .insert(usersTable)
        .values({ email: normalizedEmail, emailVerified: true })
        .returning();
    } else if (!user.emailVerified) {
      await db
        .update(usersTable)
        .set({ emailVerified: true })
        .where(eq(usersTable.id, user.id));
    }

    const token = signToken(user.id, user.email);

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    logger.error(error, "Failed to verify code");
    res.status(500).json({ error: "Failed to verify code" });
  }
});

// ── Sign in with Apple (Task #60) ───────────────────────────────────────
//
// The Expo client calls expo-apple-authentication, receives an `identityToken`
// signed by Apple, and POSTs it here. We verify the token against Apple's
// JWKS, confirm the audience (our iOS bundle ID), then upsert the user
// against `apple_sub@privaterelay.appleid` (or the real email when Apple
// gives us one on first sign-in) and return the same JWT we mint for the
// email-code flow so the client treats the session identically.
const APPLE_BUNDLE_ID = process.env.APPLE_BUNDLE_ID ?? "com.theoracle.app";
const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

router.post("/auth/apple", async (req: Request, res: Response) => {
  try {
    const { identityToken, fullName, email: clientEmail } = req.body as {
      identityToken?: string;
      fullName?: { givenName?: string | null; familyName?: string | null } | null;
      email?: string | null;
    };

    if (!identityToken || typeof identityToken !== "string") {
      res.status(400).json({ error: "identityToken is required" });
      return;
    }

    const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
      issuer: "https://appleid.apple.com",
      audience: APPLE_BUNDLE_ID,
    });

    const sub = typeof payload.sub === "string" ? payload.sub : null;
    if (!sub) {
      res.status(400).json({ error: "Invalid Apple token (missing sub)" });
      return;
    }

    const tokenEmail = typeof payload.email === "string" ? payload.email : null;
    const email = (tokenEmail ?? clientEmail ?? `${sub}@privaterelay.appleid`).toLowerCase().trim();

    let [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!user) {
      [user] = await db
        .insert(usersTable)
        .values({ email, emailVerified: true })
        .returning();
    } else if (!user.emailVerified) {
      await db
        .update(usersTable)
        .set({ emailVerified: true })
        .where(eq(usersTable.id, user.id));
    }

    const token = signToken(user.id, user.email);

    logger.info({ userId: user.id, email, hasFullName: !!fullName }, "Apple sign-in succeeded");

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    logger.error(error, "Apple sign-in failed");
    res.status(401).json({ error: "Apple sign-in failed. Please try again." });
  }
});

router.get("/auth/me", async (req: Request, res: Response) => {
  const userData = extractUser(req);
  if (!userData) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userData.userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    logger.error(error, "Failed to fetch user");
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;
