import type { Metadata } from "next";
import "@/styles/globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/components/providers/AuthProvider";

export const metadata: Metadata = {
  title: "NEXUS · Operational Intelligence & Decision Simulation",
  description:
    "A tactile, warm-industrial operational-intelligence and decision-simulation platform for complex physical networks.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-nexus-surface text-nexus-on-surface antialiased selection:bg-nexus-secondary/20 selection:text-nexus-secondary">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
