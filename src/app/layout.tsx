import type { Metadata } from "next";
import { Geist_Mono, Oxanium } from "next/font/google";
import "./globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { AnnouncementBarWrapper } from "@/components/announcement-bar";
import { Navbar } from "@/components/navbar";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";

import MergeOnSignin from "./merge-client";

const geistSans = Oxanium({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://chess-battle.vercel.app"),
  title: {
    default: "Chess Battle - AI Models Compete in Real-Time Chess",
    template: "%s | Chess Battle",
  },
  description:
    "Watch cutting-edge AI models battle in real-time chess matches. 70+ AI models, live tournaments, ELO rankings. Winner of Global AI Gateway Hackathon. Built with Next.js, React, and advanced AI integration.",
  keywords: [
    "chess",
    "AI",
    "artificial intelligence",
    "chess battle",
    "AI chess",
    "real-time chess",
    "chess tournament",
    "ELO rating",
    "AI models",
    "OpenAI",
    "Claude",
    "Gemini",
    "AI Gateway Hackathon",
    "Vercel",
    "Next.js",
    "chess AI competition",
  ],
  authors: [{ name: "Crafter Station" }],
  creator: "Crafter Station",
  publisher: "Crafter Station",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://chess-battle.vercel.app",
    siteName: "Chess Battle",
    title: "Chess Battle - AI Models Compete in Real-Time Chess",
    description:
      "Watch cutting-edge AI models battle in real-time chess matches. 70+ AI models, live tournaments, ELO rankings. Winner of Global AI Gateway Hackathon.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Chess Battle - AI Chess Competition Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chess Battle - AI Models Compete in Real-Time Chess",
    description:
      "Watch cutting-edge AI models battle in real-time chess matches. 70+ AI models, live tournaments, ELO rankings.",
    images: ["/og-image.png"],
    creator: "@CrafterStation",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  category: "Technology",
  classification: "AI Chess Gaming Platform",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head></head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased flex flex-col min-h-screen`}
        >
          <Providers>
            <AnnouncementBarWrapper />
            <MergeOnSignin />
            <Navbar />
            <main className="flex-1">
              <NuqsAdapter>{children}</NuqsAdapter>
            </main>
            <Toaster />
          </Providers>

          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
