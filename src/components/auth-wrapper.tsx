"use client";

import { useAuth } from "@/components/auth-provider";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Logo } from "@/components/ui/logo";

import { useEffect } from "react";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading, isResolvingRedirect, signInWithGoogle, signInWithGoogleRedirect, authError, clearAuthError } = useAuth();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[AuthWrapper] State transition tracked:", {
        loading,
        isResolvingRedirect,
        isAuthenticated: !!user,
        hasError: !!authError,
      });
    }
  }, [loading, isResolvingRedirect, user, authError]);

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="z-10 flex flex-col items-center space-y-4"
        >
          <Logo className="size-16 text-foreground animate-pulse" />
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-bold tracking-wider text-foreground">
              Trackr
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Personal Archive
            </p>
          </div>
          
          <div className="pt-4 flex flex-col items-center gap-2">
            <Loader2 className="size-5 animate-spin text-primary/50" />
            <span className="text-[10px] text-muted-foreground font-medium animate-pulse">
              {isResolvingRedirect ? "Completing authentication..." : "Initializing session..."}
            </span>
          </div>
        </motion.div>
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
          <p className="text-xs text-muted-foreground">Don&apos;t worry, your data won&apos;t be tracked.</p>
            
          <div className="flex w-full flex-col items-center space-y-3">
            <Button 
              size="lg" 
              className="w-full max-w-xs h-12 text-base shadow-xl hover:scale-105 transition-transform animate-shimmer" 
              onClick={signInWithGoogle}
            >
              Sign in with Google
            </Button>
            
            <button
              onClick={signInWithGoogleRedirect}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 cursor-pointer"
            >
              Sign in with Redirect (Fallback)
            </button>
          </div>

          {authError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-xs max-w-xs w-full text-center px-4 py-3 rounded-lg border leading-relaxed flex flex-col items-center gap-2 ${
                authError.includes("Redirecting") || authError.includes("Popup blocked")
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-destructive/10 text-destructive border-destructive/20"
              }`}
            >
              <span>{authError}</span>
              {!authError.includes("Redirecting") && (
                <button
                  onClick={clearAuthError}
                  className="text-[10px] underline underline-offset-2 opacity-80 hover:opacity-100 cursor-pointer"
                >
                  Dismiss
                </button>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  return <MainLayout>{children}</MainLayout>;
}
