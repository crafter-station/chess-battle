"use client";

import Link from "next/link";
import { useState } from "react";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-terminal-border bg-black/40 backdrop-blur-sm flex-shrink-0">
      <div className="px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
        {/* Logo - Responsive */}
        <div className="flex items-center">
          <Link
            href="/"
            className="flex items-center gap-1.5 sm:gap-2 terminal-text hover:text-primary transition-colors"
          >
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-primary/20 border border-primary/30 flex items-center justify-center">
              <svg
                width="10"
                height="10"
                className="sm:w-3 sm:h-3"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <title>Chess Icon</title>
                <path
                  d="M2 2h20v20H2V2zm2 2v4h4v4H4v4h4v4h4v-4h4v4h4v-4h-4v-4h4V8h-4V4h-4v4H8V4H4zm8 8H8v4h4v-4zm0-4v4h4V8h-4z"
                  fill="white"
                />
              </svg>
            </div>
            <span className="font-mono text-xs sm:text-sm terminal-glow">
              <span className="hidden sm:inline">CHESS BATTLE</span>
              <span className="sm:hidden">CHESS</span>
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-6">
          <Link
            href="/"
            className="terminal-text text-xs hover:text-primary transition-colors px-2 py-1 rounded border border-transparent hover:border-primary/30"
          >
            HOME
          </Link>
          <Link
            href="/tournaments"
            className="terminal-text text-xs hover:text-primary transition-colors px-2 py-1 rounded border border-transparent hover:border-primary/30"
          >
            TOURNAMENTS
          </Link>
          <Link
            href="/leaderboard"
            className="terminal-text text-xs hover:text-primary transition-colors px-2 py-1 rounded border border-transparent hover:border-primary/30"
          >
            LEADERBOARD
          </Link>

          {/* Desktop Auth */}
          <div className="flex items-center ml-2">
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="terminal-border bg-terminal-card px-3 py-1.5 rounded text-xs hover:bg-terminal-card/80 transition-colors terminal-text"
                >
                  SIGN IN
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox:
                      "w-7 h-7 lg:w-8 lg:h-8 border border-primary/30 rounded",
                    userButtonPopoverCard:
                      "bg-black/90 border border-terminal-border backdrop-blur-sm",
                    userButtonPopoverActionButton:
                      "terminal-text hover:text-primary transition-colors",
                    userButtonPopoverActionButtonText:
                      "terminal-text font-mono text-xs",
                  },
                }}
                afterSignOutUrl="/"
              />
            </SignedIn>
          </div>
        </nav>

        {/* Mobile Menu Button & Auth */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Mobile Auth */}
          <div className="flex items-center">
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="terminal-border bg-terminal-card px-2 py-1 rounded text-xs hover:bg-terminal-card/80 transition-colors terminal-text"
                >
                  SIGN IN
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-6 h-6 border border-primary/30 rounded",
                    userButtonPopoverCard:
                      "bg-black/90 border border-terminal-border backdrop-blur-sm",
                    userButtonPopoverActionButton:
                      "terminal-text hover:text-primary transition-colors",
                    userButtonPopoverActionButtonText:
                      "terminal-text font-mono text-xs",
                  },
                }}
                afterSignOutUrl="/"
              />
            </SignedIn>
          </div>

          {/* Hamburger Menu */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="terminal-border bg-terminal-card p-1.5 rounded hover:bg-terminal-card/80 transition-colors"
            aria-label="Toggle mobile menu"
          >
            <div className="w-4 h-4 flex flex-col justify-center items-center">
              <div
                className={`w-3 h-px bg-primary transition-all duration-200 ${mobileMenuOpen ? "rotate-45 translate-y-px" : "-translate-y-0.5"}`}
              />
              <div
                className={`w-3 h-px bg-primary transition-all duration-200 ${mobileMenuOpen ? "opacity-0" : "opacity-100"}`}
              />
              <div
                className={`w-3 h-px bg-primary transition-all duration-200 ${mobileMenuOpen ? "-rotate-45 -translate-y-px" : "translate-y-0.5"}`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-terminal-border/30 bg-black/60 backdrop-blur-sm">
          <nav className="px-3 py-3 space-y-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block terminal-text text-xs hover:text-primary transition-colors px-3 py-2 rounded border border-transparent hover:border-primary/30"
            >
              HOME
            </Link>
            <Link
              href="/tournaments"
              onClick={() => setMobileMenuOpen(false)}
              className="block terminal-text text-xs hover:text-primary transition-colors px-3 py-2 rounded border border-transparent hover:border-primary/30"
            >
              TOURNAMENTS
            </Link>
            <Link
              href="/leaderboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block terminal-text text-xs hover:text-primary transition-colors px-3 py-2 rounded border border-transparent hover:border-primary/30"
            >
              LEADERBOARD
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
