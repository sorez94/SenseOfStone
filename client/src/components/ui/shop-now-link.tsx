import { ArrowRight } from "lucide-react";
import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";

/**
 * SOS "Shop Now" link: text with an underline that grows and turns green on hover
 * while an arrow slides in. Arrow direction follows the reading direction.
 */
export function ShopNowLink({ href, children, className }: { href: ComponentProps<typeof Link>["href"]; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex flex-col font-medium text-neutral-900 hover:text-leaf-dark", className)}>
      <span className="flex items-center gap-1 text-base sm:text-lg lg:text-xl">
        {children}
        <ArrowRight
          aria-hidden
          className="size-5 -translate-x-2 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 rtl:translate-x-2 rtl:rotate-180"
        />
      </span>
      <span
        aria-hidden
        className="mt-1 block h-[2px] w-[80%] bg-neutral-900 transition-all duration-500 group-hover:w-full group-hover:bg-leaf-dark lg:h-[3px]"
      />
    </Link>
  );
}
