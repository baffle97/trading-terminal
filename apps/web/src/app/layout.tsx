import type { Metadata } from "next";
import { TRPCProvider } from "~/lib/trpc-provider";
import { AppShell } from "~/components/layout/app-shell";
import { Toaster } from "~/components/ui/sonner";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "~/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "GrowwTrade Pro",
  description: "Personal trading terminal powered by Groww API",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("dark", "font-sans", geist.variable)}>
      <body className="antialiased">
        <TRPCProvider>
          <AppShell>{children}</AppShell>
        </TRPCProvider>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
