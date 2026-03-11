"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  ShoppingCart,
  Wallet,
  Star,
  LogOut,
  X,
} from "lucide-react";
import { trpc } from "~/lib/trpc";
import { cn } from "~/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/market", label: "Market", icon: BarChart3 },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/watchlist", label: "Watchlist", icon: Star },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => router.replace("/login"),
  });

  const sidebarContent = (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-surface-secondary">
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            G
          </div>
          <span className="text-lg font-semibold">GrowwTrade</span>
        </div>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary md:hidden"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onMobileClose}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-loss"
        >
          <LogOut className="h-4 w-4" />
          {logoutMutation.isPending ? "Logging out..." : "Logout"}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <div className="hidden md:flex">{sidebarContent}</div>

      {/* Mobile drawer — overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onMobileClose}
          />
          {/* Drawer */}
          <div
            className={cn(
              "relative h-full animate-in slide-in-from-left duration-200",
            )}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
