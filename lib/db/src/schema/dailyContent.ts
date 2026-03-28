import { pgTable, text, timestamp, integer, uniqueIndex } from "drizzle-orm/pg-core";

export const dailyContentTable = pgTable("daily_content", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  profileId: text("profile_id").notNull(),
  contentType: text("content_type").notNull(),
  contentDate: text("content_date").notNull(),
  content: text("content").notNull(),
  lifePathNumber: integer("life_path_number"),
  sunSign: text("sun_sign"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("daily_content_profile_type_date_idx").on(table.profileId, table.contentType, table.contentDate),
]);
