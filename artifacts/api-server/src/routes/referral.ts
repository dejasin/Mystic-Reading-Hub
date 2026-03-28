import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, pool, referralsTable, referralRedemptionsTable, referralRewardsTable } from "@workspace/db";
import crypto from "crypto";

const router: IRouter = Router();

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

router.post("/referral/code", async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.body;
    if (!deviceId || typeof deviceId !== "string") {
      res.status(400).json({ error: "deviceId is required" });
      return;
    }

    const existing = await db
      .select()
      .from(referralsTable)
      .where(eq(referralsTable.ownerDeviceId, deviceId))
      .limit(1);

    if (existing.length > 0) {
      res.json({
        referralCode: existing[0].referralCode,
        referralCount: existing[0].referralCount,
      });
      return;
    }

    let code = generateReferralCode();
    let attempts = 0;
    while (attempts < 10) {
      const conflict = await db
        .select()
        .from(referralsTable)
        .where(eq(referralsTable.referralCode, code))
        .limit(1);
      if (conflict.length === 0) break;
      code = generateReferralCode();
      attempts++;
    }

    await db.insert(referralsTable).values({
      referralCode: code,
      ownerDeviceId: deviceId,
      referralCount: 0,
    });

    res.json({ referralCode: code, referralCount: 0 });
  } catch (e) {
    console.error("Failed to generate referral code:", e);
    res.status(500).json({ error: "Failed to generate referral code" });
  }
});

router.post("/referral/redeem", async (req: Request, res: Response) => {
  try {
    const { referralCode, deviceId } = req.body;
    if (!referralCode || !deviceId) {
      res.status(400).json({ error: "referralCode and deviceId are required" });
      return;
    }

    const code = referralCode.toUpperCase().trim();

    const referral = await db
      .select()
      .from(referralsTable)
      .where(eq(referralsTable.referralCode, code))
      .limit(1);

    if (referral.length === 0) {
      res.status(404).json({ error: "Invalid referral code" });
      return;
    }

    if (referral[0].ownerDeviceId === deviceId) {
      res.status(400).json({ error: "You cannot use your own referral code" });
      return;
    }

    const alreadyRedeemed = await db
      .select()
      .from(referralRedemptionsTable)
      .where(eq(referralRedemptionsTable.redeemedByDeviceId, deviceId))
      .limit(1);

    if (alreadyRedeemed.length > 0) {
      res.json({ success: true, alreadyRedeemed: true, message: "You have already used a referral code" });
      return;
    }

    await db.transaction(async (tx) => {
      const [redemption] = await tx
        .insert(referralRedemptionsTable)
        .values({
          referralCode: code,
          redeemedByDeviceId: deviceId,
        })
        .returning();

      await tx
        .update(referralsTable)
        .set({ referralCount: sql`${referralsTable.referralCount} + 1` })
        .where(eq(referralsTable.referralCode, code));

      await tx.insert(referralRewardsTable).values([
        {
          deviceId: referral[0].ownerDeviceId,
          rewardType: "free_deep_dive",
          used: false,
          sourceRedemptionId: redemption.id,
        },
        {
          deviceId,
          rewardType: "free_deep_dive",
          used: false,
          sourceRedemptionId: redemption.id,
        },
      ]);
    });

    res.json({ success: true, alreadyRedeemed: false, message: "Referral code applied! You earned a free deep-dive reading." });
  } catch (e) {
    console.error("Failed to redeem referral code:", e);
    res.status(500).json({ error: "Failed to redeem referral code" });
  }
});

router.get("/referral/stats/:deviceId", async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;

    const referral = await db
      .select()
      .from(referralsTable)
      .where(eq(referralsTable.ownerDeviceId, deviceId))
      .limit(1);

    const rewards = await db
      .select()
      .from(referralRewardsTable)
      .where(
        and(
          eq(referralRewardsTable.deviceId, deviceId),
          eq(referralRewardsTable.used, false)
        )
      );

    res.json({
      referralCode: referral[0]?.referralCode ?? null,
      referralCount: referral[0]?.referralCount ?? 0,
      freeDeepDives: rewards.length,
    });
  } catch (e) {
    console.error("Failed to get referral stats:", e);
    res.status(500).json({ error: "Failed to get referral stats" });
  }
});

router.post("/referral/use-reward", async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.body;
    if (!deviceId) {
      res.status(400).json({ error: "deviceId is required" });
      return;
    }

    const reward = await db
      .select()
      .from(referralRewardsTable)
      .where(
        and(
          eq(referralRewardsTable.deviceId, deviceId),
          eq(referralRewardsTable.rewardType, "free_deep_dive"),
          eq(referralRewardsTable.used, false)
        )
      )
      .limit(1);

    if (reward.length === 0) {
      res.json({ success: false, message: "No available rewards" });
      return;
    }

    await db
      .update(referralRewardsTable)
      .set({ used: true })
      .where(eq(referralRewardsTable.id, reward[0].id));

    res.json({ success: true, message: "Reward applied" });
  } catch (e) {
    console.error("Failed to use reward:", e);
    res.status(500).json({ error: "Failed to use reward" });
  }
});

export default router;
