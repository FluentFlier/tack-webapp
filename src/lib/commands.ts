import type { SlashCommand } from "@/types";

export const COMMANDS: SlashCommand[] = [
  {
    name: "help",
    description: "Show available commands",
    usage: "/help",
    execute: () => {
      return COMMANDS.map((cmd) => `${cmd.usage} — ${cmd.description}`).join(
        "\n"
      );
    },
  },
  {
    name: "summarize",
    description: "Summarize a web page",
    usage: "/summarize <url>",
    execute: (args: string) => {
      const url = args.trim();
      if (!url) return "Please provide a URL. Usage: /summarize <url>";
      return `__COMMAND__:summarize:${url}`;
    },
  },
  {
    name: "read",
    description: "Read and simplify a web page",
    usage: "/read <url>",
    execute: (args: string) => {
      const url = args.trim();
      if (!url) return "Please provide a URL. Usage: /read <url>";
      return `__COMMAND__:read:${url}`;
    },
  },
  {
    name: "clear",
    description: "Start a new conversation",
    usage: "/clear",
    execute: () => {
      return "__COMMAND__:clear";
    },
  },
];

export function parseCommand(input: string): {
  isCommand: boolean;
  command?: SlashCommand;
  args?: string;
} {
  if (!input.startsWith("/")) {
    return { isCommand: false };
  }

  const parts = input.slice(1).split(/\s+/);
  const commandName = parts[0]?.toLowerCase();
  const args = parts.slice(1).join(" ");

  const command = COMMANDS.find((cmd) => cmd.name === commandName);
  if (!command) {
    return { isCommand: false };
  }

  return { isCommand: true, command, args };
}
