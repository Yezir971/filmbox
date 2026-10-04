"use client";

import { useToast } from "@/components/ui/use-toast";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (!toasts.length) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex max-h-screen w-full flex-col-reverse gap-2 sm:max-w-[420px]"
    >
      {toasts.map((toast) => {
        const isDestructive = toast.variant === "destructive";
        const isGold = toast.variant === "gold";

        return (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "group pointer-events-auto relative flex w-full items-start justify-between space-x-4 overflow-hidden rounded-xl border p-4 shadow-xl transition-all duration-300 animate-fade-up backdrop-blur-md",
              isDestructive
                ? "border-destructive/60 bg-destructive/15 text-destructive-foreground"
                : isGold
                ? "border-gold-500/60 bg-gold-900/30 text-gold-200"
                : "border-border bg-card/95 text-card-foreground"
            )}
          >
            <div className="flex items-start gap-3">
              {isDestructive ? (
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              ) : isGold ? (
                <CheckCircle className="h-5 w-5 text-gold-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              )}
              <div className="grid gap-1">
                {toast.title && (
                  <div className="text-sm font-semibold leading-tight">
                    {toast.title}
                  </div>
                )}
                {toast.description && (
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    {toast.description}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              aria-label="Fermer la notification"
              className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
