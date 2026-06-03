import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { QuickAdd } from "@/components/quick-add";
import { Plus } from "lucide-react";
import { useAppStore } from "@/store/app-store";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const setQuickAddOpen = useAppStore(s => s.setQuickAddOpen);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto w-full h-full p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Global Mobile FAB */}
      <button
        onClick={() => setQuickAddOpen(true)}
        className="md:hidden fixed bottom-20 right-6 z-50 flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-transform"
        aria-label="Quick Add"
      >
        <Plus className="size-6" />
      </button>

      <MobileNav />
      <QuickAdd />
    </div>
  );
}
