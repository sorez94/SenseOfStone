import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** SOS display heading: large, uppercase, sage-coloured, centred (e.g. "PATTERNS", "COLLECTIONS"). */
export function SectionTitle({
  as: Tag = "h2",
  children,
  subtitle,
  className,
}: {
  as?: "h1" | "h2";
  children: ReactNode;
  subtitle?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 text-center lg:mb-12", className)}>
      <Tag className="font-display text-3xl tracking-wide text-sage-deep uppercase sm:text-4xl lg:text-6xl rtl:tracking-normal">
        {children}
      </Tag>
      {subtitle ? <p className="mx-auto mt-3 max-w-2xl text-sm text-neutral-500 lg:text-base">{subtitle}</p> : null}
    </div>
  );
}

/** SOS form heading: text with a vertical rule on the start side (e.g. "LOGIN", "CONTACT US"). */
export function RuledHeading({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h1 className={cn("mb-8 border-s-2 border-ink px-6 py-5 text-2xl leading-9 text-ink uppercase sm:text-3xl", className)}>{children}</h1>
  );
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10", className)}>{children}</div>;
}
