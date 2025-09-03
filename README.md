This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## ELO Rating 

- **Base rating**: 1200 when no prior rating exists
- **Expected score**: \(E = \frac{1}{1 + 10^{(R_{opp}-R_{player})/400}}\)
- **Actual score**: \(S \in \{1,\,0.5,\,0\}\) for win/draw/loss
- **K-factor**:
  - \(K = 40\) if \(\text{games} < 10\)
  - \(K = 32\) if \(\text{games} < 30\)
  - \(K = 16\) if \(R_{player} \ge 2000\)
  - otherwise \(K = 24\)
- **Rating change**: \(\Delta R = K\,(S - E)\)
- **New rating**: \(R' = \operatorname{round}(R + \Delta R)\)

Implementation:
- Logic: `src/lib/elo.ts`
- Applied after each battle: `src/trigger/battle.task.ts`
- Stored in: `player_rating` table (`src/db/schema.ts`)
