import { Link, useLocation } from "wouter";
import { Crown, Gamepad2, Puzzle, Trophy, User } from "lucide-react";
import { useUser } from "@/context/user-context";

export function Navbar() {
  const [location] = useLocation();
  const { user } = useUser();

  const links = [
    { href: "/", label: "Dashboard", icon: Crown },
    { href: "/play", label: "Play AI", icon: Gamepad2 },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 px-4 py-4">
      <div className="max-w-6xl mx-auto glass-panel rounded-2xl px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="bg-primary/20 p-2 rounded-lg border border-primary/30 group-hover:bg-primary/30 transition-colors">
            <Crown className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xl font-bold font-display hidden sm:block text-gradient hover:opacity-80 transition-opacity">
            bcCHESS
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <button
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${
                  location === href
                    ? "bg-white/10 text-white shadow-inner"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:block">{label}</span>
              </button>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-semibold">{user?.username || "Guest"}</span>
            <span className="text-xs text-primary">{user?.rating || 1200} ELO</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary/80 to-indigo-500/80 p-0.5 shadow-lg">
            <div className="w-full h-full bg-background rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-foreground/80" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
