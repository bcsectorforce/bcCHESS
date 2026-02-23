import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function usePuzzles() {
  return useQuery({
    queryKey: [api.puzzles.list.path],
    queryFn: async () => {
      const res = await fetch(api.puzzles.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch puzzles");
      return api.puzzles.list.responses[200].parse(await res.json());
    },
  });
}

export function useRandomPuzzle() {
  return useQuery({
    queryKey: [api.puzzles.random.path],
    queryFn: async () => {
      const res = await fetch(api.puzzles.random.path, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch random puzzle");
      }
      return api.puzzles.random.responses[200].parse(await res.json());
    },
    refetchOnWindowFocus: false,
  });
}
