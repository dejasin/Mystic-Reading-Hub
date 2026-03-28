import { pgTable, text, boolean, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";

export const pushTokensTable = pgTable("push_tokens", {
  id: text("id").primaryKey(),
  deviceId: text("device_id").notNull(),
  token: text("token").notNull(),
  platform: text("platform").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("push_tokens_device_id_idx").on(table.deviceId),
  index("push_tokens_token_idx").on(table.token),
]);

export const notificationPreferencesTable = pgTable("notification_preferences", {
  deviceId: text("device_id").primaryKey(),
  dailyPrompts: boolean("daily_prompts").notNull().default(true),
  weeklyForecasts: boolean("weekly_forecasts").notNull().default(true),
  reEngagement: boolean("re_engagement").notNull().default(true),
  lastActiveAt: timestamp("last_active_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type PushToken = typeof pushTokensTable.$inferSelect;
export type NotificationPreference = typeof notificationPreferencesTable.$inferSelect;
