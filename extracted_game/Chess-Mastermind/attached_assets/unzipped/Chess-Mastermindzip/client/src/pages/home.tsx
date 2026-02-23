import { useState, useEffect, useRef, useMemo } from "react";
import { Chess, Move } from "chess.js";
import { Chessboard } from "react-chessboard";
import { useToast } from "@/hooks/use-toast";
import { useChessEngine } from "@/hooks/use-chess-engine";
import { useCreateGame, useUpdateGame } from "@/hooks/use-games";
import { GameSetupDialog } from "@/components/game-setup-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  RotateCcw, 
  Lightbulb, 
  Flag, 
  Settings, 
  History, 
  Activity, 
  Crown,
  Info,
  BrainCircuit,
  User,
  Bell
} from "lucide-react";

// Difficulty settings mapping to Stockfish depth
const DIFFICULTY_DEPTH = {
  easy: 1,    // Very basic
  medium: 5,  // Solid moves
  hard: 15    // Strong analysis
};

type GameState = 'setup' | 'playing' | 'gameover';

export default function Home() {
  const { toast } = useToast();
  const { getBestMove, isThinking } = useChessEngine();
  
  // Game state
  const [chess] = useState(new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [gameState, setGameState] = useState<GameState>('setup');
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // Visual state
  const [hintMove, setHintMove] = useState<{from: string, to: string} | null>(null);
  const [lastMove, setLastMove] = useState<{from: string, to: string} | null>(null);
  const moveHistoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Not supported",
        description: "Your browser doesn't support notifications.",
        variant: "destructive"
      });
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      toast({
        title: "Enabled",
        description: "You'll receive practice reminders at 8am, 11am, 3pm, and 8pm.",
      });
      
      // In a real app, we'd register these on the server or use Periodic Sync API
      // For this demo, we'll explain it's set up in the Service Worker logic
      console.log("Daily notifications scheduled for 8:00, 11:00, 15:00, 20:00");
    }
  };
  
  // DB state
  const [dbGameId, setDbGameId] = useState<number | null>(null);
  const createGame = useCreateGame();
  const updateGame = useUpdateGame();

  // Scroll history to bottom when fen changes
  useEffect(() => {
    if (moveHistoryRef.current) {
      moveHistoryRef.current.scrollTop = moveHistoryRef.current.scrollHeight;
    }
  }, [fen]);

  // Check game over conditions
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    if (chess.isGameOver()) {
      setGameState('gameover');
      
      let reason = "Game Over";
      if (chess.isCheckmate()) reason = "Checkmate!";
      else if (chess.isDraw()) reason = "Draw";
      else if (chess.isStalemate()) reason = "Stalemate";
      
      toast({
        title: reason,
        description: "The game has ended.",
        variant: "default",
      });

      if (dbGameId) {
        updateGame.mutate({ id: dbGameId, pgn: chess.pgn(), status: 'completed' });
      }
    }
  }, [fen, chess, gameState, toast, dbGameId, updateGame]);

  // AI turn execution
  useEffect(() => {
    if (gameState !== 'playing' || chess.isGameOver()) return;
    
    const isPlayerTurn = chess.turn() === playerColor;
    
    if (!isPlayerTurn && !isThinking) {
      const makeAIMove = async () => {
        const depth = DIFFICULTY_DEPTH[difficulty];
        // Ensure we are getting the move for the current FEN
        const currentFen = chess.fen();
        const moveString = await getBestMove(currentFen, depth);
        
        if (moveString) {
          try {
            const from = moveString.substring(0, 2);
            const to = moveString.substring(2, 4);
            const promotion = moveString.length > 4 ? moveString.substring(4, 5) : undefined;
            
            // Validate move before applying
            const move = chess.move({ from, to, promotion });
            if (move) {
              setFen(chess.fen());
              setLastMove({ from: move.from, to: move.to });
              setHintMove(null);
              
              if (dbGameId) {
                updateGame.mutate({ id: dbGameId, pgn: chess.pgn(), status: 'active' });
              }
            }
          } catch (e) {
            console.error("Invalid move from AI:", moveString, e);
          }
        }
      };
      
      const timer = setTimeout(makeAIMove, 500);
      return () => clearTimeout(timer);
    }
  }, [fen, gameState, playerColor, difficulty, isThinking, dbGameId]); // Reduced dependencies to avoid loops

  const handleStartGame = (color: "w" | "b", diff: "easy" | "medium" | "hard") => {
    chess.reset();
    setFen(chess.fen());
    setPlayerColor(color);
    setDifficulty(diff);
    setLastMove(null);
    setHintMove(null);
    setGameState('playing');
    
    // Create new game in DB
    createGame.mutate(
      { pgn: chess.pgn(), playerColor: color, difficulty: diff, status: 'active' },
      { onSuccess: (data) => setDbGameId(data.id) }
    );
  };

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, React.CSSProperties>>({});

  function getMoveOptions(square: string) {
    const moves = chess.moves({
      square: square as any,
      verbose: true,
    });
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares: Record<string, React.CSSProperties> = {};
    moves.forEach((move) => {
      const pieceAtTarget = chess.get(move.to as any);
      const pieceAtSource = chess.get(square as any);
      newSquares[move.to] = {
        background:
          pieceAtTarget && pieceAtSource && pieceAtTarget.color !== pieceAtSource.color
            ? "radial-gradient(circle, rgba(255,0,0,.1) 85%, transparent 85%)"
            : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
        borderRadius: "50%",
      };
    });
    newSquares[square] = {
      background: "rgba(255, 255, 0, 0.4)",
    };
    setOptionSquares(newSquares);
    return true;
  }

  function onSquareClick(square: string) {
    if (gameState !== 'playing' || chess.turn() !== playerColor) return;

    // Move piece
    if (selectedSquare) {
      const move = chess.move({
        from: selectedSquare,
        to: square,
        promotion: "q", // always promote to a queen for example simplicity
      });

      if (move) {
        setFen(chess.fen());
        setLastMove({ from: move.from, to: move.to });
        setHintMove(null);
        setSelectedSquare(null);
        setOptionSquares({});
        
        if (dbGameId) {
          updateGame.mutate({ id: dbGameId, pgn: chess.pgn(), status: 'active' });
        }
        return;
      }
    }

    // Select piece
    const hasMoves = getMoveOptions(square);
    if (hasMoves) {
      setSelectedSquare(square);
    } else {
      setSelectedSquare(null);
      setOptionSquares({});
    }
  }

  const onDrop = (sourceSquare: string, targetSquare: string, piece: string) => {
    if (gameState !== 'playing' || chess.turn() !== playerColor) return false;

    try {
      // Handle pawn promotion gracefully
      const isPromotion = 
        (piece.toLowerCase()[1] === 'p' && targetSquare[1] === '8' && chess.turn() === 'w') ||
        (piece.toLowerCase()[1] === 'p' && targetSquare[1] === '1' && chess.turn() === 'b');
        
      const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: isPromotion ? 'q' : undefined,
      });

      if (move) {
        setFen(chess.fen());
        setLastMove({ from: move.from, to: move.to });
        setHintMove(null);
        setSelectedSquare(null);
        setOptionSquares({});
        
        // Update DB
        if (dbGameId) {
          updateGame.mutate({ id: dbGameId, pgn: chess.pgn(), status: 'active' });
        }
        return true;
      }
    } catch (e) {
      console.error("Move error:", e);
      return false;
    }
    return false;
  };

  const handleUndo = () => {
    if (gameState !== 'playing' || isThinking) return;
    
    // If it's player's turn, we undo AI's move and our previous move (2 steps)
    // If we just started, we can't undo
    const history = chess.history();
    if (history.length === 0) return;
    
    if (chess.turn() === playerColor) {
      chess.undo(); // Undo AI
      chess.undo(); // Undo Player
    } else {
      chess.undo(); // Only undo player if AI hasn't moved yet
    }
    
    setFen(chess.fen());
    setLastMove(null);
    setHintMove(null);
    
    if (dbGameId) {
      updateGame.mutate({ id: dbGameId, pgn: chess.pgn(), status: 'active' });
    }
  };

  const handleHint = async () => {
    if (gameState !== 'playing' || chess.turn() !== playerColor || isThinking) return;
    
    // Request a high-depth hint regardless of difficulty setting
    const moveString = await getBestMove(chess.fen(), 15);
    
    if (moveString) {
      const from = moveString.substring(0, 2);
      const to = moveString.substring(2, 4);
      setHintMove({ from, to });
      toast({
        title: "Hint ready",
        description: "The optimal move squares have been highlighted.",
        duration: 3000,
      });
    } else {
      toast({
        title: "No hint available",
        description: "Couldn't analyze the position.",
        variant: "destructive",
      });
    }
  };

  const handleResign = () => {
    if (gameState !== 'playing') return;
    setGameState('gameover');
    toast({
      title: "Resigned",
      description: "You have resigned the game.",
    });
    if (dbGameId) {
      updateGame.mutate({ id: dbGameId, pgn: chess.pgn(), status: 'completed' });
    }
  };

  // Compute square styles for highlighting
  const customSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    
    if (lastMove) {
      styles[lastMove.from] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
      styles[lastMove.to] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
    }
    
    if (hintMove) {
      styles[hintMove.from] = { 
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
      };
      styles[hintMove.to] = { 
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
        border: '3px solid #3b82f6'
      };
    }
    
    // Highlight check
    if (chess.inCheck()) {
      // Find king position
      const board = chess.board();
      const color = chess.turn();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (board[r][c]?.type === 'k' && board[r][c]?.color === color) {
            const files = 'abcdefgh';
            const square = `${files[c]}${8-r}`;
            styles[square] = { backgroundColor: 'rgba(239, 68, 68, 0.7)' };
          }
        }
      }
    }
    
    return {
      ...styles,
      ...optionSquares
    };
  }, [lastMove, hintMove, fen, chess, optionSquares]);

  // Format move history into pairs
  const moveHistory = chess.history();
  const pairedMoves: {w: string, b: string}[] = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    pairedMoves.push({
      w: moveHistory[i],
      b: moveHistory[i + 1] || ""
    });
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center">
      
      <GameSetupDialog 
        open={gameState === 'setup'} 
        onOpenChange={(v) => { if(!v && gameState === 'setup') { /* force keep open until started */ } }}
        onStart={handleStartGame}
      />

      <header className="w-full flex items-center justify-between mb-8 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-lg border border-primary/30">
            <Crown className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gradient">Grandmaster AI</h1>
            <p className="text-sm text-muted-foreground">Powered by Stockfish</p>
          </div>
        </div>
        
        {gameState !== 'setup' && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={requestNotifications} 
              className={`hover-elevate glass-panel ${notificationsEnabled ? 'text-green-500' : ''}`}
            >
              <Bell className="w-4 h-4 mr-2" />
              {notificationsEnabled ? 'Notifications On' : 'Notify Me'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setGameState('setup')} className="hover-elevate glass-panel">
              <Settings className="w-4 h-4 mr-2" />
              New Game
            </Button>
          </div>
        )}
      </header>

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 animate-slide-up">
        
        {/* Main Board Area */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center">
          <div className="w-full max-w-[640px] relative">
            
            {/* Opponent Info */}
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shadow-sm ${playerColor === 'w' ? 'bg-black border-white/10 text-white' : 'bg-white border-gray-200 text-black'}`}>
                  <BrainCircuit className="w-6 h-6 opacity-80" />
                </div>
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    Engine Level {DIFFICULTY_DEPTH[difficulty]}
                    {isThinking && (
                      <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 animate-pulse">
                        Thinking...
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {difficulty} Difficulty
                  </div>
                </div>
              </div>
            </div>

            {/* The Board */}
            <div className="chess-board-wrapper bg-card relative">
              {/* Game Over Overlay */}
              {gameState === 'gameover' && (
                <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
                  <div className="p-6 text-center glass-panel rounded-2xl shadow-2xl">
                    <h2 className="text-3xl font-bold mb-2">Game Over</h2>
                    <p className="text-lg text-muted-foreground mb-6">
                      {chess.isCheckmate() ? (chess.turn() === playerColor ? "You were checkmated" : "You delivered checkmate!") : "It's a draw!"}
                    </p>
                    <Button onClick={() => setGameState('setup')} size="lg" className="w-full text-lg">
                      Play Again
                    </Button>
                  </div>
                </div>
              )}

              <Chessboard 
                position={fen}
                boardOrientation={playerColor === 'w' ? 'white' : 'black'}
                onPieceDrop={onDrop}
                onSquareClick={onSquareClick}
                customDarkSquareStyle={{ backgroundColor: 'hsl(var(--muted))' }}
                customLightSquareStyle={{ backgroundColor: 'hsl(var(--foreground) / 0.1)' }}
                customSquareStyles={customSquareStyles}
                animationDuration={300}
                isDraggablePiece={({ piece }) => {
                  if (gameState !== 'playing') return false;
                  // Only allow dragging player's own pieces
                  const pieceColor = piece[0];
                  return pieceColor === playerColor;
                }}
              />
            </div>

            {/* Player Info */}
            <div className="flex items-center justify-between mt-4 px-2">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shadow-sm ${playerColor === 'b' ? 'bg-black border-white/10 text-white' : 'bg-white border-gray-200 text-black'}`}>
                  <User className="w-6 h-6 opacity-80" />
                </div>
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    You
                    {gameState === 'playing' && chess.turn() === playerColor && !isThinking && (
                      <Badge variant="outline" className="border-green-500/50 text-green-500 bg-green-500/10">
                        Your Turn
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Playing as {playerColor === 'w' ? 'White' : 'Black'}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Sidebar Controls & History */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Action Controls */}
          <Card className="glass-panel p-4 flex flex-col gap-3">
            <h3 className="font-semibold text-sm tracking-wider uppercase text-muted-foreground flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4" /> Controls
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="secondary" 
                onClick={handleUndo} 
                disabled={gameState !== 'playing' || isThinking || moveHistory.length === 0}
                className="hover-elevate bg-secondary/50 border border-white/5"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Undo
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleHint}
                disabled={gameState !== 'playing' || isThinking || chess.turn() !== playerColor}
                className="hover-elevate bg-secondary/50 border border-white/5"
              >
                <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
                Hint
              </Button>
            </div>
            
            <Button 
              variant="destructive" 
              onClick={handleResign}
              disabled={gameState !== 'playing'}
              className="w-full hover-elevate shadow-lg shadow-destructive/20"
            >
              <Flag className="w-4 h-4 mr-2" />
              Resign Game
            </Button>
          </Card>

          {/* Move History */}
          <Card className="glass-panel flex-1 min-h-[300px] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border/50 bg-black/20">
              <h3 className="font-semibold text-sm tracking-wider uppercase text-muted-foreground flex items-center gap-2">
                <History className="w-4 h-4" /> Move History
              </h3>
            </div>
            
            <ScrollArea className="flex-1 p-4" ref={moveHistoryRef}>
              {pairedMoves.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-4 py-12">
                  <Info className="w-8 h-8" />
                  <p className="text-sm">No moves played yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {pairedMoves.map((pair, idx) => (
                    <div key={idx} className={`flex text-sm p-2 rounded ${idx % 2 === 0 ? 'bg-white/5' : 'bg-transparent'}`}>
                      <div className="w-8 text-muted-foreground font-mono font-medium">{idx + 1}.</div>
                      <div className="flex-1 font-mono font-medium">{pair.w}</div>
                      <div className="flex-1 font-mono font-medium">{pair.b}</div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>

        </div>
      </div>
    </div>
  );
}
