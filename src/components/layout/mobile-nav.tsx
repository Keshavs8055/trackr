"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusCircle, Library, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

import { LogOut } from "lucide-react";

const mobileItems = [
  { name: "Archive", href: "/", icon: Home },
  { name: "Collections", href: "/collections", icon: Library },
  { name: "Log Out", href: "#logout", icon: LogOut, isLogout: true },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-none">
      <nav className="flex h-16 items-center justify-around px-4">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isLogout) {
            return (
              <button
                key={item.name}
                onClick={() => {
                  import("@/components/auth-provider").then(m => m.useAuth().logout?.());
                }}
                className="flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors text-muted-foreground hover:text-destructive"
              >
                <Icon className="size-5" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("size-5", isActive && "fill-primary/20")} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
