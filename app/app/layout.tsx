import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/context/Providers";
import "@/styles/globals.css";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Sky Genesis Enterprise",
    default: "Aether Vault",
  },
  description:
    "An open-source secrets and TOTP vault designed as a security control plane for developers.",
  icons: {
    icon: [
      {
        url: "/enterprise-touch-icon.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/enterprise-touch-icon.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/enterprise-touch-icon.png",
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
        className={`${fontSans.variable} ${fontMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
