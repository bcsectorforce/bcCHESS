import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  pgn: text("pgn").notNull(),
  playerColor: text("player_color").notNull(), // 'w' or 'b'
  difficulty: text("difficulty").notNull(), // 'easy', 'medium', 'hard'
  status: text("status").notNull(), // 'active', 'completed'
});

export const insertGameSchema = createInsertSchema(games).omit({ id: true });
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;
