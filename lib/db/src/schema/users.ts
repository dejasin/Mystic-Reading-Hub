import { pgTable, text, boolean, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userProfilesTable = pgTable("user_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  localId: text("local_id"),
  name: varchar("name", { length: 255 }).notNull(),
  dob: varchar("dob", { length: 20 }).notNull(),
  birthTime: varchar("birth_time", { length: 10 }),
  birthTimeUnknown: boolean("birth_time_unknown").default(false),
  birthCity: varchar("birth_city", { length: 255 }),
  birthCountry: varchar("birth_country", { length: 255 }),
  gender: varchar("gender", { length: 50 }),
  dominantHand: varchar("dominant_hand", { length: 50 }),
  eyeColor: varchar("eye_color", { length: 50 }),
  notes: text("notes"),
  mainReading: text("main_reading"),
  deepDives: text("deep_dives"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verificationCodesTable = pgTable("verification_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
export type UserProfile = typeof userProfilesTable.$inferSelect;
export type VerificationCode = typeof verificationCodesTable.$inferSelect;
