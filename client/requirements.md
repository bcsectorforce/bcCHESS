## Packages
chess.js | Chess logic and move validation
react-chessboard | Beautiful, interactive React chessboard component
canvas-confetti | Celebration effects for winning games
@types/canvas-confetti | Types for confetti
lucide-react | Beautiful icons

## Notes
- Engine: Uses `fetch` to `https://stockfish.online/api/s/v2.php` for AI moves.
- Routing: Handled by `wouter`.
- Custom Hooks: Ensure `useChessEngine` is robust against network delays.
- User Session: Managed purely via `localStorage` with a username prompt on first load.
