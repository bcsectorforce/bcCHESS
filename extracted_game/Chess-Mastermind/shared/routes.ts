import { z } from 'zod';
import { insertUserSchema, insertGameSchema, insertPuzzleSchema, users, games, puzzles } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users' as const,
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      }
    },
    getOrCreate: {
      method: 'POST' as const,
      path: '/api/users' as const,
      input: z.object({ username: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
      }
    },
    updateStats: {
      method: 'POST' as const,
      path: '/api/users/:id/stats' as const,
      input: z.object({ result: z.enum(['win', 'loss', 'draw']) }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    }
  },
  games: {
    list: {
      method: 'GET' as const,
      path: '/api/games' as const,
      responses: {
        200: z.array(z.custom<typeof games.$inferSelect>()),
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/games' as const,
      input: insertGameSchema,
      responses: {
        201: z.custom<typeof games.$inferSelect>(),
      }
    },
    update: {
      method: 'PUT' as const,
      path: '/api/games/:id' as const,
      input: insertGameSchema.partial(),
      responses: {
        200: z.custom<typeof games.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }
  return url;
}
