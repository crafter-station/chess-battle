"use client";

import dynamic from "next/dynamic";

const LeaderboardClient = dynamic(() => import("./leaderboard-client"), {
  ssr: false,
});

export default function LeaderboardPage() {
  return <LeaderboardClient />;
}
