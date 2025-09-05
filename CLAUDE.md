# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

This project uses **Bun** as the package manager and runtime:

- `bun dev` - Start Next.js development server
- `bun run build` - Build for production
- `bun start` - Start production server
- `bun run lint` - Run Biome linter checks
- `bun run format` - Format code with Biome
- `bun run check` - Run Biome checks and auto-fix issues
- `bun install` - Install dependencies

## Architecture Overview

Chess Battle is a Next.js application that orchestrates chess games between AI models using Trigger.dev for background processing and Electric/Neon for real-time data synchronization.

### Core Technologies

- **Frontend**: Next.js 15 with React 19, Tailwind CSS
- **Backend**: Trigger.dev v4 for task orchestration
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Real-time**: Electric SQL for live data synchronization
- **Authentication**: Clerk
- **AI Integration**: Vercel AI SDK with multiple model providers
- **Styling**: Tailwind CSS with custom CRT screen aesthetic

### Key Components

#### Database Schema (`src/db/schema.ts`)
- `battle` - Chess game records with tournament support
- `move` - Individual chess moves with validation, timing, and AI metadata
- `player` - AI model instances
- `tournament` - Tournament organization
- `player_rating` - ELO rating system
- `ai_model` - Model catalog from AI Gateway

#### Trigger.dev Tasks (`src/trigger/`)
- `battle.task.ts` - Main orchestrator for complete chess games
- `get-next-move.task.ts` - JSON-mode AI move generation
- `get-next-move-streaming.task.ts` - Streaming AI move generation
- `tournament.task.ts` - Tournament management
- `models.task.ts` - Model metadata sync

#### Chess Engine Integration
- Uses `chess.js` for game state and move validation
- Supports both white and black AI players
- Handles timeouts, invalid moves, and fallback strategies
- Implements ELO rating system (see `src/lib/elo.ts`)

#### Real-time Updates
- Electric SQL provides live data sync to frontend
- Battle progress updates in real-time
- Move-by-move visualization with chess board component

### ELO Rating System

Standard chess ELO implementation with K-factor adjustments:
- Base rating: 1200 for new players
- K-factor: 40 (games < 10), 32 (games < 30), 16 (rating ≥ 2000), otherwise 24
- Applied after each battle completion
- Stored in `player_rating` table with history

### AI Model Integration

Supports 70+ AI models via Vercel AI SDK:
- Model list maintained in `src/lib/models.ts`
- Two generation modes: JSON (structured) and streaming (text parsing)
- Timeout handling and retry logic
- Token usage tracking and response time metrics

### Frontend Architecture

- App Router with TypeScript
- Clerk authentication with user merging
- Custom chess board viewer (`src/components/temporal-chess-viewer/`)
- Real-time battle monitoring
- Tournament bracket visualization
- Retro CRT aesthetic with toggle

### Battle Orchestration Flow

1. Battle creation via form submission
2. Trigger.dev task orchestrates entire game
3. Move generation tasks called alternately for white/black
4. Invalid move handling with fallback to random legal moves  
5. Game completion detection (checkmate, stalemate, timeout)
6. ELO rating updates for both players
7. Real-time UI updates throughout

### Development Notes

- Uses Biome for linting/formatting with custom import organization
- Husky git hooks for code quality
- Electric SQL requires specific database schema patterns
- Trigger.dev v4 syntax (avoid v2 `client.defineJob` patterns)
- CRT screen effect can be disabled via localStorage toggle
- Tournament support with round-robin and elimination formats

### Important Patterns

- All database operations use Drizzle ORM
- Real-time data flows through Electric subscriptions
- AI model calls include comprehensive error handling
- Battle timeout enforcement prevents infinite games
- Move validation ensures chess rule compliance
- ELO calculations maintain rating accuracy