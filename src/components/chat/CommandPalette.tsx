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
      className="app-command-palette absolute bottom-full left-0 right-0 mb-1 rounded-lg p-1"
    >
      {filtered.map((cmd) => (
        <button
          key={cmd.name}
          role="option"
          aria-selected={false}
          onClick={() => onSelect(`/${cmd.name} `)}
          className="app-command-palette__item flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm focus:outline-none transition-colors"
        >
          <span className="font-mono text-xs text-[hsl(255,60%,70%)]">
            /{cmd.name}
          </span>
          <span className="text-muted-foreground">—</span>
          <span className="text-[rgba(240,237,237,0.75)]">{cmd.description}</span>
        </button>
      ))}
    </div>
  );
}
