import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import NavProgress from "@/components/layout/nav-progress";
import WhatsAppFab from "@/components/layout/whatsapp-fab";
import ServiceWorkerRegister from "@/components/pwa/sw-register";
import { getThemeContext } from "@/lib/theme/server";
import { buildThemeStyleBody, buildGoogleFontsHref } from "@/lib/theme/render";
import LocalPreviewChip from "@/components/layout/local-preview-chip";
import { ShopStoreProvider } from "@/lib/shop-store";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name }],
  keywords: [
    "TeaKart",
    "online shopping India",
    "curated shop",
    "small batch",
    "direct from maker",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: siteConfig.name,
    statusBarStyle: "default",
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ede2cc" },
    { media: "(prefers-color-scheme: dark)", color: "#2a2018" },
  ],
  colorScheme: "light",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { tokens, isPreview } = await getThemeContext();
  const styleBody = buildThemeStyleBody(tokens);
  const googleFontsHref = buildGoogleFontsHref(tokens);

  // Site-level structured data (Organization + WebSite). Product pages emit
  // their own Product schema; this gives the homepage and every other route a
  // valid graph for rich results. Purely additive — no effect on rendering.
  const siteJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteConfig.url}/#organization`,
        name: siteConfig.name,
        url: siteConfig.url,
        logo: `${siteConfig.url}/logo.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
        publisher: { "@id": `${siteConfig.url}/#organization` },
      },
    ],
  };

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // The inline theme-mode script in <head> adds the "dark" class to
      // <html> before React hydrates, so the className the client sees is
      // intentionally not the one the server sent. Without this React
      // throws a hydration mismatch for the class attribute.
      suppressHydrationWarning
    >
      <head>
        {googleFontsHref && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="stylesheet" href={googleFontsHref} />
          </>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        {styleBody && (
          <style dangerouslySetInnerHTML={{ __html: styleBody }} />
        )}
        {/*
          Apply the saved theme mode BEFORE React hydrates to prevent a
          light-then-dark flash. Falls back to system preference. Kept
          minimal — under 200 bytes — so it doesn't bloat <head>.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('teakart-theme-mode');if(!m)m=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';if(m==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ShopStoreProvider>
          <NavProgress />
          {children}
          {isPreview && <LocalPreviewChip />}
          <WhatsAppFab />
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              className: 'rounded-xl border border-border shadow-lg',
            }}
          />
          <ServiceWorkerRegister />
        </ShopStoreProvider>
      </body>
    </html>
  );
}
