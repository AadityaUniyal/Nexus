import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AnalyticsProvider } from "@/components/providers/AnalyticsProvider";

const sans = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1215" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Nexus · Logistics analytics for operations teams",
    template: "%s · Nexus",
  },
  description:
    "Nexus turns fleet, warehouse and order data into clear analytics, forecasts and decisions for logistics teams.",
  applicationName: "Nexus",
  openGraph: {
    title: "Nexus · Logistics analytics",
    description: "Forecasts, anomaly detection and what-if planning for logistics operations.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexus · Logistics analytics",
    description: "Forecasts, anomaly detection and what-if planning for logistics operations.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#0e5e58",

          borderRadius: "0.625rem",
          fontFamily: "var(--font-sans)",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `try{if(localStorage.theme==='dark'||(!('theme' in localStorage)&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(_){}`,
            }}
          />
        </head>
        <body className="bg-nexus-surface text-nexus-on-surface antialiased selection:bg-brand-200 selection:text-brand-900">
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
    </ClerkProvider>
  );
}
