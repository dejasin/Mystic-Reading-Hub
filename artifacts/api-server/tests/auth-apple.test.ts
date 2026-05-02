import { describe, it, expect, beforeEach, vi } from "vitest";
import express from "express";
import request from "supertest";

// jose is mocked so the route never reaches Apple's network JWKS endpoint.
vi.mock("jose", () => {
  return {
    createRemoteJWKSet: vi.fn(() => "mock-jwks"),
    jwtVerify: vi.fn(),
  };
});

import { jwtVerify } from "jose";
import authRouter from "../src/routes/auth";
import { __resetDb, __getUserByEmail, __seedUser } from "./__mocks__/db";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", authRouter);
  return app;
}

const HAPPY_TOKEN = "header.payload.sig";
const APPLE_SUB = "001234.deadbeef.5678";

describe("POST /api/auth/apple", () => {
  beforeEach(() => {
    __resetDb();
    vi.mocked(jwtVerify).mockReset();
  });

  it("400s when identityToken is missing", async () => {
    const res = await request(buildApp())
      .post("/api/auth/apple")
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/identityToken/i);
    expect(jwtVerify).not.toHaveBeenCalled();
  });

  it("400s when identityToken is not a string", async () => {
    const res = await request(buildApp())
      .post("/api/auth/apple")
      .send({ identityToken: 12345 });
    expect(res.status).toBe(400);
    expect(jwtVerify).not.toHaveBeenCalled();
  });

  it("creates a new user and returns a JWT on the happy path", async () => {
    vi.mocked(jwtVerify).mockResolvedValueOnce({
      payload: { sub: APPLE_SUB, email: "seeker@example.com" },
      protectedHeader: { alg: "RS256" },
    } as never);

    const res = await request(buildApp())
      .post("/api/auth/apple")
      .send({ identityToken: HAPPY_TOKEN });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user.email).toBe("seeker@example.com");

    // Confirms the route forwarded the right verification options
    const call = vi.mocked(jwtVerify).mock.calls[0];
    expect(call?.[0]).toBe(HAPPY_TOKEN);
    expect(call?.[2]).toMatchObject({
      issuer: "https://appleid.apple.com",
      audience: process.env.APPLE_BUNDLE_ID ?? "com.theoracle.app",
    });

    // User should now be persisted in the fake store
    expect(__getUserByEmail("seeker@example.com")).toBeTruthy();
  });

  it("falls back to a private-relay synthetic email when Apple omits one", async () => {
    vi.mocked(jwtVerify).mockResolvedValueOnce({
      payload: { sub: APPLE_SUB }, // no email
      protectedHeader: { alg: "RS256" },
    } as never);

    const res = await request(buildApp())
      .post("/api/auth/apple")
      .send({ identityToken: HAPPY_TOKEN });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(`${APPLE_SUB}@privaterelay.appleid`);
  });

  it("reuses an existing user instead of creating a duplicate", async () => {
    __seedUser({ email: "returning@example.com", emailVerified: true });

    vi.mocked(jwtVerify).mockResolvedValueOnce({
      payload: { sub: APPLE_SUB, email: "returning@example.com" },
      protectedHeader: { alg: "RS256" },
    } as never);

    const res = await request(buildApp())
      .post("/api/auth/apple")
      .send({ identityToken: HAPPY_TOKEN });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("returning@example.com");
  });

  it("401s when jose rejects the audience", async () => {
    vi.mocked(jwtVerify).mockRejectedValueOnce(
      Object.assign(new Error('unexpected "aud" claim value'), {
        code: "ERR_JWT_CLAIM_VALIDATION_FAILED",
        claim: "aud",
      }),
    );

    const res = await request(buildApp())
      .post("/api/auth/apple")
      .send({ identityToken: "wrong.audience.token" });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Apple sign-in failed/i);
  });

  it("401s when the token signature is invalid", async () => {
    vi.mocked(jwtVerify).mockRejectedValueOnce(
      Object.assign(new Error("signature verification failed"), {
        code: "ERR_JWS_SIGNATURE_VERIFICATION_FAILED",
      }),
    );

    const res = await request(buildApp())
      .post("/api/auth/apple")
      .send({ identityToken: "tampered.token.here" });

    expect(res.status).toBe(401);
  });

  it("400s when the Apple token has no sub claim", async () => {
    vi.mocked(jwtVerify).mockResolvedValueOnce({
      payload: { email: "no-sub@example.com" },
      protectedHeader: { alg: "RS256" },
    } as never);

    const res = await request(buildApp())
      .post("/api/auth/apple")
      .send({ identityToken: HAPPY_TOKEN });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/sub/i);
  });
});
