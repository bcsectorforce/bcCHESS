import { createContext, useContext, useEffect, useState } from "react";
import { useGetOrCreateUser } from "@/hooks/use-users";
import { type User } from "@shared/schema";

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const getOrCreateUser = useGetOrCreateUser();

  useEffect(() => {
    const storedUser = localStorage.getItem("chess_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsLoading(false);
    } else {
      setIsLoading(false);
      setShowPrompt(true);
    }
  }, []);

  const handleCreateUser = () => {
    if (!usernameInput.trim()) return;
    getOrCreateUser.mutate(usernameInput.trim(), {
      onSuccess: (data) => {
        setUser(data);
        localStorage.setItem("chess_user", JSON.stringify(data));
        setShowPrompt(false);
      },
    });
  };

  // Keep localStorage in sync when user object changes (e.g. after stats update)
  useEffect(() => {
    if (user) {
      localStorage.setItem("chess_user", JSON.stringify(user));
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser, isLoading }}>
      {children}
      {showPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="glass-panel p-8 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gradient mb-2">Welcome to bcCHESS</h2>
              <p className="text-muted-foreground">Choose a username to start your journey.</p>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter username..."
                className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateUser()}
                autoFocus
              />
              <button
                onClick={handleCreateUser}
                disabled={getOrCreateUser.isPending || !usernameInput.trim()}
                className="w-full px-6 py-3 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed hover-elevate transition-all duration-200"
              >
                {getOrCreateUser.isPending ? "Creating..." : "Start Playing"}
              </button>
            </div>
          </div>
        </div>
      )}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
