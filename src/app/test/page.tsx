"use client";

import { useShape } from "@electric-sql/react";

export default function TestPage() {
  const { isLoading, data } = useShape({
    url: "http://localhost:3000/api/shapes/battles",
  });

  return <div>{isLoading ? "Loading..." : data?.length}</div>;
}
