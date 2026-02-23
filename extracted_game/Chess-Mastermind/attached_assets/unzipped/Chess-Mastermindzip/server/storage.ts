import { games, type Game, type InsertGame } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  createGame(game: InsertGame): Promise<Game>;
  getGame(id: number): Promise<Game | undefined>;
  updateGame(id: number, pgn: string, status: string): Promise<Game | undefined>;
}

export class DatabaseStorage implements IStorage {
  async createGame(insertGame: InsertGame): Promise<Game> {
    const [game] = await db.insert(games).values(insertGame).returning();
    return game;
  }

  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async updateGame(id: number, pgn: string, status: string): Promise<Game | undefined> {
    const [game] = await db
      .update(games)
      .set({ pgn, status })
      .where(eq(games.id, id))
      .returning();
    return game;
  }
}

export const storage = new DatabaseStorage();
