import { pgTable, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const sessionsTable = pgTable("sessions", {
  sessionId: text("session_id").primaryKey(),
  paid: boolean("paid").notNull().default(false),
  reading: text("reading").notNull().default(""),
  messageCount: integer("message_count").notNull().default(0),
  readingComplete: boolean("reading_complete").notNull().default(false),
  hadPalmImages: boolean("had_palm_images").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Session = typeof sessionsTable.$inferSelect;
