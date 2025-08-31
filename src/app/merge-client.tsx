"use client";

import { useEffect } from "react";

import { useAuth } from "@clerk/nextjs";

export default function MergeOnSignin() {
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) return;
    const run = async () => {
      try {
        await fetch("/api/auth/merge", { method: "POST" });
      } catch {}
    };
    run();
  }, [isSignedIn]);

  return null;
}
