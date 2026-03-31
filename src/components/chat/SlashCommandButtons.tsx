"use client";

import { COMMANDS } from "@/lib/commands";
import {
  HelpCircle,
  FileText,
  BookOpen,
  Globe,
  Trash2,
  type LucideIcon,
} from "lucide-react";

interface SlashCommandButtonsProps {
  onSelect: (command: string) => void;
  disabled?: boolean;
}

// Map command names to icons for visual clarity
const COMMAND_ICONS: Record<string, LucideIcon> = {
  help: HelpCircle,
  summarize: FileText,
  read: BookOpen,
  search: Globe,
  clear: Trash2,
};

// Short descriptions for the buttons (more concise than the full descriptions)
const BUTTON_LABELS: Record<string, string> = {
  help: "Help",
  summarize: "Summarize",
  read: "Read Page",
  search: "Search Web",
  clear: "Clear Chat",
};

export function SlashCommandButtons({
  onSelect,
  disabled = false,
}: SlashCommandButtonsProps) {
  return (
    <div
      className="flex flex-wrap gap-2 px-4 pb-2"
      role="toolbar"
      aria-label="Quick commands"
    >
      {COMMANDS.map((cmd) => {
        const Icon = COMMAND_ICONS[cmd.name];
        const label = BUTTON_LABELS[cmd.name] || `/${cmd.name}`;

        return (
          <button
            key={cmd.name}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(`/${cmd.name} `)}
            title={cmd.description}
            aria-label={`${cmd.description} — /${cmd.name}`}
            className="
              inline-flex items-center gap-1.5
              rounded-full border border-border
              bg-muted/50 px-3 py-1.5
              text-xs font-medium text-muted-foreground
              transition-all duration-150 ease-out
              hover:bg-accent hover:text-accent-foreground hover:border-accent
              hover:shadow-sm hover:scale-[1.03]
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1
              active:scale-[0.97]
              disabled:opacity-40 disabled:pointer-events-none
            "
          >
            {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
