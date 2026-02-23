import { z } from "zod";
import { insertGameSchema, games } from "./schema";

export const api = {
  games: {
    create: {
      method: "POST" as const,
      path: "/api/games" as const,
      input: insertGameSchema,
      responses: {
        201: z.custom<typeof games.$inferSelect>(),
        400: z.object({ message: z.string() }),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/games/:id" as const,
      responses: {
        200: z.custom<typeof games.$inferSelect>(),
        404: z.object({ message: z.string() }),
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/games/:id" as const,
      input: z.object({ pgn: z.string(), status: z.string() }),
      responses: {
        200: z.custom<typeof games.$inferSelect>(),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
