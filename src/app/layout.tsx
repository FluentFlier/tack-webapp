import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/*
          Blocking script: applies saved accessibility settings before first paint
          to prevent FOUC. Reads tack_preferences from localStorage and sets
          --base-font-size, data-color-profile, and .reduced-motion on <html>.
        */}
        <Script
          id="a11y-restore"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var s = localStorage.getItem('tack_preferences');
                if (s) {
                  var p = JSON.parse(s);
                  var r = document.documentElement;
                  var fsMap = { small: 14, medium: 16, large: 20, 'x-large': 24 };
                  if (p.font_size && fsMap[p.font_size]) {
                    r.style.setProperty('--base-font-size', fsMap[p.font_size] + 'px');
                  }
                  if (p.high_contrast) {
                    r.setAttribute('data-color-profile', 'high-contrast');
                  }
                  if (p.reduced_motion) {
                    r.classList.add('reduced-motion');
                    r.style.setProperty('--motion-duration', '0.001ms');
                  }
                }
              } catch(e) {}
            `,
          }}
        />
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

