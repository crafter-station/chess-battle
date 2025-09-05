"use client";

import * as React from "react";

import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type ModelOption = {
  canonical_id: string;
  name: string | null;
  description: string | null;
  logo_url: string | null;
};

export function ModelSelect({
  label,
  items,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  items: ModelOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = items.find((m) => m.canonical_id === value);

  return (
    <div className="space-y-2">
      <Label className="terminal-text font-mono text-sm">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between terminal-border bg-terminal-card terminal-text hover:bg-card/80 px-3 py-2"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {selected ? (
                <>
                  {selected.logo_url ? (
                    // biome-ignore lint/performance/noImgElement: ok
                    <img
                      src={selected.logo_url}
                      alt={selected.name ?? selected.canonical_id}
                      className="h-5 w-5 rounded shrink-0"
                    />
                  ) : (
                    <div className="h-5 w-5 rounded bg-terminal-border flex items-center justify-center text-xs opacity-70 shrink-0">
                      🧠
                    </div>
                  )}
                  <span className="font-mono text-sm truncate text-left">
                    {selected.name ?? selected.canonical_id}
                  </span>
                </>
              ) : (
                <span className="font-mono text-sm opacity-70">
                  {placeholder}
                </span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 terminal-border bg-black/95 backdrop-blur-sm">
          <Command className="bg-transparent">
            <CommandInput
              placeholder="Search models..."
              className="h-9 terminal-text bg-transparent border-none"
            />
            <CommandList className="max-h-72">
              <CommandEmpty className="terminal-text text-center py-4 text-sm opacity-70">
                No model found.
              </CommandEmpty>
              <CommandGroup>
                {items.map((model) => (
                  <CommandItem
                    key={model.canonical_id}
                    value={model.canonical_id}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                    className="terminal-text hover:bg-primary/20 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {model.logo_url ? (
                        // biome-ignore lint/performance/noImgElement: ok
                        <img
                          src={model.logo_url}
                          alt={model.name ?? model.canonical_id}
                          className="h-5 w-5 rounded shrink-0"
                        />
                      ) : (
                        <div className="h-5 w-5 rounded bg-terminal-border flex items-center justify-center text-xs opacity-70 shrink-0">
                          🧠
                        </div>
                      )}
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-mono text-sm truncate">
                          {model.name ?? model.canonical_id}
                        </div>
                        {model.description && (
                          <div className="text-xs opacity-70 line-clamp-1">
                            {model.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4",
                        value === model.canonical_id
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
