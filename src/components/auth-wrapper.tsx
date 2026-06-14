"use client";

import { useAuth } from "@/components/auth-provider";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Logo } from "@/components/ui/logo";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading, signInWithGoogle, signInWithMock } = useAuth();

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
          className="z-10 flex max-w-md flex-col items-center space-y-6 text-center"
        >
          <Logo className="size-14 text-foreground" />
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Trackr
          </h1>
          <p className="text-sm max-w-sm p-0 m-2">
            A simple app built with &#x2764;&#xFE0F; by <b>Keshav Sharma</b>
          </p>
          <p className="text-xs text-muted-foreground">Don't worry, your data won't be tracked.</p>
            
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <Button 
              size="lg" 
              className="w-full sm:w-auto h-12 px-8 text-base shadow-xl hover:scale-105 transition-transform" 
              onClick={signInWithGoogle}
            >
              Sign in with Google
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="w-full sm:w-auto h-12 px-8 text-base hover:scale-105 transition-transform" 
              onClick={signInWithMock}
            >
              Try Demo Mode
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return <MainLayout>{children}</MainLayout>;
}
