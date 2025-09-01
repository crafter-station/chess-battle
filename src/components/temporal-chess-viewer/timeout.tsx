"use client";

import { useParams } from "next/navigation";
import React from "react";

import { useUser } from "@clerk/nextjs";
import { eq, useLiveQuery } from "@tanstack/react-db";

import { BattlesCollection } from "@/db/electric";

import { Button } from "@/components/ui/button";

import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function BattleTimeout() {
  const { user } = useUser();
  const { battle_id } = useParams<{ battle_id: string }>();

  const { data: battle } = useLiveQuery(
    (q) =>
      q
        .from({ battle: BattlesCollection })
        .where(({ battle }) => eq(battle.id, battle_id))
        .select(({ battle }) => ({
          timeout_ms: battle.timeout_ms,
          user_id: battle.user_id,
        })),
    [battle_id],
  );

  const isOwner = React.useMemo(
    () => battle?.[0]?.user_id === user?.id,
    [battle, user],
  );

  if (!battle || !battle.length) {
    return null;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const timeoutMs = formData.get("timeout_ms") as string;
        BattlesCollection.update(battle_id, (b) => {
          b.timeout_ms = parseInt(timeoutMs, 10);
        });
      }}
    >
      <Label htmlFor="timeout_ms">Battle Timeout (ms)</Label>
      <div className="flex justify-between">
        <Input
          id="timeout_ms"
          type="number"
          disabled={!isOwner}
          name="timeout_ms"
          key={battle[0].timeout_ms}
          defaultValue={battle[0].timeout_ms}
        />
        {isOwner && (
          <Button type="submit" variant="outline">
            Edit Timeout
          </Button>
        )}
      </div>
      <input type="hidden" name="battle_id" value={battle_id} />
    </form>
  );
}
