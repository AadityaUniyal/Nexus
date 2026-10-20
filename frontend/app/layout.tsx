import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "@/styles/globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AnalyticsProvider } from "@/components/providers/AnalyticsProvider";

const sans = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0d" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "VOYAGE · The Freight Operating System",
    template: "%s · VOYAGE",
  },
  description:
    "Preempt freight delays, coordinate drivers with zero-install WhatsApp passes, and verify deliveries instantly with camera Proof-of-Delivery.",
  applicationName: "VOYAGE",
  openGraph: {
    title: "VOYAGE · The Freight Operating System",
    description: "Real-time freight exception preemption, zero-install driver dispatch, and instant proof of delivery.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VOYAGE · The Freight Operating System",
    description: "Real-time freight exception preemption, zero-install driver dispatch, and instant proof of delivery.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.theme==='dark'||(!('theme' in localStorage)&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(_){}`,
          }}
        />
      </head>
      <body className="bg-nexus-surface text-nexus-on-surface antialiased selection:bg-brand-200 selection:text-brand-900 font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-md focus:bg-nexus-surface-lowest focus:px-3 focus:py-2 focus:text-sm focus:shadow-tactile-lg"
        >
          Skip to content
        </a>
        <QueryProvider>
          <AuthProvider>
            <ToastProvider>
              <AnalyticsProvider />
              {children}
            </ToastProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
