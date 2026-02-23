import { useState, useEffect, useRef, useMemo } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import confetti from "canvas-confetti";
import { 
  RotateCcw, Lightbulb, Flag, Shield, BrainCircuit, Activity, Settings2
} from "lucide-react";
import { useChessEngine } from "@/hooks/use-chess-engine";
import { useCreateGame, useUpdateGame } from "@/hooks/use-games";
import { useUpdateStats } from "@/hooks/use-users";
import { useUser } from "@/context/user-context";

const DIFFICULTY_DEPTH = { easy: 6, medium: 10, hard: 15 };

export default function Play() {
  const { user, setUser } = useUser();
  const { getBestMove, isThinking } = useChessEngine();
  const createGame = useCreateGame();
  const updateGame = useUpdateGame();
  const updateStats = useUpdateStats();
  
  const [chess] = useState(new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'gameover'>('setup');
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [dbGameId, setDbGameId] = useState<number | null>(null);

  const [lastMove, setLastMove] = useState<{from: string, to: string} | null>(null);
  const [hintMove, setHintMove] = useState<{from: string, to: string} | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, React.CSSProperties>>({});
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  
  const historyRef = useRef<HTMLDivElement>(null);

  // Sync scroll
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [fen]);

  const handleResign = () => {
    if (gameState !== 'playing') return;
    setGameState('gameover');
    if (dbGameId) updateGame.mutate({ id: dbGameId, updates: { pgn: chess.pgn(), status: 'completed', result: 'loss' } });
    if (user) {
      updateStats.mutate({ id: user.id, result: 'loss' }, {
        onSuccess: (updatedUser) => {
          setUser(updatedUser);
        }
      });
    }
  };

  // Handle Game Over
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    if (chess.isGameOver()) {
      setGameState('gameover');
      let result: 'win' | 'loss' | 'draw' = 'draw';
      
      if (chess.isCheckmate()) {
        result = chess.turn() === playerColor ? 'loss' : 'win';
      } else if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
        result = 'draw';
      }
      
      if (result === 'win') {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      }

      // Mark the game as completed in the DB
      if (dbGameId) {
        updateGame.mutate({ id: dbGameId, updates: { pgn: chess.pgn(), status: 'completed', result } });
      }

      // Update user stats - only if we have a user and we haven't updated for this game yet
      if (user && dbGameId) {
        updateStats.mutate({ id: user.id, result }, {
          onSuccess: (updatedUser) => {
            setUser(updatedUser);
          }
        });
      }
    }
  }, [fen, playerColor]); // Only re-run when FEN or playerColor changes to detect game over

  // AI Turn
  useEffect(() => {
    if (gameState !== 'playing' || chess.isGameOver()) return;
    const isPlayerTurn = chess.turn() === playerColor;
    
    if (!isPlayerTurn && !isThinking) {
      const makeAIMove = async () => {
        const depth = DIFFICULTY_DEPTH[difficulty];
        const moveString = await getBestMove(chess.fen(), depth);
        
        if (moveString) {
          try {
            const from = moveString.substring(0, 2);
            const to = moveString.substring(2, 4);
            const promotion = moveString.length > 4 ? moveString.substring(4, 5) : undefined;
            
            const move = chess.move({ from, to, promotion });
            if (move) {
              setFen(chess.fen());
              setLastMove({ from: move.from, to: move.to });
              setHintMove(null);
              if (dbGameId) {
                updateGame.mutate({ id: dbGameId, updates: { pgn: chess.pgn(), status: 'active' } });
              }
            }
          } catch (e) {
            console.error("AI move error:", e);
          }
        }
      };
      const timer = setTimeout(makeAIMove, 500);
      return () => clearTimeout(timer);
    }
  }, [fen, gameState, playerColor, difficulty, isThinking, dbGameId, getBestMove, chess, updateGame]);

  const handleStart = () => {
    chess.reset();
    setFen(chess.fen());
    setLastMove(null);
    setHintMove(null);
    setGameState('playing');
    
    if (user) {
      createGame.mutate(
        { userId: user.id, pgn: chess.pgn(), playerColor, difficulty, status: 'active' },
        { onSuccess: (data) => setDbGameId(data.id) }
      );
    }
  };

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
      newSquares[move.to] = {
        background:
          chess.get(move.to as any)
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

  const onSquareClick = (square: string) => {
    if (gameState !== 'playing' || chess.turn() !== playerColor) return;

    // If we have a selected square, try to move there
    if (selectedSquare) {
      // If clicking the same square, deselect
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setOptionSquares({});
        return;
      }

      const move = chess.move({
        from: selectedSquare,
        to: square,
        promotion: "q",
      });

      if (move) {
        setFen(chess.fen());
        setLastMove({ from: move.from, to: move.to });
        setHintMove(null);
        setSelectedSquare(null);
        setOptionSquares({});
        if (dbGameId) {
          updateGame.mutate({ id: dbGameId, updates: { pgn: chess.pgn(), status: 'active' } });
        }
        return;
      }
    }

    // Otherwise select the piece and show moves
    const hasMoves = getMoveOptions(square);
    if (hasMoves) {
      setSelectedSquare(square);
    } else {
      setSelectedSquare(null);
      setOptionSquares({});
    }
  };

  // Add global click listener to deselect
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // If clicking outside the board container, deselect
      const boardElement = document.querySelector('.chess-board-wrapper');
      if (boardElement && !boardElement.contains(e.target as Node) && selectedSquare) {
        setSelectedSquare(null);
        setOptionSquares({});
      }
    };

    window.addEventListener('mousedown', handleGlobalClick);
    return () => window.removeEventListener('mousedown', handleGlobalClick);
  }, [selectedSquare]);

  const onDrop = (source: string, target: string, piece: string) => {
    return false; // Disable drag and drop in favor of click-to-move
  };

  const handleUndo = () => {
    if (gameState !== 'playing' || isThinking) return;
    const history = chess.history();
    if (history.length === 0) return;
    
    if (chess.turn() === playerColor) {
      chess.undo(); chess.undo();
    } else {
      chess.undo();
    }
    setFen(chess.fen());
    setLastMove(null);
    setHintMove(null);
  };

  const handleHint = async () => {
    if (gameState !== 'playing' || chess.turn() !== playerColor || isThinking) return;
    const moveString = await getBestMove(chess.fen(), 15);
    if (moveString) {
      setHintMove({ from: moveString.substring(0, 2), to: moveString.substring(2, 4) });
    }
  };

  const customSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    if (lastMove) {
      styles[lastMove.from] = { backgroundColor: 'rgba(234, 179, 8, 0.4)' };
      styles[lastMove.to] = { backgroundColor: 'rgba(234, 179, 8, 0.4)' };
    }
    if (hintMove) {
      styles[hintMove.from] = { backgroundColor: 'rgba(59, 130, 246, 0.5)', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)' };
      styles[hintMove.to] = { backgroundColor: 'rgba(59, 130, 246, 0.5)', border: '3px solid #3b82f6' };
    }
    if (chess.inCheck()) {
      const board = chess.board();
      const color = chess.turn();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (board[r][c]?.type === 'k' && board[r][c]?.color === color) {
            styles[`${'abcdefgh'[c]}${8-r}`] = { backgroundColor: 'rgba(239, 68, 68, 0.8)' };
          }
        }
      }
    }
    return { ...styles, ...optionSquares };
  }, [lastMove, hintMove, fen, chess, optionSquares]);

  const history = chess.history();
  const pairedMoves = [];
  for (let i = 0; i < history.length; i += 2) {
    pairedMoves.push({ w: history[i], b: history[i + 1] || "" });
  }

  return (
    <div className="min-h-screen pt-28 pb-12 px-4 max-w-7xl mx-auto">
      {gameState === 'setup' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="glass-panel p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <h2 className="text-3xl font-bold text-center mb-8 text-gradient">Game Setup</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-3">Play as</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setPlayerColor('w')}
                    className={`py-4 rounded-xl font-bold transition-all border ${playerColor === 'w' ? 'bg-white text-black border-white shadow-lg' : 'bg-black/40 text-white border-white/10 hover:bg-black/60'}`}
                  >White</button>
                  <button 
                    onClick={() => setPlayerColor('b')}
                    className={`py-4 rounded-xl font-bold transition-all border ${playerColor === 'b' ? 'bg-black text-white border-white shadow-lg' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                  >Black</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-3">Difficulty</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['easy', 'medium', 'hard'] as const).map(diff => (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      className={`py-3 rounded-xl font-semibold capitalize transition-all border ${difficulty === diff ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleStart}
                className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover-elevate shadow-lg shadow-indigo-500/25 mt-4"
              >
                Start Game
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 animate-in slide-in-from-bottom-8 duration-700">
        
        {/* Main Board Area */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className="w-full max-w-[640px] space-y-4">
            
            {/* Opponent Info */}
            <div className="glass-panel px-4 py-3 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-xl border border-primary/30">
                  <BrainCircuit className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold flex items-center gap-2">
                    Stockfish AI
                    {isThinking && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full animate-pulse border border-primary/30">Thinking...</span>}
                  </h3>
                  <p className="text-xs text-muted-foreground">Level {DIFFICULTY_DEPTH[difficulty]} ({difficulty})</p>
                </div>
              </div>
            </div>

            {/* The Board */}
            <div className="chess-board-wrapper relative bg-black/40 p-1">
              {gameState === 'gameover' && (
                <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center rounded-lg animate-in zoom-in-95 duration-300">
                  <div className="glass-panel p-8 rounded-3xl text-center shadow-2xl border-white/20">
                    <h2 className="text-4xl font-bold mb-4 text-gradient-gold">Game Over</h2>
                    <p className="text-xl text-muted-foreground mb-8">
                      {chess.isCheckmate() ? (chess.turn() === playerColor ? "Checkmate. You lost." : "Checkmate! You won!") : "It's a draw."}
                    </p>
                    <button 
                      onClick={() => setGameState('setup')} 
                      className="px-8 py-3 rounded-xl font-bold bg-primary text-white hover-elevate"
                    >
                      Play Again
                    </button>
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
                isDraggablePiece={() => false}
              />
            </div>

            {/* Player Info */}
            <div className="glass-panel px-4 py-3 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-xl border border-white/20">
                  <Shield className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <h3 className="font-bold flex items-center gap-2">
                    {user?.username || "You"}
                    {gameState === 'playing' && chess.turn() === playerColor && !isThinking && (
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">Your Turn</span>
                    )}
                  </h3>
                  <p className="text-xs text-muted-foreground">Playing as {playerColor === 'w' ? 'White' : 'Black'}</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-panel rounded-3xl p-5 space-y-4">
            <h3 className="font-semibold text-sm tracking-wider uppercase text-muted-foreground flex items-center gap-2 mb-2">
              <Settings2 className="w-4 h-4" /> Controls
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleUndo} 
                disabled={gameState !== 'playing' || isThinking || history.length === 0}
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 transition-all"
              >
                <RotateCcw className="w-4 h-4" /> Undo
              </button>
              <button 
                onClick={handleHint}
                disabled={gameState !== 'playing' || isThinking || chess.turn() !== playerColor}
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 transition-all text-yellow-400"
              >
                <Lightbulb className="w-4 h-4" /> Hint
              </button>
            </div>
            
            <button 
              onClick={handleResign}
              disabled={gameState !== 'playing'}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-destructive/80 text-white hover:bg-destructive disabled:opacity-50 transition-all hover-elevate shadow-lg shadow-destructive/20"
            >
              <Flag className="w-4 h-4" /> Resign
            </button>
          </div>

          <div className="glass-panel rounded-3xl flex-1 min-h-[300px] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-white/5 bg-black/20">
              <h3 className="font-semibold text-sm tracking-wider uppercase text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" /> Move History
              </h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto" ref={historyRef}>
              {pairedMoves.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 text-sm">
                  No moves played
                </div>
              ) : (
                <div className="space-y-1">
                  {pairedMoves.map((pair, idx) => (
                    <div key={idx} className={`flex text-sm p-2 rounded-lg ${idx % 2 === 0 ? 'bg-white/[0.03]' : 'bg-transparent'}`}>
                      <div className="w-10 text-muted-foreground font-mono">{idx + 1}.</div>
                      <div className="flex-1 font-mono font-medium">{pair.w}</div>
                      <div className="flex-1 font-mono font-medium text-muted-foreground">{pair.b}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
