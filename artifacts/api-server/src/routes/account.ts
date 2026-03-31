import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, pushTokensTable, notificationPreferencesTable, referralsTable, referralRedemptionsTable, referralRewardsTable } from "@workspace/db";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/account/delete", async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.body ?? {};

    if (!deviceId || typeof deviceId !== "string") {
      res.status(400).json({ error: "deviceId is required" });
      return;
    }

    logger.info({ event: "account_deletion_requested", deviceId }, "Account deletion request received");

    // Delete push tokens and notification preferences for this device
    await db.delete(pushTokensTable).where(eq(pushTokensTable.deviceId, deviceId));
    await db.delete(notificationPreferencesTable).where(eq(notificationPreferencesTable.deviceId, deviceId));

    // Delete referral rewards for this device
    await db.delete(referralRewardsTable).where(eq(referralRewardsTable.deviceId, deviceId));

    // Delete referral redemptions by this device
    await db.delete(referralRedemptionsTable).where(eq(referralRedemptionsTable.redeemedByDeviceId, deviceId));

    // Delete referral codes owned by this device
    await db.delete(referralsTable).where(eq(referralsTable.ownerDeviceId, deviceId));

    logger.info({ event: "account_deletion_completed", deviceId }, "Account data deleted successfully");

    res.json({ success: true, message: "Account data has been deleted." });
  } catch (err) {
    logger.error({ err }, "Account deletion error");
    res.status(500).json({ error: "Failed to delete account data." });
  }
});

export default router;
