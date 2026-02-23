# Overview

bcCHESS is a full-stack chess application where users play against a Stockfish AI engine at varying difficulty levels (easy, medium, hard). Players create accounts with usernames, choose their color (white/black), and compete to climb a global Elo-rated leaderboard. The app includes game persistence, chess puzzles, push notifications for daily reminders, and confetti celebrations for wins. It's built as a PWA (Progressive Web App) with service worker support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router) with 3 main pages: Home (dashboard), Play (chess game), Leaderboard
- **State Management**: TanStack React Query for server state; React useState/useContext for local state. User session is managed via a React Context (`UserProvider`) backed by `localStorage`
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives, styled with Tailwind CSS. Dark mode is the only theme with a premium glass-morphism aesthetic
- **Chess Logic**: `chess.js` handles move validation, FEN/PGN generation, and game rules. `react-chessboard` renders the interactive drag-and-drop board
- **Chess Engine**: Client-side hook `useChessEngine` calls the Stockfish Online API (`https://stockfish.online/api/s/v2.php`) with FEN position and depth parameter. Difficulty maps to depth: easy=6, medium=10, hard=15
- **PWA**: Service worker (`sw.js`) handles push notifications. Manifest in `client/public/manifest.json`

### Backend
- **Framework**: Express.js on Node.js with TypeScript (executed via tsx)
- **Architecture**: Monorepo layout with three source directories:
  - `client/` — React frontend (Vite root)
  - `server/` — Express backend
  - `shared/` — Shared types, Drizzle schemas, and typed route definitions used by both client and server
- **API Pattern**: REST API with typed route contracts defined in `shared/routes.ts`. Zod validates all inputs. The API contract (paths, methods, schemas) is shared between frontend and backend
- **Dev Server**: Vite runs as Express middleware during development (`server/vite.ts`). In production, pre-built static files are served from `dist/public`
- **Build**: Custom build script (`script/build.ts`) uses Vite for client and esbuild for server, outputting to `dist/`
- **Push Notifications**: `web-push` library with VAPID keys. Cron jobs via `node-cron` send daily reminders at 5 AM, 10 AM, and 3 PM
- **Elo Rating**: Server-side Elo calculation with K-factor of 32, assuming opponent rating of 1200

### API Endpoints
- `GET /api/users` — List top users (leaderboard)
- `POST /api/users` — Get or create user by username
- `POST /api/users/:id/stats` — Update user win/loss/draw stats and Elo rating
- `POST /api/users/:id/push` — Save push notification subscription
- `POST /api/games` — Create a new game
- `GET /api/games/:id` — Get a game by ID
- `PATCH /api/games/:id` — Update game PGN, status, and result
- `GET /api/puzzles` — List puzzles
- `GET /api/puzzles/random` — Get a random puzzle

### Data Storage
- **Database**: PostgreSQL via `DATABASE_URL` environment variable
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-validation integration
- **Schema** (`shared/schema.ts`):
  - `users` — id, username (unique), wins, losses, draws, rating (default 1200)
  - `games` — id, userId (FK to users), pgn, playerColor ('w'/'b'), difficulty, status ('active'/'completed'), result ('win'/'loss'/'draw')
  - `puzzles` — id, fen, solution (space-separated moves), rating
  - `push_subscriptions` — id, userId (FK), subscription (JSON string)
- **Migrations**: Use `drizzle-kit push` (schema push approach, not migration files). Run with `npm run db:push`
- **Storage Layer**: `server/storage.ts` implements `IStorage` interface with `DatabaseStorage` class

### Path Aliases
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets` → `attached_assets/`

### Key Commands
- `npm run dev` — Start development server with HMR
- `npm run build` — Build client and server for production
- `npm run start` — Run production build
- `npm run db:push` — Push schema changes to database
- `npm run check` — TypeScript type checking

## External Dependencies

- **PostgreSQL**: Primary database, connected via `DATABASE_URL` environment variable. Required for the app to start
- **Stockfish Online API**: `https://stockfish.online/api/s/v2.php` — Free external API for chess AI move generation. Called client-side with FEN and depth parameters. No API key required
- **Web Push (VAPID)**: Requires `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` environment variables for push notification support. Uses the `web-push` npm package
- **Google Fonts**: Loads Inter, Outfit, DM Sans, Fira Code, Geist Mono, and Architects Daughter fonts from Google Fonts CDN
- **shadcn/ui**: Component library configured in `components.json` with new-york style, Tailwind CSS variables, and neutral base color

### Note on `extracted_game/` and `attached_assets/`
These directories contain earlier versions or reference copies of the project. The canonical source code is in the root-level `client/`, `server/`, and `shared/` directories. Ignore the duplicated code in `extracted_game/` and `attached_assets/` when making changes.