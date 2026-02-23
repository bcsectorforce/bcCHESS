import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type User } from "@shared/schema";

export function useUsers() {
  return useQuery({
    queryKey: [api.users.list.path],
    queryFn: async () => {
      const res = await fetch(api.users.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return api.users.list.responses[200].parse(await res.json());
    },
  });
}

export function useGetOrCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) => {
      const payload = api.users.getOrCreate.input.parse({ username });
      const res = await fetch(api.users.getOrCreate.path, {
        method: api.users.getOrCreate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to get or create user");
      return api.users.getOrCreate.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
    },
  });
}

export function useUpdateStats() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, result }: { id: number; result: "win" | "loss" | "draw" }) => {
      const url = buildUrl(api.users.updateStats.path, { id });
      const payload = api.users.updateStats.input.parse({ result });
      const res = await fetch(url, {
        method: api.users.updateStats.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update user stats");
      return api.users.updateStats.responses[200].parse(await res.json());
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      // Invalidate current user query if we had one
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.setQueryData(["currentUser"], updatedUser);
    },
  });
}
