import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/contexts/language-context";
import { AppProvider } from "@/contexts/app-context";
import { CapacitorBackButtonHandler } from "@/components/common/capacitor-back-handler";
import { ClientLayoutWrapper } from "@/components/common/client-layout-wrapper";
import { DatabaseSetup } from "@/components/common/database-setup";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Carsai Mozambique - Transformação Digital",
  description: "Plataforma tecnológica para transformação digital em Mozambique. Soluções inovadoras que impulsionam o crescimento empresarial.",
  keywords: ["Carsai", "Mozambique", "tecnologia", "transformação digital", "desenvolvimento web", "mobile", "cloud", "IA"],
  authors: [{ name: "Carsai Mozambique" }],
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "Carsai Mozambique - Transformação Digital",
    description: "Soluções tecnológicas inovadoras para empresas moçambicanas",
    siteName: "Carsai Mozambique",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Carsai Mozambique",
    description: "Soluções tecnológicas inovadoras para empresas moçambicanas",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-MZ" suppressHydrationWarning>
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
              <DatabaseSetup />
              <CapacitorBackButtonHandler />
              <ClientLayoutWrapper>
                {children}
              </ClientLayoutWrapper>
            </AppProvider>
          </LanguageProvider>
        </ThemeProvider>
        <Toaster />
        <SonnerToaster richColors position="top-right" />
      </body>
    </html>
  );
}
