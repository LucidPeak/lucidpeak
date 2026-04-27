import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CommentOverlay } from "@/components/CommentOverlay";
import { LayoutControls } from "@/components/LayoutControls";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
        {/* Kill Chrome/Safari's lavender/yellow autofill bar on the terminal
            input. Inline because LightningCSS strips :-webkit-autofill rules
            from Tailwind v4's compiled output. */}
        <style
          dangerouslySetInnerHTML={{
            __html: `.term-input:-webkit-autofill,.term-input:-webkit-autofill:hover,.term-input:-webkit-autofill:focus,.term-input:-webkit-autofill:active{-webkit-box-shadow:0 0 0 1000px #1c1b19 inset !important;box-shadow:0 0 0 1000px #1c1b19 inset !important;-webkit-text-fill-color:#e9e5d8 !important;caret-color:#e9e5d8 !important;transition:background-color 600000s ease-in-out 0s,color 600000s ease-in-out 0s !important;}`,
          }}
        />
        {/* Wide-monitor scale-up. Inline because Tailwind v4's LightningCSS
            strips `zoom` as a non-spec property. Each tier's min-height
            threshold equals 780 * zoom, mirroring the old h/780 cap so a
            tier only kicks in when there's enough vertical room for it.
            CSS in <head> applies pre-paint — eliminates the post-load
            zoom snap that the previous JS version caused (CLS). */}
        <style
          dangerouslySetInnerHTML={{
            __html: `@media (min-width:1440px) and (min-height:897px){body{zoom:1.15;min-height:86.957vh !important;}.min-h-screen,.min-h-full{min-height:86.957vh !important;}}@media (min-width:1700px) and (min-height:1014px){body{zoom:1.3;min-height:76.923vh !important;}.min-h-screen,.min-h-full{min-height:76.923vh !important;}}@media (min-width:2000px) and (min-height:1170px){body{zoom:1.5;min-height:66.667vh !important;}.min-h-screen,.min-h-full{min-height:66.667vh !important;}}@media (min-width:2400px) and (min-height:1365px){body{zoom:1.75;min-height:57.143vh !important;}.min-h-screen,.min-h-full{min-height:57.143vh !important;}}@media (min-width:2800px) and (min-height:1560px){body{zoom:2;min-height:50vh !important;}.min-h-screen,.min-h-full{min-height:50vh !important;}}@media (min-width:3200px) and (min-height:1755px){body{zoom:2.25;min-height:44.444vh !important;}.min-h-screen,.min-h-full{min-height:44.444vh !important;}}`,
          }}
        />
      </head>
      <body className="min-h-full font-sans">
        {children}
        <Analytics />
        <SpeedInsights />
        {process.env.NODE_ENV === "development" && (
          <>
            <CommentOverlay />
            <LayoutControls />
          </>
        )}
      </body>
    </html>
  );
}
