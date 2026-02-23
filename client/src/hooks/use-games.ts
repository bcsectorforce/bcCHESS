import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertGame, type UpdateGameRequest } from "@shared/schema";

export function useGames() {
  return useQuery({
    queryKey: [api.games.list.path],
    queryFn: async () => {
      const res = await fetch(api.games.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch games");
      return api.games.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (game: InsertGame) => {
      const payload = api.games.create.input.parse(game);
      const res = await fetch(api.games.create.path, {
        method: api.games.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create game");
      return api.games.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.games.list.path] }),
  });
}

export function useUpdateGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateGameRequest }) => {
      const url = buildUrl(api.games.update.path, { id });
      const payload = api.games.update.input.parse(updates);
      const res = await fetch(url, {
        method: api.games.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update game");
      return api.games.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.games.list.path] }),
  });
}
