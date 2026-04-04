import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@insforge/nextjs";
import { Button } from "@/components/ui/button";
import { MessageSquare, Globe, Zap, ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background grain">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background rounded-sm"
            aria-label="Tack - Home"
          >
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            <span className="font-serif text-xl font-medium italic">Tack</span>
          </Link>

          <nav aria-label="Main navigation" className="flex items-center gap-3">
            <SignedIn>
              <Link href="/chat">
                <Button className="gap-2">
                  Open Chat
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/pdf-reading">
                <Button className="gap-2">
                  PDF Reader
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton>
                <Button className="gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </SignInButton>
            </SignedOut>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section
        className="pt-40 pb-24 px-6"
        aria-labelledby="hero-heading"
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            AI-Powered Accessibility
          </div>

          <h1
            id="hero-heading"
            className="font-serif text-5xl sm:text-6xl md:text-7xl font-medium italic tracking-tight leading-[1.1] mb-6"
          >
            The internet,{" "}
            <span className="text-gradient">made accessible</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Tack is an AI assistant that helps blind and visually impaired users
            navigate, read, and understand web content through natural conversation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignedIn>
              <Link href="/chat">
                <Button size="lg" className="gap-2 text-base px-8 h-12">
                  Open Chat
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/pdf-reading">
                <Button size="lg" className="gap-2 text-base px-8 h-12">
                  Open PDF Reader
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton>
                <Button size="lg" className="gap-2 text-base px-8 h-12">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        className="py-24 px-6 border-t border-border/50"
        aria-labelledby="features-heading"
      >
        <h2 id="features-heading" className="sr-only">Features</h2>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            {
              icon: MessageSquare,
              title: "Natural Conversation",
              desc: "Ask questions in plain language. Tack understands context and provides clear, structured responses optimized for screen readers.",
            },
            {
              icon: Globe,
              title: "Web Summaries",
              desc: "Share any URL and get an accessible summary. Content is extracted, cleaned of clutter, and presented with proper headings.",
            },
            {
              icon: Zap,
              title: "Slash Commands",
              desc: "Power user shortcuts like /summarize and /read for quick actions. Type / to see all available commands.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-border/60 bg-card/50 p-6 transition-all hover:border-primary/30 hover:bg-card"
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 mb-4 transition-colors group-hover:bg-primary/15">
                <feature.icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-serif text-lg font-medium italic mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <p>Built for accessibility, powered by AI</p>
          <p className="font-serif italic">Tack</p>
        </div>
      </footer>
    </div>
  );
}
