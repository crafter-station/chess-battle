"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "crt-disabled";

export default function CrtToggle() {
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const initialDisabled = stored === "1";
    setDisabled(initialDisabled);
    if (initialDisabled) {
      document.documentElement.classList.add("no-crt");
    } else {
      document.documentElement.classList.remove("no-crt");
    }
  }, []);

  function toggle() {
    const next = !disabled;
    setDisabled(next);
    if (next) {
      document.documentElement.classList.add("no-crt");
      localStorage.setItem(STORAGE_KEY, "1");
    } else {
      document.documentElement.classList.remove("no-crt");
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button onClick={toggle} variant="secondary" className="terminal-button">
        {disabled ? "Enable Epilepsy Mode" : "Disable Epilepsy Mode"}
      </Button>
    </div>
  );
}
