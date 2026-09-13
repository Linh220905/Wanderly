import { pgTable, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { profilesTable } from "./profiles";

export const explorationSessionsTable = pgTable("exploration_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => profilesTable.id, { onDelete: "cascade" }).notNull(),
  date: text("date").notNull(),
  startedAt: text("started_at").notNull(),
  endedAt: text("ended_at").notNull(),
  duration: integer("duration").notNull(), // seconds
  distance: integer("distance").notNull(), // meters
  cellsRevealed: integer("cells_revealed").notNull(),
  xpEarned: integer("xp_earned").notNull().default(0),
  coinsEarned: integer("coins_earned").notNull().default(0),
  route: jsonb("route").$type<{ latitude: number; longitude: number }[]>().notNull().default([]),
  checkpointsDiscovered: jsonb("checkpoints_discovered").$type<string[]>().default([]),
  activityType: text("activity_type").default("run"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSessionSchema = createInsertSchema(explorationSessionsTable);
export type InsertExplorationSession = z.infer<typeof insertSessionSchema>;
export type ExplorationSession = typeof explorationSessionsTable.$inferSelect;
