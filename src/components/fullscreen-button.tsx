"use client";

import { Maximize2 } from "lucide-react";

import { cn } from "@/lib/ui";

export function FullscreenButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/[0.04] px-4 text-sm font-semibold text-[#f4f1eb] transition hover:bg-white/[0.08]",
        className,
      )}
      onClick={() => {
        const element = document.documentElement;

        if (!document.fullscreenElement) {
          void element.requestFullscreen();
          return;
        }

        void document.exitFullscreen();
      }}
    >
      <Maximize2 className="h-4 w-4" />
      Fullscreen
    </button>
  );
}
