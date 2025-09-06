"use client";

import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-[calc(100vh-52px)] flex items-center justify-center p-6">
      <SignIn />
    </div>
  );
}
