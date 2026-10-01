"use client";

import { ChevronLeft, ChevronRight, ImageOff, Maximize2, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { sortImages, type ProductImage } from "@/domain";
import { useLocalize } from "@/hooks/use-localize";
import { cn } from "@/lib/utils/cn";

const SWIPE_THRESHOLD = 50;

const isRtl = () => document.documentElement.dir === "rtl";

/** Arrow-key and swipe navigation, mirrored in RTL. `swiped` lets click handlers ignore the click that ends a swipe. */
function useNavigation(go: (delta: number) => void) {
  const startX = useRef<number | null>(null);
  const swiped = useRef(false);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") go(isRtl() ? -1 : 1);
    if (event.key === "ArrowLeft") go(isRtl() ? 1 : -1);
  };
  const onPointerDown = (event: PointerEvent) => {
    startX.current = event.clientX;
    swiped.current = false;
  };
  const onPointerUp = (event: PointerEvent) => {
    if (startX.current === null) return;
    const dx = event.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    swiped.current = true;
    // Swiping toward the start edge reveals the next image.
    go((dx < 0) !== isRtl() ? 1 : -1);
  };

  return { onKeyDown, onPointerDown, onPointerUp, swiped };
}

const navButton =
  "absolute top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full transition focus-visible:opacity-100";

/**
 * Product images shown uncropped (object-contain) in a 3:2 stage with thumbnails.
 * Clicking the stage opens a full-screen viewer.
 */
export function ProductGallery({ images, title }: { images: ProductImage[]; title: string }) {
  const t = useTranslations("product");
  const tCommon = useTranslations("common");
  const text = useLocalize();
  const sorted = sortImages(images);
  const [index, setIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const total = sorted.length;
  const go = (delta: number) => setIndex((i) => (i + delta + total) % total);
  const nav = useNavigation(go);
  const current = sorted[index];

  if (!current) {
    return (
      <div className="flex aspect-[3/2] items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
        <ImageOff className="size-12" aria-hidden />
        <span className="sr-only">{t("noImage")}</span>
      </div>
    );
  }

  const altOf = (image: ProductImage) => text(image.alt) || title;

  return (
    <section aria-roledescription="carousel" aria-label={t("gallery")} onKeyDown={nav.onKeyDown} className="flex flex-col gap-3">
      <div className="group relative aspect-[3/2] touch-pan-y overflow-hidden rounded-2xl bg-neutral-100 shadow-md">
        <button
          type="button"
          onPointerDown={nav.onPointerDown}
          onPointerUp={nav.onPointerUp}
          onClick={() => {
            if (!nav.swiped.current) setViewerOpen(true);
          }}
          aria-label={t("enlargeImage")}
          className="absolute inset-0 cursor-zoom-in"
        >
          <Image
            key={current.id}
            src={current.url}
            alt={altOf(current)}
            fill
            priority
            sizes="(min-width: 1024px) 58vw, (min-width: 768px) 50vw, 100vw"
            className="animate-fade-in object-contain"
            draggable={false}
          />
        </button>
        <span
          aria-hidden
          className="pointer-events-none absolute end-3 top-3 flex size-9 items-center justify-center rounded-full bg-white/80 text-neutral-800 shadow-sm backdrop-blur transition md:opacity-0 md:group-hover:opacity-100"
        >
          <Maximize2 className="size-4" />
        </span>
        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={tCommon("previous")}
              className={cn(navButton, "start-3 bg-white/80 text-neutral-800 shadow-sm backdrop-blur hover:bg-white md:opacity-0 md:group-hover:opacity-100")}
            >
              <ChevronLeft className="size-5 rtl:rotate-180" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={tCommon("next")}
              className={cn(navButton, "end-3 bg-white/80 text-neutral-800 shadow-sm backdrop-blur hover:bg-white md:opacity-0 md:group-hover:opacity-100")}
            >
              <ChevronRight className="size-5 rtl:rotate-180" aria-hidden />
            </button>
            <p className="pointer-events-none absolute bottom-3 start-3 rounded-full bg-neutral-900/60 px-2.5 py-0.5 text-xs text-white" aria-live="polite">
              {t("imageOf", { index: index + 1, total })}
            </p>
          </>
        ) : null}
      </div>
      {total > 1 ? (
        <Thumbnails images={sorted} index={index} onSelect={setIndex} label={(i) => t("showImage", { index: i + 1 })} />
      ) : null}
      <ImageViewer
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        images={sorted}
        index={index}
        onSelect={setIndex}
        altOf={altOf}
      />
    </section>
  );
}

