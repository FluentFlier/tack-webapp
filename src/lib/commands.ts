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
    requiresArgs: true,
    argError: "Please provide a URL. Usage: /summarize <url>",
    execute: (args: string) => {
      const url = args.trim();
      if (!url) return "Please provide a URL. Usage: /summarize <url>";
      return url;
    },
  },
  {
    name: "read",
    description: "Read and simplify a web page",
    usage: "/read <url>",
    requiresArgs: true,
    argError: "Please provide a URL. Usage: /read <url>",
    execute: (args: string) => {
      const url = args.trim();
      if (!url) return "Please provide a URL. Usage: /read <url>";
      return url;
    },
  },
  {
    name: "search",
    description: "Search the web via Google",
    usage: "/search <query>",
    requiresArgs: true,
    argError: "Please provide a search query. Usage: /search <query>",
    execute: (args: string) => {
      const query = args.trim();
      if (!query)
        return "Please provide a search query. Usage: /search <query>";
      return query;
    },
  },
  {
    name: "clear",
    description: "Start a new conversation",
    usage: "/clear",
    execute: () => {
      // useChat intercepts /clear by name before execute() is ever called;
      // this sentinel is never reached in practice but satisfies the SlashCommand interface.
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
