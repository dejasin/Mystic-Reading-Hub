import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and } from "drizzle-orm";
import { db, userProfilesTable, type UserProfile } from "@workspace/db";
import { extractUser } from "./auth.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

router.get("/profiles", async (req: Request, res: Response) => {
  const userData = extractUser(req);
  if (!userData) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const profiles = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.userId, userData.userId));

    const mapped = profiles.map((p: UserProfile) => ({
      id: p.id,
      localId: p.localId,
      name: p.name,
      dob: p.dob,
      birthTime: p.birthTime,
      birthTimeUnknown: p.birthTimeUnknown,
      birthCity: p.birthCity,
      birthCountry: p.birthCountry,
      gender: p.gender,
      dominantHand: p.dominantHand,
      eyeColor: p.eyeColor,
      notes: p.notes,
      mainReading: p.mainReading,
      deepDives: p.deepDives ? JSON.parse(p.deepDives) : undefined,
      createdAt: p.createdAt.getTime(),
      updatedAt: p.updatedAt.getTime(),
    }));

    res.json({ profiles: mapped });
  } catch (error) {
    logger.error(error, "Failed to fetch profiles");
    res.status(500).json({ error: "Failed to fetch profiles" });
  }
});

router.post("/profiles", async (req: Request, res: Response) => {
  const userData = extractUser(req);
  if (!userData) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const {
      serverId,
      localId,
      name,
      dob,
      birthTime,
      birthTimeUnknown,
      birthCity,
      birthCountry,
      gender,
      dominantHand,
      eyeColor,
      notes,
      mainReading,
      deepDives,
    } = req.body;

    if (!name || !dob) {
      res.status(400).json({ error: "Name and dob are required" });
      return;
    }

    const deepDivesStr = deepDives ? JSON.stringify(deepDives) : null;

    let existing: UserProfile | undefined;
    if (serverId) {
      const [byServerId] = await db
        .select()
        .from(userProfilesTable)
        .where(
          and(
            eq(userProfilesTable.id, serverId),
            eq(userProfilesTable.userId, userData.userId),
          ),
        )
        .limit(1);
      existing = byServerId;
    }

    if (!existing && localId) {
      const [byLocalId] = await db
        .select()
        .from(userProfilesTable)
        .where(
          and(
            eq(userProfilesTable.localId, localId),
            eq(userProfilesTable.userId, userData.userId),
          ),
        )
        .limit(1);
      existing = byLocalId;
    }

    if (existing) {
        const [updated] = await db
          .update(userProfilesTable)
          .set({
            name,
            dob,
            birthTime: birthTime || null,
            birthTimeUnknown: birthTimeUnknown || false,
            birthCity: birthCity || null,
            birthCountry: birthCountry || null,
            gender: gender || null,
            dominantHand: dominantHand || null,
            eyeColor: eyeColor || null,
            notes: notes || null,
            mainReading: mainReading || null,
            deepDives: deepDivesStr,
            updatedAt: new Date(),
          })
          .where(eq(userProfilesTable.id, existing.id))
          .returning();

        res.json({
          profile: {
            id: updated.id,
            localId: updated.localId,
            name: updated.name,
            dob: updated.dob,
            birthTime: updated.birthTime,
            birthTimeUnknown: updated.birthTimeUnknown,
            birthCity: updated.birthCity,
            birthCountry: updated.birthCountry,
            gender: updated.gender,
            dominantHand: updated.dominantHand,
            eyeColor: updated.eyeColor,
            notes: updated.notes,
            mainReading: updated.mainReading,
            deepDives: updated.deepDives ? JSON.parse(updated.deepDives) : undefined,
            createdAt: updated.createdAt.getTime(),
            updatedAt: updated.updatedAt.getTime(),
          },
        });
        return;
    }

    const [created] = await db
      .insert(userProfilesTable)
      .values({
        userId: userData.userId,
        localId: localId || null,
        name,
        dob,
        birthTime: birthTime || null,
        birthTimeUnknown: birthTimeUnknown || false,
        birthCity: birthCity || null,
        birthCountry: birthCountry || null,
        gender: gender || null,
        dominantHand: dominantHand || null,
        eyeColor: eyeColor || null,
        notes: notes || null,
        mainReading: mainReading || null,
        deepDives: deepDivesStr,
      })
      .returning();

    res.json({
      profile: {
        id: created.id,
        localId: created.localId,
        name: created.name,
        dob: created.dob,
        birthTime: created.birthTime,
        birthTimeUnknown: created.birthTimeUnknown,
        birthCity: created.birthCity,
        birthCountry: created.birthCountry,
        gender: created.gender,
        dominantHand: created.dominantHand,
        eyeColor: created.eyeColor,
        notes: created.notes,
        mainReading: created.mainReading,
        deepDives: created.deepDives ? JSON.parse(created.deepDives) : undefined,
        createdAt: created.createdAt.getTime(),
        updatedAt: created.updatedAt.getTime(),
      },
    });
  } catch (error) {
    logger.error(error, "Failed to upsert profile");
    res.status(500).json({ error: "Failed to save profile" });
  }
});

router.delete("/profiles/:id", async (req: Request, res: Response) => {
  const userData = extractUser(req);
  if (!userData) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const { id } = req.params;

    const [existing] = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, id))
      .limit(1);

    if (!existing || existing.userId !== userData.userId) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    await db
      .delete(userProfilesTable)
      .where(eq(userProfilesTable.id, id));

    res.json({ success: true });
  } catch (error) {
    logger.error(error, "Failed to delete profile");
    res.status(500).json({ error: "Failed to delete profile" });
  }
});

export default router;
