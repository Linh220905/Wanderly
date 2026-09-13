import { pgTable, text, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const profilesTable = pgTable("profiles", {
  id: text("id").primaryKey(), // Supabase user UUID or device UUID
  name: text("name").notNull().default("Explorer"),
  email: text("email"),
  authProvider: text("auth_provider"), // 'apple' | 'google' | 'guest'
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  coins: integer("coins").notNull().default(100),
  streak: integer("streak").notNull().default(0),
  lastActiveDate: text("last_active_date"),
  premium: boolean("premium").notNull().default(false),
  units: text("units").notNull().default("metric"), // 'metric' | 'imperial'
  fogColor: text("fog_color").notNull().default("#071B1C"),
  explorerType: text("explorer_type").default("City Pathfinder"),
  totalDistance: integer("total_distance").notNull().default(0),
  totalExplored: integer("total_explored").notNull().default(0),
  totalSessions: integer("total_sessions").notNull().default(0),
  totalCheckpoints: integer("total_checkpoints").notNull().default(0),
  revealedRoute: jsonb("revealed_route").$type<{ latitude: number; longitude: number }[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProfileSchema = createInsertSchema(profilesTable);
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profilesTable.$inferSelect;
