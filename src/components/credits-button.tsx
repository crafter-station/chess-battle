"use client";

import Link from "next/link";

import { METERS_NAMES } from "@/lib/product-name";
import { cn } from "@/lib/utils";

import { useCustomer } from "@/hooks/use-customer";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function CreditsButton() {
  const { data: customer, isLoading } = useCustomer();

  if (!customer) {
    return null;
  }

  // Helper function to get meter balance by tier
  const getMeterBalance = (tier: "LITE" | "PRO" | "PRIME"): number => {
    if (!customer?.meters) return 0;
    const meterName = METERS_NAMES[tier];
    const meter = customer.meters.find((m) => m.name === meterName);
    return meter?.balance ?? 0;
  };

  // Helper function to get balance status styling
  const getBalanceStatus = (balance: number) => {
    if (balance < 0) return "text-red-400";
    if (balance < 10) return "text-yellow-400";
    return "text-green-400";
  };

  // Helper function to get tier icon
  const getTierIcon = (tier: "LITE" | "PRO" | "PRIME") => {
    switch (tier) {
      case "LITE":
        return "⚡";
      case "PRO":
        return "🔥";
      case "PRIME":
        return "🌟";
    }
  };

  const liteMoves = getMeterBalance("LITE");
  const proMoves = getMeterBalance("PRO");
  const primeMoves = getMeterBalance("PRIME");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="terminal-border terminal-text hover:bg-card/80"
        >
          <span className="mr-2">💰</span>
          Credits
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 terminal-border bg-black/95 backdrop-blur-sm">
        <DropdownMenuLabel className="terminal-text font-mono">
          Move Credits
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Move Balances */}
        <div className="px-2 py-2 space-y-2">
          {/* LITE Moves */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>{getTierIcon("LITE")}</span>
              <span className="font-mono text-sm terminal-text">LITE</span>
            </div>
            <span
              className={cn(
                "font-mono text-sm font-semibold",
                getBalanceStatus(liteMoves),
              )}
            >
              {isLoading ? "..." : liteMoves.toLocaleString()}
            </span>
          </div>

          {/* PRO Moves */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>{getTierIcon("PRO")}</span>
              <span className="font-mono text-sm terminal-text">PRO</span>
            </div>
            <span
              className={cn(
                "font-mono text-sm font-semibold",
                getBalanceStatus(proMoves),
              )}
            >
              {isLoading ? "..." : proMoves.toLocaleString()}
            </span>
          </div>

          {/* PRIME Moves */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>{getTierIcon("PRIME")}</span>
              <span className="font-mono text-sm terminal-text">PRIME</span>
            </div>
            <span
              className={cn(
                "font-mono text-sm font-semibold",
                getBalanceStatus(primeMoves),
              )}
            >
              {isLoading ? "..." : primeMoves.toLocaleString()}
            </span>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Action Items */}
        <DropdownMenuItem className="terminal-text hover:bg-primary/20">
          <Link href="/checkout" className="flex items-center gap-2">
            <span>🛒</span>
            {customer.freeBenefitGranted ? "Buy Credits" : "Get Free Credits"}
          </Link>
        </DropdownMenuItem>
        {customer.isCustomer && (
          <DropdownMenuItem className="terminal-text hover:bg-primary/20">
            <Link href="/portal" className="flex items-center gap-2">
              <span>⚙️</span>
              Manage Credits
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
