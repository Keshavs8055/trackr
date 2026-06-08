"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserTags } from "@/hooks/use-items";
import { useFilterStore } from "@/store/filter-store";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth-provider";
import { useAppStore } from "@/store/app-store";
import { useTagAction } from "@/hooks/use-tag-action";
import { Archive, Plus, LogOut } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const setQuickAddOpen = useAppStore(s => s.setQuickAddOpen);

  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-border/40 bg-background h-full p-5 justify-between">
      <div className="flex-1 space-y-8 overflow-y-auto pr-1">
        {/* Logo/Header */}
        <div className="py-2">
          <span className="text-base font-semibold tracking-tight text-foreground/90">
            {user?.displayName ? `${user.displayName.split(' ')[0]}'s Archive` : "Personal Archive"}
          </span>
        </div>

        {/* Main Nav */}
        <div className="space-y-1">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150",
              pathname === "/" 
                ? "bg-secondary text-foreground" 
                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            )}
          >
            <Archive className="size-4 opacity-75" />
            Archive
          </Link>
        </div>

        {/* Tags Index */}
        <div className="space-y-3">
          <h4 className="px-2.5 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
            Tags
          </h4>
          <TagList />
        </div>
      </div>

      {/* Footer Controls */}
      <div className="pt-4 border-t border-border/40 space-y-3.5">
        <button 
          onClick={() => setQuickAddOpen(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground h-9 text-xs font-semibold hover:opacity-90 active:scale-98 transition-all"
        >
          <Plus className="size-3.5 stroke-[2.5px]" />
          <span>Quick Add</span>
          <span className="text-[10px] opacity-60 ml-1 font-normal">⌘K</span>
        </button>
        
        <div className="flex items-center justify-between px-1.5 pt-1.5 border-t border-border/20">
          <button 
            onClick={logout} 
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors font-medium"
          >
            <LogOut className="size-3.5" />
            <span>Sign Out</span>
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
    return <div className="px-2.5 text-xs text-muted-foreground/50 italic">No tags yet</div>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      {tags.map(tag => {
        const isActive = selectedTags.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => handleTagAction(tag)}
            className={cn(
              "w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150",
              isActive 
                ? "bg-secondary text-primary font-bold" 
                : "text-muted-foreground/80 hover:bg-secondary/40 hover:text-foreground"
            )}
          >
            <span className="truncate">#{tag}</span>
            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
          </button>
        );
      })}
    </div>
  );
}
