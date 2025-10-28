# Adversarial LLM vs LLM Benchmarking (Chess Edition)

Real-time AI-vs-AI chess battles and tournaments for benchmarking large language models (LLMs). Built with **Next.js 14** [24], **Trigger.dev** [11], **ElectricSQL** [9], and **Vercel AI Gateway** [6]. Compare model performance with Elo ratings and watch matches live in your browser.

## Overview

Chess Battle explores **adversarial benchmarking** of LLMs through interactive gameplay rather than static Q\&A. In contrast to traditional evaluation on fixed question-answer tests, here two models face off in a dynamic environment.

### Why Chess for AI Benchmarking?

**Chess** is our first focus because it is a deterministic, perfect-information game – every situation is fully observable and interpretable. Each move has precise rules and outcomes, making it well-suited for systematic evaluation of AI reasoning[18]. Indeed, chess has long been considered *"a classic proving ground for system intelligence"* in AI research[19].

Researchers note that conventional metrics often **overlook strategic behavior in interactive settings** [17]. By letting models compete in a game, we can observe decision-making, adaptability, and failure modes that static prompts might miss [17].

### LLM vs LLM Gameplay

This platform enables direct **LLM-vs-LLM gameplay**: models play full chess games against each other under tournament conditions. Similar efforts are emerging in the community – for example, Kaggle (with DeepMind) recently launched an **AI Game Arena** where top models compete head-to-head in chess and other games[19].

We run structured **round-robin tournaments** (every model plays every other model multiple times) to gather robust comparison data. After each game, we update an **Elo rating** for each model, giving a continuous quantitative measure of skill.

### Current LLM Performance

Notably, current general-purpose LLMs are **not trained explicitly for chess** and thus often struggle with the game. Early experiments have found that models like GPT-4 or Claude make frequent blunders and even illegal moves when playing chess[19]. In one study, 13 different chat models failed to score a single win against a random-move baseline, highlighting the difficulty they have with complex, rule-based environments like chess[1].

This underscores the value of adversarial gameplay testing – it reveals weaknesses in reasoning and planning that might be hidden in traditional QA benchmarks.

**Core principles:**

* **LLM vs LLM gameplay** – head-to-head matches between models with full move validation[19].
* **Round-robin tournaments** – structured, repeated model-vs-model comparisons. All models play multiple games against each other to minimize randomness and produce statistically reliable results.
* **Elo rating system** – continuous, quantitative skill tracking[19].

## Features

* **AI vs AI battles** – Validated chess games between LLMs, enforced by chess rules[1].
* **Round-robin tournaments** – Automatic scheduling of games and collection of results.
* **Elo ratings** – Dynamic ratings updated after each match[19][28].
* **Live viewer** – Real-time move streaming with ElectricSQL[9].
* **Background orchestration** – Scalable match handling powered by Trigger.dev[11].
* **Unified AI access via Vercel AI Gateway** – Models from various providers accessed through a single API endpoint[6].

## Demo

### Live Chess Battles
Watch AI models battle in real-time chess matches with move-by-move analysis and reasoning.

<video width="100%" controls>
  <source src="https://github.com/user-attachments/assets/46113686-81f2-4c79-ba0f-b5c1f15b8f1a" type="video/mp4">
  Your browser does not support the video tag.
</video>

### Tournament Leaderboard
Track model performance with dynamic Elo ratings updated after each match.

*Screenshot placeholder - Add leaderboard image*

### Model Comparison
Compare different AI models across multiple tournament runs to identify strengths and weaknesses.

*Screenshot placeholder - Add model comparison image*

## The AI Gateway for Developers

We leverage the **Vercel AI Gateway** to seamlessly integrate multiple model providers. According to Vercel, it *"provides a unified API to access hundreds of models through a single endpoint"*, enabling budgeting, usage monitoring, and request routing[6].

Key benefits include:

* **Unified API access** – Standardized interface across models[6].
* **Usage monitoring and budgeting** – Track and limit API usage costs[6].
* **Load management and routing** – Supports fallback and traffic shaping[6].

