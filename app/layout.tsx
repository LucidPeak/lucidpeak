import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CommentOverlay } from "@/components/CommentOverlay";
import { LayoutControls } from "@/components/LayoutControls";

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
        {/* Wide-monitor scale-up. Tailwind v4's LightningCSS strips `zoom` as
            a non-spec property, so we apply it via inline JS on body instead.
            Runs pre-React-hydration to avoid flash of small content. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var set=function(){var w=window.innerWidth,h=window.innerHeight,z=1;if(w>=3200)z=2.25;else if(w>=2800)z=2;else if(w>=2400)z=1.75;else if(w>=2000)z=1.5;else if(w>=1700)z=1.3;else if(w>=1440)z=1.15;z=Math.min(z,h/780);z=Math.max(1,z);var b=document.body;if(!b)return;b.style.zoom=z===1?"":String(z);var mh=z===1?"":(100/z)+"vh";b.style.minHeight=mh;var nodes=b.querySelectorAll('[class*="min-h-screen"],[class*="min-h-full"]');for(var i=0;i<nodes.length;i++){nodes[i].style.minHeight=mh;}};if(document.body){set();}else{document.addEventListener("DOMContentLoaded",set);}window.addEventListener("resize",set);})();`,
          }}
        />
      </head>
      <body className="min-h-full font-sans">
        {children}
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