function Thumbnails({
  images,
  index,
  onSelect,
  label,
  dark = false,
}: {
  images: ProductImage[];
  index: number;
  onSelect: (index: number) => void;
  label: (index: number) => string;
  dark?: boolean;
}) {
  return (
    <ul className={cn("no-scrollbar flex gap-3 overflow-x-auto", dark && "justify-center")}>
      {images.map((image, i) => (
        <li key={image.id} className="shrink-0">
          <button
            type="button"
            onClick={() => onSelect(i)}
            aria-label={label(i)}
            aria-current={i === index ? "true" : undefined}
            className={cn(
              "relative block aspect-[3/2] w-24 overflow-hidden rounded-lg border-2 transition sm:w-28",
              dark ? "bg-neutral-800" : "bg-neutral-100",
              i === index
                ? dark
                  ? "border-white"
                  : "border-neutral-900"
                : "border-transparent opacity-60 hover:opacity-100",
            )}
          >
            <Image src={image.url} alt="" fill sizes="112px" className="object-cover" />
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Full-screen image viewer on a native modal <dialog>: Escape closes, focus stays inside. */
function ImageViewer({
  open,
  onClose,
  images,
  index,
  onSelect,
  altOf,
}: {
  open: boolean;
  onClose: () => void;
  images: ProductImage[];
  index: number;
  onSelect: (index: number) => void;
  altOf: (image: ProductImage) => string;
}) {
  const t = useTranslations("product");
  const tCommon = useTranslations("common");
  const ref = useRef<HTMLDialogElement>(null);
  const total = images.length;
  const nav = useNavigation((delta) => onSelect((index + delta + total) % total));
  const current = images[index];

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={t("gallery")}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        // Keep the gallery behind the viewer from also handling the arrows.
        event.stopPropagation();
        nav.onKeyDown(event);
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-neutral-950/95 p-0 text-white open:animate-fade-in"
    >
      {open && current ? (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <p className="text-sm text-white/80" aria-live="polite">
              {total > 1 ? t("imageOf", { index: index + 1, total }) : null}
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label={tCommon("close")}
              className="flex size-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <div
            className="relative min-h-0 flex-1 touch-pan-y px-4 sm:px-16"
            onPointerDown={nav.onPointerDown}
            onPointerUp={nav.onPointerUp}
          >
            <div className="relative size-full">
              <Image
                key={current.id}
                src={current.url}
                alt={altOf(current)}
                fill
                sizes="100vw"
                quality={90}
                className="animate-fade-in object-contain"
                draggable={false}
              />
            </div>
            {total > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => onSelect((index - 1 + total) % total)}
                  aria-label={tCommon("previous")}
                  className={cn(navButton, "start-2 bg-white/10 hover:bg-white/20 sm:start-4")}
                >
                  <ChevronLeft className="size-6 rtl:rotate-180" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => onSelect((index + 1) % total)}
                  aria-label={tCommon("next")}
                  className={cn(navButton, "end-2 bg-white/10 hover:bg-white/20 sm:end-4")}
                >
                  <ChevronRight className="size-6 rtl:rotate-180" aria-hidden />
                </button>
              </>
            ) : null}
          </div>

          <div className="px-4 py-4 sm:px-6">
            {total > 1 ? (
              <Thumbnails images={images} index={index} onSelect={onSelect} label={(i) => t("showImage", { index: i + 1 })} dark />
            ) : null}
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
