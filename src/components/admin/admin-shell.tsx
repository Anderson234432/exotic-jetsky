"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, LayoutDashboard, CalendarRange, Ship, Wallet, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/rentas", label: "Rentas", icon: CalendarRange },
  { href: "/admin/jetskis", label: "Jetskis", icon: Ship },
  { href: "/admin/finanzas", label: "Finanzas", icon: Wallet },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-brand text-brand-foreground"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Sidebar desktop */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:flex md:w-64 md:flex-col border-r bg-white">
        <div className="flex h-16 items-center px-6 font-bold text-lg">
          Exotic <span className="text-brand-accent ml-1">Jetsky</span>
        </div>
        <div className="flex-1 px-3">
          <NavLinks />
        </div>
        <div className="p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-slate-600 h-11"
            onClick={handleLogout}
          >
            <LogOut className="size-5" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Header mobile */}
      <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:hidden sticky top-0 z-30">
        <div className="font-bold text-lg">
          Exotic <span className="text-brand-accent ml-1">Jetsky</span>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={<Button variant="outline" size="icon" className="size-11" />}
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex h-16 items-center px-6 font-bold text-lg border-b">
              Exotic <span className="text-brand-accent ml-1">Jetsky</span>
            </div>
            <div className="flex flex-col justify-between h-[calc(100%-4rem)] p-3">
              <NavLinks onNavigate={() => setOpen(false)} />
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-slate-600 h-11"
                onClick={handleLogout}
              >
                <LogOut className="size-5" />
                Cerrar sesión
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <main className="md:pl-64">
        <div className="mx-auto max-w-6xl p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
