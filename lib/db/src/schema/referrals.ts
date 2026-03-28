import { pgTable, text, integer, timestamp, serial, boolean } from "drizzle-orm/pg-core";

export const referralsTable = pgTable("referrals", {
  referralCode: text("referral_code").primaryKey(),
  ownerDeviceId: text("owner_device_id").notNull().unique(),
  referralCount: integer("referral_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const referralRedemptionsTable = pgTable("referral_redemptions", {
  id: serial("id").primaryKey(),
  referralCode: text("referral_code").notNull().references(() => referralsTable.referralCode),
  redeemedByDeviceId: text("redeemed_by_device_id").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const referralRewardsTable = pgTable("referral_rewards", {
  id: serial("id").primaryKey(),
  deviceId: text("device_id").notNull(),
  rewardType: text("reward_type").notNull().default("free_deep_dive"),
  used: boolean("used").notNull().default(false),
  sourceRedemptionId: integer("source_redemption_id").references(() => referralRedemptionsTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Referral = typeof referralsTable.$inferSelect;
export type ReferralRedemption = typeof referralRedemptionsTable.$inferSelect;
export type ReferralReward = typeof referralRewardsTable.$inferSelect;
