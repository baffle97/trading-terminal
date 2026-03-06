import type { Metadata } from "next";
import { TRPCProvider } from "~/lib/trpc-provider";
import { Sidebar } from "~/components/layout/sidebar";
import { Header } from "~/components/layout/header";
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
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
          </div>
        </TRPCProvider>
      </body>
    </html>
  );
}
