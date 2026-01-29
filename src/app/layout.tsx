import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://amsterdamaibuilders.com";

export const metadata: Metadata = {
  title: {
    default: "Amsterdam AI Builders",
    template: "%s | Amsterdam AI Builders",
  },
  description: "A community of builders, hackers, and creators exploring AI in Amsterdam. Join us to share projects, learn, and build cool stuff together.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Amsterdam AI Builders",
    description: "Building the future of AI, together",
    url: siteUrl,
    siteName: "Amsterdam AI Builders",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Amsterdam AI Builders",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Amsterdam AI Builders",
    description: "Building the future of AI, together",
    images: ["/og-image.svg"],
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Skip to content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-neutral-900 focus:rounded-lg focus:font-medium"
        >
          Skip to content
        </a>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
