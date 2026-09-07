import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AvatarCompanionWrapper } from "@/components/avatar/AvatarCompanionWrapper";

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f3f4f0' },
    { media: '(prefers-color-scheme: dark)', color: '#161815' }
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "NEXUS · Operational Intelligence & Decision Simulation",
  description:
    "A tactile, warm-industrial operational-intelligence and decision-simulation platform for complex physical networks.",
  openGraph: {
    title: "NEXUS · Operational Intelligence",
    description: "Decision-simulation platform for complex physical networks.",
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "NEXUS · Operational Intelligence",
    description: "Decision-simulation platform for complex physical networks.",
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="bg-nexus-surface text-nexus-on-surface antialiased selection:bg-nexus-secondary/20 selection:text-nexus-secondary">
        <QueryProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
              <AvatarCompanionWrapper />
            </ToastProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
