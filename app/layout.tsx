import type { Metadata, Viewport } from "next";
import { Instrument_Serif } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { themeInitScript } from "@/lib/theme";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { MotionProvider } from "@/components/providers/motion-provider";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { ToastProvider } from "@/components/providers/toast-provider";

// Display face. Ships in one weight; the italic is for the login quotes.
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
});

// Body face — legibility chosen as a brand value.
const atkinson = localFont({
  src: [
    { path: "../assets/fonts/atkinson-regular.woff2", weight: "400", style: "normal" },
    { path: "../assets/fonts/atkinson-bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-atkinson",
  adjustFontFallback: "Arial",
});

// Pixel serif, used for the Show&Tell wordmark and nothing else.
const mondwest = localFont({
  src: "../assets/fonts/PPMondwest-Regular.woff2",
  weight: "400",
  variable: "--font-mondwest",
  adjustFontFallback: "Times New Roman",
});

export const metadata: Metadata = {
  title: "Show&Tell — Malaysian AI",
  description:
    "The running record of what Malaysian AI builders are building — every project shown at the Weekly Show & Tell, and the progress that followed.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4efe6" },
    { media: "(prefers-color-scheme: dark)", color: "#06090f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // The head script stamps data-theme before hydration.
      suppressHydrationWarning
      className={`${instrumentSerif.variable} ${atkinson.variable} ${mondwest.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <MotionProvider>
            <ConvexClientProvider>
              <ToastProvider>{children}</ToastProvider>
            </ConvexClientProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