[More info here](https://vercel.com/docs/ai-gateway).

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js 18+** or **Bun**
- **PostgreSQL** database (local or cloud)
- **Git**

### Environment Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd chess-battle
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Set up environment variables:**
   Copy `.env.example` to `.env` and fill in the required values:

   ```bash
   cp .env.example .env
   ```

   **Required Environment Variables:**
   - `DATABASE_URL` - PostgreSQL connection string
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk authentication key
   - `CLERK_SECRET_KEY` - Clerk secret key
   - `TRIGGER_SECRET_KEY` - Trigger.dev secret key
   - `TRIGGER_PROJECT_ID` - Trigger.dev project ID
   - `AI_GATEWAY_API_KEY` - Vercel AI Gateway API key
   - `ELECTRIC_SECRET` - ElectricSQL secret
   - `ELECTRIC_SOURCE_ID` - ElectricSQL source ID

4. **Database Setup:**
   ```bash
   # Generate database schema
   npx drizzle-kit generate

   # Push schema to database
   npx drizzle-kit push
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run Biome linter
npm run format       # Format code with Biome
npm run check        # Check and fix code with Biome

# Database
npx drizzle-kit generate  # Generate database migrations
npx drizzle-kit push      # Push schema changes to database
npx drizzle-kit studio    # Open Drizzle Studio (database GUI)
```

### Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
│   ├── ui/          # Reusable UI components
│   └── temporal-chess-viewer/  # Chess game viewer
├── db/               # Database configuration and schema
├── lib/              # Utility functions and configurations
├── hooks/            # Custom React hooks
├── actions/          # Server actions
└── trigger/          # Trigger.dev tasks
```

### Key Technologies

- **Frontend**: Next.js 14 with React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Trigger.dev for background tasks
- **Database**: PostgreSQL with Drizzle ORM, ElectricSQL for real-time sync
- **Authentication**: Clerk
- **AI**: Vercel AI Gateway for unified model access
- **UI**: Radix UI components with custom styling

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and ensure tests pass
4. Commit with conventional format: `git commit -m "feat: add new feature"`
5. Push to your fork and submit a pull request

### Commit Message Format

We follow conventional commits:

```
type(scope): description

Types: feat, fix, docs, style, refactor, perf, test, chore, revert
```

## Elo Rating System

We use a standard Elo rating system[28] with the following:

* **Base rating**: 1200
* **Expected score**:
  $E = \frac{1}{1 + 10^{(R_{opp} - R_{player}) / 400}}$[27]
* **Actual score (S)**:

  * Win = 1
  * Draw = 0.5
  * Loss = 0
* **K-factor**:

  * 40 if games < 10
  * 32 if games < 30
  * 16 if rating ≥ 2000
  * Otherwise 24
* **Rating update**:
  $\Delta R = K \times (S - E)$[28]
  $R' = \text{round}(R + \Delta R)$

---

## References

1. [LLM Chess Benchmark][1]
2. [Vercel AI Gateway Documentation][6]
3. [ElectricSQL Overview][9]
4. [Trigger.dev Docs][11]
5. [Beyond Benchmarks: Evaluating LLMs in Multi-Agent Environments][17]
6. [Chess as a Benchmark for Artificial Intelligence][18]
7. [Kaggle AI Game Arena][19]
8. [Next.js 14 Documentation][24]
9. [Wikipedia: Elo Rating System][27]
10. [Elo Rating Explanation - GeeksforGeeks][28]
11. [FIDE Handbook: Rating Regulations][29]

[1]: https://github.com/crafter-station/chess-battle
[6]: https://vercel.com/docs/ai-gateway
[9]: https://electric-sql.com/docs/introduction
[11]: https://trigger.dev/docs/guides/overview
[17]: https://arxiv.org/abs/2307.15043
[18]: https://link.springer.com/chapter/10.1007/978-3-642-11693-3_38
[19]: https://www.kaggle.com/competitions/ai-game-arena
[24]: https://nextjs.org/docs
[27]: https://en.wikipedia.org/wiki/Elo_rating_system
[28]: https://www.geeksforgeeks.org/elo-rating-algorithm
[29]: https://handbook.fide.com/chapter/B022018

---

<div align="center">
  <p>
    <svg width="20" height="20" viewBox="0 0 258 258" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle; margin-right: 8px;">
      <path d="M118.238 16.262C111.482 11.4 99.9003 5.62505 92.2517 3.26931C74.9754 -2.31209 61.2312 0.473844 52.1188 3.50057C34.3839 9.3909 23.1637 17.3398 12.9798 32.0237C-3.018 54.7384 -1.30627 92.0001 17.4396 113.282C21.6313 118.385 23.9203 117.58 40.6062 105.794C41.1838 105.243 38.9626 101.57 35.6118 97.3194C28.0736 87.6862 23.7841 70.2632 26.209 60.5011C34.074 29.8239 72.1683 13.8835 96.3841 31.0488C101.735 34.7695 118.578 50.1432 133.719 65.2112C156.435 87.3932 163.188 92.535 168.887 92.0615C174.586 91.588 176.608 89.6589 177.27 83.5096C178.226 76.8049 175.724 72.8474 162.814 60.893C154.116 52.642 147.113 45.2566 147.134 43.8571C147.151 42.7375 153.199 38.0697 160.665 33.7035C208.922 4.47877 259.519 64.8793 219.089 103.462C213.891 108.422 204.705 113.602 198.705 115.191C191.85 116.767 160.245 117.687 120.978 117.092C47.5669 115.979 43.5706 116.758 23.9629 133.539C-1.12747 155.276 -7.39134 192.976 9.54962 220.67C31.485 256.839 79.721 266.529 114.252 241.576L126.916 232.249L141.283 241.986C164.663 258.018 183.68 261.387 206.842 254.179C253.172 239.483 271.118 182.082 241.827 143.002C238.477 138.752 236.774 138.446 232.187 140.616C218.126 148.242 218.419 147.686 226.416 164.606C232.48 177.576 233.542 182.632 231.971 192.407C227.614 216.978 208.584 233.207 184.682 232.845C166.187 232.564 160.267 228.835 126.619 195.569C108.947 178.502 92.6562 164.257 90.3799 164.222C86.1118 164.158 76.8749 172.697 76.8113 176.895C76.7943 178.015 84.341 187.088 93.8711 196.752L110.969 214.089L100.607 221.771C64.0584 248.374 13.049 215.124 25.6449 172.76C29.5392 159.94 42.8446 145.864 55.4323 141.575C60.2992 139.689 90.1929 139.023 130.598 139.635C204.863 140.762 213.705 139.496 230.998 125.2C282.576 83.4269 254.198 2.92565 187.611 2.19579C168.262 1.90235 157.675 5.66133 139.549 18.5449L130.342 25.1245L118.238 16.262Z" fill="#666"/>
    </svg>
    Built with ❤️ by <strong>Crafter Team</strong>
  </p>
</div>
