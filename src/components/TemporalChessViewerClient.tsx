"use client";

import dynamic from "next/dynamic";

const InnerViewer = dynamic(() => import("./TemporalChessViewer"), {
  ssr: false,
});

export default function TemporalChessViewerClient({
  battleId,
}: {
  battleId: string;
}) {
  return <InnerViewer battleId={battleId} />;
}


