"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Archive, Search, Plus, User, X, LogOut, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useFilterStore } from "@/store/filter-store";
import { useAuth } from "@/components/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function MobileNav() {
  const router = useRouter();
  const pathname = usePathname();
  
  const setQuickAddOpen = useAppStore(s => s.setQuickAddOpen);
  const setSearchFocused = useAppStore(s => s.setSearchFocused);
  const { clearFilters } = useFilterStore();
  
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);

  const handleHomeClick = () => {
    clearFilters();
    if (pathname !== "/") {
      router.push("/");
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSearchClick = () => {
    setSearchFocused(true);
    if (pathname !== "/") {
      router.push("/");
    } else {
      const searchInput = document.querySelector("input[placeholder*='Search']") as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    }
  };

  return (
    <>
      {/* Mobile Tab Navigation (h-14, safe inset bottom) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/30 bg-background/95 backdrop-blur-md pb-safe">
        <nav className="flex h-14 items-center justify-around px-4">
          
          {/* Archive */}
          <button
            onClick={handleHomeClick}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 w-12 h-12 rounded-xl transition-all",
              pathname === "/" && !profileDrawerOpen ? "text-primary" : "text-muted-foreground/80"
            )}
          >
            <Archive className="size-4" />
            <span className="text-[9px] font-medium tracking-tight">Archive</span>
          </button>

          {/* Search */}
          <button
            onClick={handleSearchClick}
            className="flex flex-col items-center justify-center gap-0.5 w-12 h-12 rounded-xl transition-all text-muted-foreground/80"
          >
            <Search className="size-4" />
            <span className="text-[9px] font-medium tracking-tight">Search</span>
          </button>

          {/* Add */}
          <button
            onClick={() => setQuickAddOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 w-12 h-12 rounded-xl transition-all text-muted-foreground/80"
          >
            <Plus className="size-4" />
            <span className="text-[9px] font-medium tracking-tight">Add</span>
          </button>

          {/* Profile */}
          <button
            onClick={() => setProfileDrawerOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 w-12 h-12 rounded-xl transition-all",
              profileDrawerOpen ? "text-primary" : "text-muted-foreground/80"
            )}
          >
            <User className="size-4" />
            <span className="text-[9px] font-medium tracking-tight">Profile</span>
          </button>

        </nav>
      </div>

      {/* Profile Drawer */}
      <ProfileDrawer isOpen={profileDrawerOpen} onClose={() => setProfileDrawerOpen(false)} />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                              PROFILE DRAWER                                */
/* -------------------------------------------------------------------------- */
function ProfileDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const installPrompt = useAppStore(s => s.installPrompt);
  const setInstallPrompt = useAppStore(s => s.setInstallPrompt);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream);
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
  }, []);

  const handleLogout = async () => {
    onClose();
    await logout();
    router.push("/");
  };

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    try {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      console.log(`User choice outcome: ${outcome}`);
    } catch (err) {
      console.error("Failed to prompt PWA install:", err);
    } finally {
      setInstallPrompt(null);
      onClose();
    }
  };

  if (!user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-xs md:hidden">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0" 
            onClick={onClose} 
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative z-10 w-full bg-card rounded-t-2xl border-t border-border/40 shadow-xl flex flex-col pb-safe"
          >
            {/* Header */}
            <div className="px-5 py-3 flex items-center justify-between border-b border-border/20">
              <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Account Settings</h3>
              <button 
                onClick={onClose}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-secondary"
              >
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>

            {/* Profile Summary */}
            <div className="p-5 flex items-center gap-3">
              <div className="size-10 rounded-full bg-secondary text-foreground font-bold flex items-center justify-center text-sm uppercase">
                {user.displayName?.substring(0, 2) || "U"}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-foreground truncate">
                  {user.displayName || "Personal Archive"}
                </h4>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>

            {/* Options */}
            <div className="px-5 pb-5 space-y-3">
              {installPrompt && (
                <Button 
                  variant="outline" 
                  className="w-full h-10 rounded-xl text-xs font-bold gap-1.5 border border-border bg-secondary/20 hover:bg-secondary/45"
                  onClick={handleInstallClick}
                >
                  <Download className="size-3.5" />
                  Install App
                </Button>
              )}

              {isIOS && !isStandalone && (
                <div className="p-3 rounded-xl bg-secondary/15 border border-border/15 text-[10px] text-muted-foreground leading-normal space-y-1">
                  <div className="font-bold uppercase text-[9px] tracking-wider text-foreground">Install on iOS</div>
                  <p>
                    Tap the share button <span className="font-bold">⎋</span> and select <span className="font-bold">Add to Home Screen</span> <span className="font-bold">➕</span> to run Trackr as a native app.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/20">
                <span className="text-xs font-semibold">Theme</span>
                <ThemeToggle />
              </div>
            </div>

            {/* Actions */}
            <div className="p-5 border-t border-border/20 bg-secondary/10">
              <Button 
                variant="destructive" 
                className="w-full h-10 rounded-xl text-xs font-bold gap-1.5"
                onClick={handleLogout}
              >
                <LogOut className="size-3.5" />
                Sign Out
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
