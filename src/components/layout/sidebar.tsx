"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUserTags } from "@/hooks/use-items";
import { useFilterStore } from "@/store/filter-store";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth-provider";
import { useAppStore } from "@/store/app-store";
import { 
  Home, 
  Film, 
  BookOpen, 
  Disc, 
  Plane, 
  Library, 
  Star, 
  Archive, 
  Settings,
  PlusCircle
} from "lucide-react";

const mainNavItems = [
  { name: "Archive", href: "/", icon: Home },
  { name: "Collections", href: "/collections", icon: Library },
];

function NavItem({ item, isActive }: { item: any; isActive: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
        isActive 
          ? "bg-secondary text-secondary-foreground shadow-sm" 
          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
      )}
    >
      <Icon className="size-4" />
      {item.name}
    </Link>
  );
}

// Updated Sidebar export to include ThemeToggle and User Profile
import { useTagAction } from "@/hooks/use-tag-action";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-background h-full p-4">
      <div className="flex items-center gap-2 px-2 py-4 mb-6">
        <span className="text-xl font-semibold tracking-tight">
          {user?.displayName ? `${user.displayName.split(' ')[0]}'s Archive` : "Archive"}
        </span>
      </div>

      <nav className="flex-1 space-y-8 overflow-y-auto pr-2 pb-4">
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <NavItem key={item.name} item={item} isActive={pathname === item.href} />
          ))}
        </div>

        <div>
          <h4 className="px-2 text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            Your Tags
          </h4>
          <div className="space-y-0.5">
            <TagList />
          </div>
        </div>
      </nav>

      <div className="mt-auto pt-4 border-t space-y-4">
        <button 
          onClick={() => useAppStore.getState().setQuickAddOpen(true)}
          className="flex w-full items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          <PlusCircle className="size-4" />
          <span>Quick Add (Cmd+K)</span>
        </button>
        
        <div className="flex items-center justify-between px-2 pt-2 border-t border-border/50">
          <button 
            onClick={logout} 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            <span className="font-medium">Log Out</span>
          </button>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}

function TagList() {
  const tags = useUserTags();
  const { selectedTags } = useFilterStore();
  const handleTagAction = useTagAction();

  if (tags.length === 0) {
    return <div className="px-3 py-2 text-xs text-muted-foreground italic">No tags yet</div>;
  }

  return (
    <>
      {tags.map(tag => {
        const isActive = selectedTags.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => handleTagAction(tag)}
            className={cn(
              "w-full flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 text-left",
              isActive 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <span className="opacity-50 text-xs">#</span>
            <span className="truncate">{tag}</span>
          </button>
        );
      })}
    </>
  );
}
