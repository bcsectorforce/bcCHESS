import { useState, useCallback } from 'react';

interface EngineResponse {
  success: boolean;
  bestmove?: string;
  error?: string;
}

export function useChessEngine() {
  const [isThinking, setIsThinking] = useState(false);

  const getBestMove = useCallback(async (fen: string, depth: number = 10): Promise<string | null> => {
    setIsThinking(true);
    try {
      // Using the free Stockfish API
      const response = await fetch(`https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(fen)}&depth=${depth}`);
      
      if (!response.ok) {
        throw new Error('Engine API responded with error');
      }

      const data: EngineResponse = await response.json();
      
      if (data.success && data.bestmove) {
        // Format is usually "bestmove e2e4 ponder e7e5"
        const parts = data.bestmove.split(' ');
        if (parts.length >= 2 && parts[0] === 'bestmove') {
          return parts[1]; // Returns like 'e2e4'
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to get move from engine:', error);
      return null;
    } finally {
      setIsThinking(false);
    }
  }, []);

  return { getBestMove, isThinking };
}
