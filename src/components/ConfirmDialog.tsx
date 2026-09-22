"use client";

import { cn } from "@/lib/utils";

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Delete",
  danger = true,
  pending = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onCancel}
        className="absolute inset-0"
        aria-label="Cancel"
      />
      <div className="relative z-10 w-full max-w-xs rounded-2xl border border-border bg-surface p-4 shadow-2xl">
        <p className="text-sm font-semibold">{title}</p>
        {description && <p className="mt-1.5 text-xs text-muted">{description}</p>}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border py-2 text-xs font-medium text-muted transition hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={cn(
              "flex-1 rounded-xl py-2 text-xs font-semibold text-white transition disabled:opacity-50",
              danger ? "bg-danger" : "bg-accent-strong",
            )}
          >
            {pending ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
