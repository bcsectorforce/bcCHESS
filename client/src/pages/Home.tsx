import { Link } from "wouter";
import { Gamepad2, Puzzle, Trophy, TrendingUp, Target, Activity, Bell } from "lucide-react";
import { useUser } from "@/context/user-context";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { user } = useUser();
  const { toast } = useToast();

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast({ title: "Unsupported", description: "Push notifications are not supported by your browser." });
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: 'BKTYLnzy0L8XJXXjfl1J7LFSPSi-1LF6bNecIQrrYjKIwuPBCbrmWyP195VALlrMlU263C-38OTQ2pDNcQaT_Oo'
        });
        
        if (user) {
          await fetch(`/api/users/${user.id}/push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription })
          });
        }
        
        toast({ title: "Subscribed!", description: "You will receive daily chess reminders." });
      } else {
        toast({ title: "Permission Denied", description: "You need to allow notifications." });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to subscribe to notifications." });
    }
  };

  const winRate = user 
    ? (user.wins + user.losses + user.draws === 0 
        ? 0 
        : ((user.wins + 0.5 * user.draws) / (user.wins + user.losses + user.draws)) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen pt-32 pb-16 px-4">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Hero Section */}
        <section className="glass-panel rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
          
          <div className="relative z-10 max-w-2xl space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Master the Game. <br />
              <span className="text-gradient">bcCHESS</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Challenge our advanced Stockfish AI and track your ELO rating against other players worldwide.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/play">
                <button className="px-8 py-4 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 hover-elevate flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5" />
                  Play Against AI
                </button>
              </Link>
              <button onClick={subscribeToPush} className="px-8 py-4 rounded-xl font-bold bg-white/10 text-white hover:bg-white/20 hover-elevate flex items-center gap-2 border border-white/20">
                <Bell className="w-5 h-5 text-amber-400" />
                Enable Daily Reminders
              </button>
            </div>
          </div>
          
          <div className="relative z-10 hidden md:block">
            {/* abstract chessboard art */}
            <div className="grid grid-cols-4 grid-rows-4 gap-1 p-2 bg-white/5 border border-white/10 rounded-2xl shadow-2xl rotate-12 hover:rotate-0 transition-transform duration-700 w-64 h-64">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className={`rounded-md ${i % 2 === Math.floor(i / 4) % 2 ? 'bg-white/10' : 'bg-primary/20'}`} />
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-6 flex items-start gap-4">
            <div className="bg-blue-500/20 p-3 rounded-xl border border-blue-500/30">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Current Rating</p>
              <h3 className="text-3xl font-bold text-foreground">{user?.rating || 1200}</h3>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 flex items-start gap-4">
            <div className="bg-emerald-500/20 p-3 rounded-xl border border-emerald-500/30">
              <Target className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Win Rate</p>
              <h3 className="text-3xl font-bold text-foreground">{winRate}%</h3>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 flex items-start gap-4">
            <div className="bg-purple-500/20 p-3 rounded-xl border border-purple-500/30">
              <Activity className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Games</p>
              <h3 className="text-3xl font-bold text-foreground">
                {user ? user.wins + user.losses + user.draws : 0}
              </h3>
              <div className="flex gap-2 text-xs font-mono mt-2 text-muted-foreground">
                <span className="text-emerald-400">{user?.wins || 0}W</span>
                <span className="text-crimson-400">{user?.losses || 0}L</span>
                <span className="text-gray-400">{user?.draws || 0}D</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
