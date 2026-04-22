import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { InsforgeProvider } from "./providers";

const inter = Inter({ subsets: ["latin"] });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VisionAccess - Accessible Information Portal",
  description:
    "AI-powered accessible information portal with adaptive accessibility modes for dyslexia, low vision, color blind, and ADHD users",
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
          Blocking script: restore BOTH preference settings AND accessibility
          mode settings before first paint to prevent FOUC.
        */}
        <Script
          id="a11y-restore"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // ── Restore existing preferences ──
                var s = localStorage.getItem('tack_preferences');
                if (s) {
                  var p = JSON.parse(s);
                  var r = document.documentElement;
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

                // ── Restore accessibility modes ──
                var a = localStorage.getItem('visionaccess_a11y');
                if (a) {
                  var state = JSON.parse(a);
                  var root = document.documentElement;
                  var modes = state.activeModes || [];
                  modes.forEach(function(m) { root.setAttribute('data-a11y-' + m, ''); });
                  if (state.fontScale) root.style.setProperty('--a11y-font-scale', String(state.fontScale));
                  if (state.contrastMode === 'high') root.setAttribute('data-a11y-high-contrast', '');
                  if (state.motionReduced) root.classList.add('a11y-reduced-motion');
                  if (state.focusMode) root.classList.add('a11y-focus-mode');
                  var spacingMap = { normal: '0em', wide: '0.08em', wider: '0.14em' };
                  var wordMap = { normal: '0em', wide: '0.12em', wider: '0.2em' };
                  var lineMap = { normal: '1.6', wide: '1.8', wider: '2.0' };
                  if (state.textSpacing) {
                    root.style.setProperty('--a11y-letter-spacing', spacingMap[state.textSpacing] || '0em');
                    root.style.setProperty('--a11y-word-spacing', wordMap[state.textSpacing] || '0em');
                    root.style.setProperty('--a11y-line-height', lineMap[state.textSpacing] || '1.6');
                  }
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} ${playfair.variable}`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[hsl(180,100%,50%)] focus:text-[hsl(220,25%,6%)] focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:font-semibold"
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

