import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import cron from "node-cron";
import { webpush } from "./webpush";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Push Notifications Schedule
  // Every day at 10 AM, 3 PM, and 5 AM (or 5 PM? We'll do 05:00, 10:00, 15:00)
  cron.schedule('0 5,10,15 * * *', async () => {
    try {
      const subs = await storage.getAllPushSubscriptions();
      const payload = JSON.stringify({
        title: 'Come play on bcCHESS',
        body: 'Challenge your skills against our AI or other players!'
      });
      for (const s of subs) {
        try {
          const subObj = JSON.parse(s.subscription);
          await webpush.sendNotification(subObj, payload);
        } catch (e) {
          console.error("Failed to send push:", e);
        }
      }
    } catch (e) {
      console.error("Cron job error:", e);
    }
  });

  // Users
  app.get(api.users.list.path, async (req, res) => {
    const users = await storage.getTopUsers();
    res.json(users);
  });

  app.post(api.users.getOrCreate.path, async (req, res) => {
    try {
      const input = api.users.getOrCreate.input.parse(req.body);
      let user = await storage.getUserByUsername(input.username);
      if (!user) {
        user = await storage.createUser({ username: input.username, wins: 0, losses: 0, draws: 0, rating: 1200 });
      }
      res.json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.post(api.users.updateStats.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.users.updateStats.input.parse(req.body);
      const user = await storage.updateUserStats(id, input.result);
      res.json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post(api.users.subscribePush.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.users.subscribePush.input.parse(req.body);
      await storage.savePushSubscription({
        userId: id,
        subscription: JSON.stringify(input.subscription)
      });
      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  // Games
  app.post(api.games.create.path, async (req, res) => {
    try {
      const input = api.games.create.input.parse(req.body);
      const game = await storage.createGame(input);
      res.status(201).json(game);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.games.update.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.games.update.input.parse(req.body);
      const game = await storage.updateGame(id, input);
      res.json(game);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  return httpServer;
}
