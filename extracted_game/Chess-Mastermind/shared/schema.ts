import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  wins: integer("wins").default(0).notNull(),
  losses: integer("losses").default(0).notNull(),
  draws: integer("draws").default(0).notNull(),
  rating: integer("rating").default(1200).notNull(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  pgn: text("pgn").notNull(),
  playerColor: text("player_color").notNull(), // 'w' or 'b'
  difficulty: text("difficulty").notNull(), // 'easy', 'medium', 'hard'
  status: text("status").notNull(), // 'active', 'completed'
  result: text("result"), // 'win', 'loss', 'draw'
});

export const puzzles = pgTable("puzzles", {
  id: serial("id").primaryKey(),
  fen: text("fen").notNull(),
  solution: text("solution").notNull(), // space separated e.g. "e2e4 e7e5"
  rating: integer("rating").default(1000).notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertGameSchema = createInsertSchema(games).omit({ id: true });
export const insertPuzzleSchema = createInsertSchema(puzzles).omit({ id: true });

// Export Types
export type User = typeof users.$inferSelect;
export type Game = typeof games.$inferSelect;
export type Puzzle = typeof puzzles.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type InsertPuzzle = z.infer<typeof insertPuzzleSchema>;

export type UpdateGameRequest = Partial<InsertGame>;
export type UpdateUserRequest = Partial<InsertUser>;
