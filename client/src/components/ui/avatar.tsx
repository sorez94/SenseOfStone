import { UserRound } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface AvatarProps {
  src?: string | null;
  alt: string;
  /** Size in pixels, applied to both width and height. */
  size?: number;
  className?: string;
}

/** A round user picture, falling back to a generic icon when there's none. */
export function Avatar({ src, alt, size = 40, className }: AvatarProps) {
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-sage-soft text-neutral-500", className)}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt={alt} fill sizes={`${size}px`} className="object-cover" unoptimized={src.startsWith("http")} />
      ) : (
        <UserRound className="size-1/2" aria-hidden />
      )}
    </span>
  );
}
