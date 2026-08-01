import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/contexts/language-context";
import { AppProvider } from "@/contexts/app-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { CapacitorBackButtonHandler } from "@/components/common/capacitor-back-handler";
import { ClientLayoutWrapper } from "@/components/common/client-layout-wrapper";
import { DatabaseSetup } from "@/components/common/database-setup";
import { PwaInstallPrompt } from "@/components/common/pwa-install-prompt";
import { PushNotificationSetup } from "@/components/common/push-notification-setup";
import { SITE_URL } from "@/lib/client-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ─── JSON-LD Structured Data (Organization) ───
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Carsai Mozambique",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description:
    "Plataforma tecnológica para transformação digital em Mozambique. Soluções inovadoras que impulsionam o crescimento empresarial.",
  foundingDate: "2024",
  foundingLocation: {
    "@type": "Place",
    name: "Maputo, Mozambique",
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Maputo",
    addressCountry: "MZ",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: ["Portuguese", "English"],
  },
  sameAs: [
    "https://github.com/carsaimz",
  ],
  knowsAbout: [
    "Desenvolvimento Web",
    "Aplicações Mobile",
    "Cloud Computing",
    "Inteligência Artificial",
    "Transformação Digital",
  ],
};

// ─── JSON-LD Structured Data (WebSite with search action) ───
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Carsai Mozambique",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/blog?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Carsai Mozambique — Transformação Digital",
    template: "%s | Carsai Mozambique",
  },
  description:
    "Plataforma tecnológica para transformação digital em Mozambique. Soluções inovadoras de desenvolvimento web, mobile, cloud e IA que impulsionam o crescimento empresarial.",
  keywords: [
    "Carsai",
    "Mozambique",
    "tecnologia",
    "transformação digital",
    "desenvolvimento web",
    "mobile",
    "cloud",
    "IA",
    "inteligência artificial",
    "software",
    "aplicações",
    "Maputo",
    "soluções tecnológicas",
    "desenvolvimento de software",
  ],
  authors: [{ name: "Carsai Mozambique", url: SITE_URL }],
  creator: "Carsai Mozambique",
  publisher: "Carsai Mozambique",
  category: "technology",
  classification: "Technology Services",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Carsai Mozambique — Transformação Digital",
    description:
      "Soluções tecnológicas inovadoras de desenvolvimento web, mobile, cloud e IA para empresas moçambicanas.",
    url: SITE_URL,
    siteName: "Carsai Mozambique",
    locale: "pt_MZ",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Carsai Mozambique — Transformação Digital",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Carsai Mozambique — Transformação Digital",
    description:
      "Soluções tecnológicas inovadoras de desenvolvimento web, mobile, cloud e IA para empresas moçambicanas.",
    images: [`${SITE_URL}/og-image.png`],
  },
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
  alternates: {
    canonical: SITE_URL,
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "CarsaiMz",
    "mobile-web-app-capable": "yes",
    "theme-color": "#0f172a",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-MZ" suppressHydrationWarning>
      <head>
        {/* JSON-LD Structured Data — Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        {/* JSON-LD Structured Data — WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <AppProvider>
              <NotificationProvider>
                <DatabaseSetup />
                <CapacitorBackButtonHandler />
                <ClientLayoutWrapper>
                  {children}
                </ClientLayoutWrapper>
                <PwaInstallPrompt />
                <PushNotificationSetup compact />
              </NotificationProvider>
            </AppProvider>
          </LanguageProvider>
        </ThemeProvider>
        <Toaster />
        <SonnerToaster richColors position="top-right" />
      </body>
    </html>
  );
}
