"use client";

import * as React from "react";

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
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!(e.target instanceof Node)) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selected = items.find((m) => m.canonical_id === value) ?? null;

  return (
    <div className="space-y-2" ref={ref}>
      <div className="terminal-text font-mono text-sm">{label}</div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full terminal-border bg-terminal-card terminal-text px-3 py-2 rounded-md text-left flex items-center gap-3"
      {
        ...({} as any)
      }
      >
        {selected?.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={selected.logo_url} alt={selected.name ?? selected.canonical_id} className="h-6 w-6 rounded" />
        ) : (
          <div className="h-6 w-6 rounded bg-terminal-border flex items-center justify-center text-xs opacity-70">🧠</div>
        )}
        <div className="flex-1">
          <div className="font-mono">
            {selected?.name ?? (value || placeholder)}
          </div>
          {selected?.description ? (
            <div className="text-xs opacity-70 line-clamp-1">{selected.description}</div>
          ) : null}
        </div>
        <div className="opacity-60">▾</div>
      </button>

      {open && (
        <div className="relative z-50">
          <div className="absolute mt-1 w-full max-h-72 overflow-auto terminal-border bg-black/95 backdrop-blur-sm rounded-md shadow-xl border-2">
            <ul className="divide-y divide-terminal-border/60">
              {items.map((m) => (
                <li key={m.canonical_id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(m.canonical_id);
                      setOpen(false);
                    }}
                    className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-800/80 text-left terminal-text"
                  >
                    {m.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.logo_url} alt={m.name ?? m.canonical_id} className="h-6 w-6 rounded" />
                    ) : (
                      <div className="h-6 w-6 rounded bg-terminal-border flex items-center justify-center text-xs opacity-70">🧠</div>
                    )}
                    <div className="flex-1">
                      <div className="font-mono text-sm">{m.name ?? m.canonical_id}</div>
                      {m.description ? (
                        <div className="text-xs opacity-70 line-clamp-1">{m.description}</div>
                      ) : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}


