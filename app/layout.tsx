import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import React from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | AI Pricing Dashboard',
    default: 'AI Pricing Dashboard'
  },
  description: 'Compare pricing for different AI language models',
  metadataBase: new URL('https://ai-price-comparison.vercel.app/'), // Replace with your actual domain
  openGraph: {
    type: 'website',
    siteName: 'AI Pricing Dashboard',
    description: 'Compare pricing for different AI language models',
    url: 'https://ai-price-comparison.vercel.app/',
    locale: 'en_US',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
