"use client";

import type { ReactNode } from "react";
import { Button } from "./button";
import { Dialog } from "./dialog";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  closeLabel: string;
  loading?: boolean;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  closeLabel,
  loading,
  tone = "danger",
  onConfirm,
  onClose,
  children,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={loading ? () => undefined : onClose}
      title={title}
      description={description}
      closeLabel={closeLabel}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
