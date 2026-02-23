import { useUsers } from "@/hooks/use-users";
import { Trophy, Medal, Star, Shield } from "lucide-react";
import { useUser } from "@/context/user-context";

export default function Leaderboard() {
  const { data: users, isLoading } = useUsers();
  const { user: currentUser } = useUser();

  if (isLoading) {
    return <div className="min-h-screen pt-32 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  // Sort by rating descending
  const sortedUsers = [...(users || [])].sort((a, b) => b.rating - a.rating);

  return (
    <div className="min-h-screen pt-28 pb-12 px-4 max-w-4xl mx-auto">
      
      <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="inline-flex items-center gap-2 bg-amber-500/20 px-4 py-2 rounded-full border border-amber-500/30 mb-4 text-amber-500 font-medium">
          <Trophy className="w-5 h-5" />
          Global Rankings
        </div>
        <h1 className="text-4xl font-bold text-gradient">Hall of Grandmasters</h1>
        <p className="text-muted-foreground mt-2">The highest rated players worldwide.</p>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 border-b border-white/5">
                <th className="p-4 pl-8 font-semibold text-muted-foreground">Rank</th>
                <th className="p-4 font-semibold text-muted-foreground">Player</th>
                <th className="p-4 font-semibold text-muted-foreground">Rating</th>
                <th className="p-4 font-semibold text-muted-foreground hidden sm:table-cell">W-L-D</th>
                <th className="p-4 pr-8 font-semibold text-muted-foreground hidden md:table-cell">Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((u, i) => {
                const isCurrentUser = currentUser?.id === u.id;
                const totalGames = u.wins + u.losses + u.draws;
                const winRate = totalGames > 0 ? (((u.wins + 0.5 * u.draws) / totalGames) * 100).toFixed(1) : "0.0";
                
                let rankIcon = null;
                if (i === 0) rankIcon = <Medal className="w-6 h-6 text-amber-400" />;
                else if (i === 1) rankIcon = <Medal className="w-6 h-6 text-slate-300" />;
                else if (i === 2) rankIcon = <Medal className="w-6 h-6 text-amber-700" />;

                return (
                  <tr 
                    key={u.id} 
                    className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${isCurrentUser ? 'bg-primary/10' : ''}`}
                  >
                    <td className="p-4 pl-8 font-display font-bold text-lg">
                      <div className="flex items-center gap-2">
                        {rankIcon || <span className="w-6 text-center text-muted-foreground">#{i + 1}</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${i < 3 ? 'bg-gradient-to-tr from-amber-400 to-yellow-600 text-black' : 'bg-white/10 text-white'}`}>
                          {i < 3 ? <Star className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                        </div>
                        <span className={`font-semibold ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                          {u.username}
                          {isCurrentUser && <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">You</span>}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-blue-400 font-mono text-lg">{u.rating}</td>
                    <td className="p-4 hidden sm:table-cell font-mono text-sm">
                      <span className="text-emerald-400">{u.wins}</span> -{' '}
                      <span className="text-destructive">{u.losses}</span> -{' '}
                      <span className="text-slate-400">{u.draws}</span>
                    </td>
                    <td className="p-4 pr-8 hidden md:table-cell font-mono font-medium text-muted-foreground">
                      {winRate}%
                    </td>
                  </tr>
                );
              })}
              
              {sortedUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No players found. Be the first to join!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
