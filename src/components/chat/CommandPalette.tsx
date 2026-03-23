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
      className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-border/60 bg-card shadow-xl shadow-black/10 overflow-hidden backdrop-blur-sm"
      role="listbox"
      aria-label="Available commands"
    >
      {filtered.map((cmd) => (
        <button
          key={cmd.name}
          role="option"
          aria-selected={false}
          onClick={() => onSelect(`/${cmd.name} `)}
          className="w-full text-left px-4 py-3 hover:bg-accent transition-colors focus:outline-none focus:bg-accent border-b border-border/30 last:border-0"
        >
          <span className="text-primary font-mono text-sm font-medium">
            /{cmd.name}
          </span>
          <p className="text-muted-foreground text-xs mt-0.5">{cmd.description}</p>
        </button>
      ))}
    </div>
  );
}
