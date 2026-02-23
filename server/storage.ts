import { db } from "./db";
import { users, games, puzzles, pushSubscriptions } from "@shared/schema";
import type { User, InsertUser, Game, InsertGame, UpdateGameRequest, Puzzle, InsertPuzzle, PushSubscription, InsertPushSubscription } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStats(id: number, result: 'win' | 'loss' | 'draw'): Promise<User>;
  getTopUsers(): Promise<User[]>;

  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: number, game: UpdateGameRequest): Promise<Game>;
  getGame(id: number): Promise<Game | undefined>;
  
  getRandomPuzzle(): Promise<Puzzle | undefined>;
  createPuzzle(puzzle: InsertPuzzle): Promise<Puzzle>;

  savePushSubscription(sub: InsertPushSubscription): Promise<void>;
  getAllPushSubscriptions(): Promise<PushSubscription[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserStats(id: number, result: 'win' | 'loss' | 'draw'): Promise<User> {
    const [currentUser] = await db.select().from(users).where(eq(users.id, id));
    if (!currentUser) throw new Error("User not found");

    const updateMap: Record<string, any> = {};
    const K = 32; // Standard Elo K-factor
    const opponentRating = 1200; // Assuming stockfish-like opponent
    
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - currentUser.rating) / 400));
    let actualScore = 0.5;
    
    if (result === 'win') {
      updateMap.wins = sql`${users.wins} + 1`;
      actualScore = 1;
    } else if (result === 'loss') {
      updateMap.losses = sql`${users.losses} + 1`;
      actualScore = 0;
    } else {
      updateMap.draws = sql`${users.draws} + 1`;
      actualScore = 0.5;
    }

    // Don't update rating for draws (as per user request: draw only affecting total games)
    // Wait, user said: "current rating, win rate, and total games should updated instantly after every game, with a resign being a loss, and a draw only affecting total games, and stale mate not affecting anything but total games played."
    // This implies rating only changes on win/loss.
    if (result === 'win' || result === 'loss') {
      const newRating = Math.round(currentUser.rating + K * (actualScore - expectedScore));
      updateMap.rating = newRating;
    }

    const [user] = await db.update(users).set(updateMap).where(eq(users.id, id)).returning();
    return user;
  }

  async getTopUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.rating)).limit(50);
  }

  async createGame(game: InsertGame): Promise<Game> {
    const [newGame] = await db.insert(games).values(game).returning();
    return newGame;
  }

  async updateGame(id: number, update: UpdateGameRequest): Promise<Game> {
    const [updatedGame] = await db.update(games).set(update).where(eq(games.id, id)).returning();
    return updatedGame;
  }

  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async getRandomPuzzle(): Promise<Puzzle | undefined> {
    const allPuzzles = await db.select().from(puzzles);
    if (allPuzzles.length === 0) return undefined;
    return allPuzzles[Math.floor(Math.random() * allPuzzles.length)];
  }

  async createPuzzle(puzzle: InsertPuzzle): Promise<Puzzle> {
    const [newPuzzle] = await db.insert(puzzles).values(puzzle).returning();
    return newPuzzle;
  }

  async savePushSubscription(sub: InsertPushSubscription): Promise<void> {
    // Check if it already exists for the user to avoid duplicates
    const existing = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.subscription, sub.subscription));
    if (existing.length === 0) {
      await db.insert(pushSubscriptions).values(sub);
    }
  }

  async getAllPushSubscriptions(): Promise<PushSubscription[]> {
    return await db.select().from(pushSubscriptions);
  }
}

export const storage = new DatabaseStorage();
