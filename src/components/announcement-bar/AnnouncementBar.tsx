"use client";

import { useState } from "react";

import { setCookie } from "cookies-next";
import { XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { HIDE_ANNOUNCEMENT_BAR_COOKIE } from "@/lib/local-cookies";

import { Button } from "@/components/ui/button";

export function AnnouncementBar() {
  const [showAnnouncement, setShowAnnouncement] = useState(true);

  const handleDismiss = () => {
    setShowAnnouncement(false);
    setCookie(HIDE_ANNOUNCEMENT_BAR_COOKIE, "true", {
      path: "/",
      sameSite: "strict",
    });
  };

  return (
    <AnimatePresence>
      {showAnnouncement && (
        <motion.div
          exit={{ height: 0, translateY: -100 }}
          transition={{ type: "easeOut", duration: 0.25 }}
          className="flex h-10 items-center justify-center bg-terminal-card/90 border-b border-terminal-border backdrop-blur-sm px-4 text-foreground"
        >
          <div className="flex items-center gap-2 text-center text-xs sm:text-sm">
            <a
              href="https://www.youtube.com/live/yKzXoJgPenw?si=qNNEHwvpob2u-HxC&t=28889"
              target="_blank"
              rel="noopener noreferrer"
              className="terminal-text terminal-glow hover:text-primary transition-colors"
            >
              🏆♟️ We won the Global AI Gateway Hackathon with Chess Battle!
            </a>
            <div className="-translate-y-1 terminal-accent">.</div>
            <a
              href="https://github.com/crafter-station/chess-battle"
              target="_blank"
              rel="noopener noreferrer"
              className="terminal-text hover:text-primary transition-colors"
            >
              Star the repo ⭐
            </a>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="!p-0 size-6 rounded-full border border-terminal-border text-xs opacity-60 transition-all hover:bg-primary/10 hover:opacity-100 terminal-text"
            >
              <XIcon className="size-2" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
