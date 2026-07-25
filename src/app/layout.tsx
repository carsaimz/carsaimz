import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/contexts/language-context";
import { AppProvider } from "@/contexts/app-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Carsai Moçambique - Transformação Digital",
  description: "Plataforma tecnológica para transformação digital em Moçambique. Soluções inovadoras que impulsionam o crescimento empresarial.",
  keywords: ["Carsai", "Moçambique", "tecnologia", "transformação digital", "desenvolvimento web", "mobile", "cloud", "IA"],
  authors: [{ name: "Carsai Moçambique" }],
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "Carsai Moçambique - Transformação Digital",
    description: "Soluções tecnológicas inovadoras para empresas moçambicanas",
    siteName: "Carsai Moçambique",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Carsai Moçambique",
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
              <AppShell>
                {children}
              </AppShell>
            </AppProvider>
          </LanguageProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}

// Client-side shell component to avoid hydration mismatches
// from auth/theme/language state differences between server and client
import { AppShell } from "@/components/layout/app-shell";
