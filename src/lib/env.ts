function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  INSFORGE_BASE_URL: requireEnv("NEXT_PUBLIC_INSFORGE_BASE_URL"),
  INSFORGE_ANON_KEY: requireEnv("NEXT_PUBLIC_INSFORGE_ANON_KEY"),
} as const;
