"use client";

import { useAuth } from "@/components/auth-provider";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading, signInWithGoogle } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary/50" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="z-10 flex max-w-md flex-col items-center space-y-8 text-center"
        >
          <div className="space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary shadow-2xl">
              <span className="text-4xl font-bold text-primary-foreground">T</span>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground">
              Trackr
            </h1>
            <p className="text-lg text-muted-foreground">
              A personal memory, experience, and consumption tracking system.
            </p>
          </div>

          <Button 
            size="lg" 
            className="w-full sm:w-auto h-12 px-8 text-base shadow-xl hover:scale-105 transition-transform" 
            onClick={signInWithGoogle}
          >
            Sign in with Google
          </Button>

          <p className="text-xs text-muted-foreground max-w-xs mt-8">
            Your data is private, secure, and encrypted. Designed for personal use.
          </p>
        </motion.div>
      </div>
    );
  }

  return <MainLayout>{children}</MainLayout>;
}
