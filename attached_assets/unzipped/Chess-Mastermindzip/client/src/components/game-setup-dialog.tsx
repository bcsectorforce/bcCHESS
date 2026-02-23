import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Swords, BrainCircuit, User, Sparkles } from "lucide-react";

interface GameSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (color: "w" | "b", difficulty: "easy" | "medium" | "hard") => void;
}

export function GameSetupDialog({ open, onOpenChange, onStart }: GameSetupDialogProps) {
  const [color, setColor] = useState<"w" | "b">("w");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  const handleStart = () => {
    onStart(color, difficulty);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] glass-panel border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-gradient flex items-center justify-center gap-2">
            <Swords className="w-6 h-6 text-primary" />
            New Match
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Configure your game settings before challenging the engine.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-8">
          {/* Color Selection */}
          <div className="space-y-4">
            <Label className="text-sm font-medium tracking-wider uppercase text-muted-foreground">Play as</Label>
            <RadioGroup 
              value={color} 
              onValueChange={(val) => setColor(val as "w" | "b")}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="w" id="color-w" className="peer sr-only" />
                <Label
                  htmlFor="color-w"
                  className="flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer bg-background/50 hover:bg-white/5 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-white border border-gray-200 shadow-inner mb-3" />
                  <span className="font-semibold">White</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="b" id="color-b" className="peer sr-only" />
                <Label
                  htmlFor="color-b"
                  className="flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer bg-background/50 hover:bg-white/5 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-[#1e293b] border border-gray-800 shadow-inner mb-3" />
                  <span className="font-semibold">Black</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Difficulty Selection */}
          <div className="space-y-4">
            <Label className="text-sm font-medium tracking-wider uppercase text-muted-foreground">AI Difficulty</Label>
            <RadioGroup 
              value={difficulty} 
              onValueChange={(val) => setDifficulty(val as "easy" | "medium" | "hard")}
              className="grid gap-3"
            >
              {[
                { id: "easy", name: "Beginner", icon: User, elo: "800", desc: "For casual players" },
                { id: "medium", name: "Intermediate", icon: BrainCircuit, elo: "1300", desc: "A solid challenge" },
                { id: "hard", name: "Grandmaster", icon: Sparkles, elo: "2500+", desc: "Stockfish at high depth" },
              ].map((level) => (
                <div key={level.id}>
                  <RadioGroupItem value={level.id} id={`diff-${level.id}`} className="peer sr-only" />
                  <Label
                    htmlFor={`diff-${level.id}`}
                    className="flex items-center p-4 border-2 rounded-xl cursor-pointer bg-background/50 hover:bg-white/5 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 transition-all"
                  >
                    <div className={`p-2 rounded-lg mr-4 ${difficulty === level.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      <level.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{level.name}</div>
                      <div className="text-xs text-muted-foreground">{level.desc}</div>
                    </div>
                    <div className="text-sm font-mono opacity-60">
                      {level.elo} ELO
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <Button 
          className="w-full py-6 text-lg font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all hover:-translate-y-0.5" 
          onClick={handleStart}
        >
          Start Game
        </Button>
      </DialogContent>
    </Dialog>
  );
}
