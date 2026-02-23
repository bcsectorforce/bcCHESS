# Overview

Chess Mastermind (bcCHESS) is a full-stack chess application that lets users play against a Stockfish chess engine at varying difficulty levels. Players can choose their color (white/black) and difficulty (easy/medium/hard), then play a full chess game with move validation, hints, and game state persistence. The app is built as a PWA (Progressive Web App) with offline caching and notification support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: TanStack React Query for server state; local React state (useState) for chess game logic
- **UI Components**: shadcn/ui component library built on Radix UI primitives, styled with Tailwind CSS
- **Chess Logic**: `chess.js` handles local move validation, FEN/PGN generation, and game rules. `react-chessboard` renders the interactive board with drag-and-drop
- **Styling**: Tailwind CSS with CSS variables for theming. Dark mode is the default and only theme — designed for a premium feel with deep blues and indigo accents
- **PWA**: Service worker registered in `main.tsx`, manifest in `client/public/manifest.json`, basic cache-first strategy in `sw.js`

### Backend
- **Framework**: Express.js running on Node with TypeScript (via tsx)
- **Architecture**: Monorepo-style layout with three top-level source directories:
  - `client/` — React frontend (Vite root)
  - `server/` — Express backend
  - `shared/` — Shared types, schemas, and route definitions used by both client and server
- **API Pattern**: REST API with typed route definitions in `shared/routes.ts`. Routes use Zod for input validation. The API contract (paths, methods, input/output schemas) is shared between frontend and backend
- **Dev Server**: Vite dev server runs as middleware on the Express HTTP server during development (`server/vite.ts`). In production, static files are served from `dist/public`
- **Build**: Custom build script (`script/build.ts`) uses Vite for client and esbuild for server, outputting to `dist/`

### API Endpoints
- `POST /api/games` — Create a new game (pgn, playerColor, difficulty, status)
- `GET /api/games/:id` — Get a game by ID
- `PATCH /api/games/:id` — Update a game's PGN and status

### Data Storage
- **Database**: PostgreSQL via `DATABASE_URL` environment variable
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-validation integration
- **Schema** (`shared/schema.ts`): Single `games` table with fields: `id` (serial PK), `pgn` (text), `playerColor` (text, 'w'/'b'), `difficulty` (text), `status` (text, 'active'/'completed')
- **Migrations**: Managed via `drizzle-kit push` (schema push approach, not migration files)
- **Storage Layer**: `server/storage.ts` provides a `DatabaseStorage` class implementing `IStorage` interface for CRUD operations

### Chess Engine Integration
- AI moves come from the **Stockfish Online API** (`https://stockfish.online/api/s/v2.php`)
- The client-side hook `use-chess-engine.ts` sends the current FEN position and a depth parameter to get the best move
- Difficulty maps to Stockfish depth: easy=1, medium=5, hard=15

### Path Aliases
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets` → `attached_assets/`

### Key Design Decisions
1. **Shared route definitions**: Both client and server import from `shared/routes.ts`, ensuring type-safe API contracts without code generation
2. **External chess engine API**: Instead of running Stockfish locally (which would require WASM or native binaries), the app calls a free online API. This simplifies deployment but requires internet connectivity for AI moves
3. **Schema push over migrations**: Uses `drizzle-kit push` for rapid development instead of generating migration files
4. **Single-page app with SPA fallback**: All unmatched routes serve `index.html` for client-side routing

## External Dependencies

- **PostgreSQL**: Required database, connected via `DATABASE_URL` environment variable. Used with `pg` (node-postgres) pool and Drizzle ORM
- **Stockfish Online API**: `https://stockfish.online/api/s/v2.php` — Free chess engine API called from the client to compute AI moves. Accepts FEN + depth parameters, returns best move
- **Google Fonts**: Outfit and JetBrains Mono fonts loaded via CSS import; additional fonts (Architects Daughter, DM Sans, Fira Code, Geist Mono) loaded in index.html
- **npm packages of note**: `chess.js` (chess logic), `react-chessboard` (board UI), `wouter` (routing), `drizzle-orm` + `drizzle-zod` (database), `zod` (validation), `express` (server), `connect-pg-simple` (session store, available but sessions not currently used)