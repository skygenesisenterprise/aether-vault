import type { Metadata } from "next";
import { Newsreader, Public_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/context/Providers";
import "../styles/globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Guilderia",
    default: "Guilderia",
  },
  description:
    "A self-hostable, open-source communication platform built as a sovereign alternative to Discord.",
  icons: {
    icon: [
      {
        url: "/enterprise-favicon.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/enterprise-favicon.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/enterprise-favicon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${publicSans.variable} ${newsreader.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
