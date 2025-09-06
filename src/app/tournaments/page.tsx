"use client";

import dynamic from "next/dynamic";

const TournamentsClient = dynamic(() => import("./tournaments-client"), {
  ssr: false,
});

export default function TournamentsPage() {
  return <TournamentsClient />;
}
