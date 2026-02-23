import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

type InsertGame = z.infer<typeof api.games.create.input>;
type UpdateGame = z.infer<typeof api.games.update.input>;

export function useGame(id: number | null) {
  return useQuery({
    queryKey: [api.games.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.games.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch game");
      }
      return api.games.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateGame() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InsertGame) => {
      const validated = api.games.create.input.parse(data);
      const res = await fetch(api.games.create.path, {
        method: api.games.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to create game");
      return api.games.create.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      // Optimistically update the cache for the newly created game
      queryClient.setQueryData([api.games.get.path, data.id], data);
    }
  });
}

export function useUpdateGame() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & UpdateGame) => {
      const validated = api.games.update.input.parse(data);
      const url = buildUrl(api.games.update.path, { id });
      
      const res = await fetch(url, {
        method: api.games.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to update game");
      return api.games.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.setQueryData([api.games.get.path, data.id], data);
    }
  });
}
