import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@insforge/nextjs";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout";
import { MessageSquare, Globe, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex flex-col items-center justify-center px-4 py-16">
        <section aria-labelledby="hero-heading" className="text-center max-w-2xl">
          <h1
            id="hero-heading"
            className="text-4xl font-bold tracking-tight sm:text-5xl"
          >
            The internet, made accessible
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Tack is an AI assistant that helps blind and visually impaired users
            navigate the web. Summarize pages, extract content, and browse — all
            through a simple chat interface optimized for screen readers.
          </p>

          <div className="mt-8 flex gap-4 justify-center">
            <SignedOut>
              <SignInButton>
                <Button size="lg">Get Started</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/chat">
                <Button size="lg">Open Chat</Button>
              </Link>
            </SignedIn>
          </div>
        </section>

        <section
          aria-labelledby="features-heading"
          className="mt-20 max-w-4xl w-full"
        >
          <h2 id="features-heading" className="sr-only">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-lg border">
              <MessageSquare
                className="h-10 w-10 mb-4 text-primary"
                aria-hidden="true"
              />
              <h3 className="font-semibold text-lg">Chat Interface</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Ask questions naturally. Tack responds with clear, structured
                content optimized for screen readers.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-lg border">
              <Globe
                className="h-10 w-10 mb-4 text-primary"
                aria-hidden="true"
              />
              <h3 className="font-semibold text-lg">Web Summaries</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Paste any URL and get an accessible summary. No more wrestling
                with cluttered web pages.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-lg border">
              <Zap
                className="h-10 w-10 mb-4 text-primary"
                aria-hidden="true"
              />
              <h3 className="font-semibold text-lg">Slash Commands</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Power users can use commands like /summarize and /read for
                lightning-fast workflows.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
