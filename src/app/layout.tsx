import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { InsforgeProvider } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tack - Accessible AI Assistant",
  description:
    "AI-powered web assistant designed for blind and visually impaired users",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Skip to main content
        </a>
        <InsforgeProvider>
          <div id="main-content" tabIndex={-1} className="min-h-screen">
            {children}
          </div>
        </InsforgeProvider>
      </body>
    </html>
  );
}
