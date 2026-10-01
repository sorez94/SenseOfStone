"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  closeLabel: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * Modal built on the native <dialog> element: focus is trapped by the browser,
 * Escape closes it, and the rest of the page becomes inert.
 */
export function Dialog({ open, onClose, title, description, closeLabel, children, footer, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl bg-white p-0 text-neutral-900 shadow-xl open:animate-fade-in",
        className,
      )}
    >
      {open ? (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-6 py-4">
            <div>
              <h2 id={titleId} className="text-lg text-neutral-900">
                {title}
              </h2>
              {description ? (
                <div id={descriptionId} className="mt-1 text-sm text-neutral-500">
                  {description}
                </div>
              ) : null}
            </div>
            <button type="button" onClick={onClose} aria-label={closeLabel} className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900">
              <X className="size-5" aria-hidden />
            </button>
          </div>
          {children ? <div className="overflow-y-auto px-6 py-5">{children}</div> : null}
          {footer ? <div className="flex flex-wrap justify-end gap-2 border-t border-neutral-100 px-6 py-4">{footer}</div> : null}
        </div>
      ) : null}
    </dialog>
  );
}
