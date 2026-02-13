"use client";

import { COMMANDS } from "@/lib/commands";

interface CommandPaletteProps {
  filter: string;
  onSelect: (command: string) => void;
  visible: boolean;
}

export function CommandPalette({
  filter,
  onSelect,
  visible,
}: CommandPaletteProps) {
  if (!visible) return null;

  const filtered = COMMANDS.filter((cmd) =>
    cmd.name.startsWith(filter.toLowerCase())
  );

  if (filtered.length === 0) return null;

  return (
    <div
      role="listbox"
      aria-label="Available commands"
      className="absolute bottom-full left-0 right-0 mb-1 rounded-md border bg-popover p-1 shadow-md"
    >
      {filtered.map((cmd) => (
        <button
          key={cmd.name}
          role="option"
          aria-selected={false}
          onClick={() => onSelect(`/${cmd.name} `)}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent focus:bg-accent focus:outline-none"
        >
          <span className="font-mono text-xs text-muted-foreground">
            /{cmd.name}
          </span>
          <span className="text-muted-foreground">—</span>
          <span>{cmd.description}</span>
        </button>
      ))}
    </div>
  );
}
