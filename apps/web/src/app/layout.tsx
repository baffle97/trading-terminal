import type { Metadata } from "next";
import { TRPCProvider } from "~/lib/trpc-provider";
import { AppShell } from "~/components/layout/app-shell";
import "./globals.css";

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
    <html lang="en" className="dark">
      <body className="antialiased">
        <TRPCProvider>
          <AppShell>{children}</AppShell>
        </TRPCProvider>
      </body>
    </html>
  );
}
