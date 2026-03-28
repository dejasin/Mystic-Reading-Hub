import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, pushTokensTable, notificationPreferencesTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/notifications/register", async (req: Request, res: Response) => {
  try {
    const { deviceId, token, platform } = req.body;
    if (!deviceId || !token || !platform) {
      res.status(400).json({ error: "deviceId, token, and platform are required" });
      return;
    }

    await db.delete(pushTokensTable).where(eq(pushTokensTable.token, token));

    const id = `pt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await db.insert(pushTokensTable).values({
      id,
      deviceId,
      token,
      platform,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: pushTokensTable.deviceId,
      set: {
        token,
        platform,
        updatedAt: new Date(),
      },
    });

    await db.insert(notificationPreferencesTable).values({
      deviceId,
      dailyPrompts: true,
      weeklyForecasts: true,
      reEngagement: true,
      lastActiveAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: notificationPreferencesTable.deviceId,
      set: {
        lastActiveAt: new Date(),
        updatedAt: new Date(),
      },
    });

    res.json({ success: true, deviceId });
  } catch (error) {
    console.error("Failed to register push token:", error);
    res.status(500).json({ error: "Failed to register push token" });
  }
});

router.post("/notifications/unregister", async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.body;
    if (!deviceId) {
      res.status(400).json({ error: "deviceId is required" });
      return;
    }

    await db.delete(pushTokensTable).where(eq(pushTokensTable.deviceId, deviceId));

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to unregister push token:", error);
    res.status(500).json({ error: "Failed to unregister push token" });
  }
});

router.get("/notifications/preferences/:deviceId", async (req: Request, res: Response) => {
  try {
    const deviceId = req.params.deviceId as string;
    const rows = await db
      .select()
      .from(notificationPreferencesTable)
      .where(eq(notificationPreferencesTable.deviceId, deviceId))
      .limit(1);

    if (rows.length === 0) {
      res.json({
        deviceId,
        dailyPrompts: true,
        weeklyForecasts: true,
        reEngagement: true,
      });
      return;
    }

    const pref = rows[0];
    res.json({
      deviceId: pref.deviceId,
      dailyPrompts: pref.dailyPrompts,
      weeklyForecasts: pref.weeklyForecasts,
      reEngagement: pref.reEngagement,
    });
  } catch (error) {
    console.error("Failed to get notification preferences:", error);
    res.status(500).json({ error: "Failed to get notification preferences" });
  }
});

router.put("/notifications/preferences/:deviceId", async (req: Request, res: Response) => {
  try {
    const deviceId = req.params.deviceId as string;
    const { dailyPrompts, weeklyForecasts, reEngagement } = req.body;

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (typeof dailyPrompts === "boolean") updateData.dailyPrompts = dailyPrompts;
    if (typeof weeklyForecasts === "boolean") updateData.weeklyForecasts = weeklyForecasts;
    if (typeof reEngagement === "boolean") updateData.reEngagement = reEngagement;

    await db.insert(notificationPreferencesTable).values({
      deviceId,
      dailyPrompts: dailyPrompts ?? true,
      weeklyForecasts: weeklyForecasts ?? true,
      reEngagement: reEngagement ?? true,
      lastActiveAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: notificationPreferencesTable.deviceId,
      set: updateData,
    });

    const rows = await db
      .select()
      .from(notificationPreferencesTable)
      .where(eq(notificationPreferencesTable.deviceId, deviceId))
      .limit(1);

    const pref = rows[0];
    res.json({
      deviceId: pref.deviceId,
      dailyPrompts: pref.dailyPrompts,
      weeklyForecasts: pref.weeklyForecasts,
      reEngagement: pref.reEngagement,
    });
  } catch (error) {
    console.error("Failed to update notification preferences:", error);
    res.status(500).json({ error: "Failed to update notification preferences" });
  }
});

router.post("/notifications/activity/:deviceId", async (req: Request, res: Response) => {
  try {
    const deviceId = req.params.deviceId as string;

    await db.insert(notificationPreferencesTable).values({
      deviceId,
      dailyPrompts: true,
      weeklyForecasts: true,
      reEngagement: true,
      lastActiveAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: notificationPreferencesTable.deviceId,
      set: {
        lastActiveAt: new Date(),
        updatedAt: new Date(),
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to record activity:", error);
    res.status(500).json({ error: "Failed to record activity" });
  }
});

export default router;
