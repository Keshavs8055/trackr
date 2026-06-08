import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { QuickAdd } from "@/components/quick-add";
import { Plus } from "lucide-react";
import { useAppStore } from "@/store/app-store";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto w-full h-full p-4 md:p-8">
          {children}
        </div>
      </main>

      <MobileNav />
      <QuickAdd />
    </div>
  );
}
