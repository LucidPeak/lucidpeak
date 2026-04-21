import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CommentOverlay } from "@/components/CommentOverlay";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "lucidpeak — a small studio building software for curious people",
  description:
    "Portfolio of lucidpeak. Focused tools for curious people, shipped one at a time.",
  metadataBase: new URL("https://lucidpeak.co"),
  openGraph: {
    title: "lucidpeak",
    description:
      "A small studio building software for curious people.",
    url: "https://lucidpeak.co",
    siteName: "lucidpeak",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "lucidpeak",
    description: "A small studio building software for curious people.",
  },
};

export const viewport = {
  colorScheme: "light" as const,
  themeColor: "#eceae4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-color-scheme="light"
      style={{ colorScheme: "only light" }}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="color-scheme" content="only light" />
      </head>
      <body className="min-h-full font-sans">
        {children}
        {process.env.NODE_ENV === "development" && <CommentOverlay />}
      </body>
    </html>
  );
}
