import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type BadgeTone = "neutral" | "sage" | "green" | "amber" | "red" | "blue" | "dark";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-neutral-100 text-neutral-700",
  sage: "bg-sage-soft text-neutral-800",
  green: "bg-green-100 text-green-800",
  amber: "bg-amber-100 text-amber-900",
  red: "bg-red-100 text-red-800",
  blue: "bg-blue-100 text-blue-800",
  dark: "bg-neutral-900/80 text-white",
};

export function Badge({ tone = "neutral", className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", tones[tone], className)}>
      {children}
    </span>
  );
}
