"use client";

import { useShape } from "@electric-sql/react";
import { Chess } from "chess.js";

const SOURCE_ID = process.env.NEXT_PUBLIC_ELECTRIC_SOURCE_ID;
const SECRET = process.env.NEXT_PUBLIC_ELECTRIC_SECRET;

export default function Page() {
  const { isLoading, data } = useShape<{ id: string; state: string }>({
    url: `https://api.electric-sql.cloud/v1/shape?source_id=${SOURCE_ID}&secret=${SECRET}`,
    params: {
      table: "move",
    },
  });

  if (isLoading) {
    return <div>Loading ...</div>;
  }

  return (
    <div>
      {data.map((item) => (
        <pre key={item.id}>{new Chess(item.state).ascii()}</pre>
      ))}
    </div>
  );
}
