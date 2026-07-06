import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { InsforgeProvider } from "./providers";

const inter = Inter({ subsets: ["latin"] });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

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
      <head>
        {/*
          Blocking script: applies saved accessibility settings before first paint
          to prevent FOUC. Reads tack_preferences from localStorage and sets
          --base-font-size, data-color-profile, and .reduced-motion on <html>.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                var r = document.documentElement;
                /* ── Theme (light/dark/system) — set data-theme before first paint ── */
                try {
                  var th = localStorage.getItem('tack_theme');
                  var dark = th === 'dark' ||
                             (th !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  r.setAttribute('data-theme', dark ? 'dark' : 'light');
                } catch(e) {}
                /* ── Accessibility preferences ── */
                try {
                  var s = localStorage.getItem('tack_preferences');
                  if (s) {
                    var p = JSON.parse(s);
                    var fsMap = { small: 14, medium: 16, large: 20, 'x-large': 24 };
                    if (p.font_size && fsMap[p.font_size]) {
                      r.style.setProperty('--base-font-size', fsMap[p.font_size] + 'px');
                    }
                    var profile = p.color_profile || (p.high_contrast ? 'high-contrast' : 'default');
                    if (profile && profile !== 'default') {
                      r.setAttribute('data-color-profile', profile);
                    }
                    if (profile === 'custom' && p.custom_fg && p.custom_bg) {
                      r.style.setProperty('--custom-fg', p.custom_fg);
                      r.style.setProperty('--custom-bg', p.custom_bg);
                    }
                    if (p.reduced_motion) {
                      r.classList.add('reduced-motion');
                      r.style.setProperty('--motion-duration', '0.001ms');
                    }
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className={`${inter.className} ${playfair.variable} ${jetbrainsMono.variable}`}>
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

