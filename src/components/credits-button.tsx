"use client";

import Link from "next/link";

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
  const { data: customer } = useCustomer();

  if (!customer) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>Credits</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Credits</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link href="/checkout">
            {customer.freeBenefitGranted ? "Buy Credits" : "Get Free Credits"}
          </Link>
        </DropdownMenuItem>
        {customer.isCustomer && (
          <DropdownMenuItem>
            <Link href="/portal">Manage Credits</Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
