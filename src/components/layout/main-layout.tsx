import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { QuickAdd } from "@/components/quick-add";
import { Plus } from "lucide-react";
import { useAppStore } from "@/store/app-store";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[200] px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg shadow-lg"
      >
        Skip to main content
      </a>
      <Sidebar />
      <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto pb-20 md:pb-0 outline-none">
        <div className="max-w-5xl mx-auto w-full h-full p-4 md:p-8">
          {children}
        </div>
      </main>

      <MobileNav />
      <QuickAdd />
    </div>
  );
}
