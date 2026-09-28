"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Square, Settings2, Check, History } from "lucide-react";
import {
  startActivity,
  stopActivity,
  deleteActivityEntry,
  createActivityCategory,
  deleteActivityCategory,
} from "@/lib/actions";
import { ACTIVITY_COLORS, localDayWindow } from "@/lib/activity";
import { useNow } from "@/lib/use-now";
import { cn, formatClock, formatDuration } from "@/lib/utils";
import { ActivityEntryForm } from "@/components/ActivityEntryForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { ActivityCategory, ActivityEntry } from "@/lib/database.types";

type Running = { category_id: string; started_at: string } | null;
type Panel = { kind: "none" } | { kind: "add" } | { kind: "edit"; entry: ActivityEntry } | { kind: "category" };

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function ActivityTracker({
  categories,
  entries,
}: {
  categories: ActivityCategory[];
  entries: ActivityEntry[];
}) {
  const now = useNow(1000);
  const [, startTransition] = useTransition();
  const [pending, startPendingTransition] = useTransition();
  const serverRunning = entries.find((e) => !e.ended_at) ?? null;
  const [running, setRunning] = useOptimistic<Running>(serverRunning);
  const [panel, setPanel] = useState<Panel>({ kind: "none" });
  const [managing, setManaging] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<ActivityCategory | null>(null);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>(
    ACTIVITY_COLORS.find((c) => !categories.some((cat) => cat.color === c)) ?? ACTIVITY_COLORS[0],
  );
  const [error, setError] = useState<string | null>(null);

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const runningCategory = running ? categoryById.get(running.category_id) : undefined;

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  function handleChip(category: ActivityCategory) {
    if (managing) {
      setDeletingCategory(category);
      return;
    }
    if (running?.category_id === category.id) {
      run(async () => {
        setRunning(null);
        await stopActivity();
      });
      return;
    }
    run(async () => {
      setRunning({ category_id: category.id, started_at: new Date().toISOString() });
      await startActivity(category.id);
    });
  }

  function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startPendingTransition(async () => {
      try {
        await createActivityCategory(newName, newColor);
        setNewName("");
        setPanel({ kind: "none" });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  const todayWindow = now ? localDayWindow(0, now) : null;
  const todaysEntries = todayWindow
    ? entries.filter((e) => {
        if (!e.ended_at) return false;
        return (
          new Date(e.ended_at).getTime() > todayWindow.start &&
          new Date(e.started_at).getTime() < todayWindow.end
        );
      })
    : [];

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">What are you doing?</p>
        <Link href="/overview#day" className="text-[11px] font-medium text-accent">
          See your day
        </Link>
      </div>

      {running && runningCategory && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-raised px-3 py-2.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: runningCategory.color }} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{runningCategory.name}</p>
            {now && <p className="text-[11px] text-muted">since {formatTime(running.started_at)}</p>}
          </div>
          {now && (
            <span className="font-mono text-sm tabular-nums">
              {formatClock(Math.max(0, (now - new Date(running.started_at).getTime()) / 1000))}
            </span>
          )}
          <button
            type="button"
            onClick={() => handleChip(runningCategory)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger/15 text-danger transition active:scale-90"
            aria-label={`Stop ${runningCategory.name}`}
          >
            <Square size={12} fill="currentColor" />
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {categories.map((category) => {
          const active = running?.category_id === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => handleChip(category)}
              aria-pressed={active}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition",
                active ? "border-accent bg-accent-soft/40 text-foreground" : "border-border text-muted hover:text-foreground",
                managing && "border-danger/40 text-danger",
              )}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: category.color }} />
              {category.name}
              {managing && <Trash2 size={11} />}
            </button>
          );
        })}
        {!managing && (
          <button
            type="button"
            onClick={() => setPanel(panel.kind === "category" ? { kind: "none" } : { kind: "category" })}
            className="flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted transition hover:border-accent hover:text-accent"
          >
            <Plus size={12} /> New
          </button>
        )}
      </div>

      {categories.length === 0 && (
        <p className="text-[11px] text-muted">Add a category (like Work or Sleep) to start logging.</p>
      )}

      <div className="flex items-center gap-3 text-[11px]">
        <button
          type="button"
          onClick={() => setPanel(panel.kind === "add" ? { kind: "none" } : { kind: "add" })}
          disabled={categories.length === 0}
          className="flex items-center gap-1 font-medium text-muted transition hover:text-foreground disabled:opacity-50"
        >
          <History size={12} /> Add a past entry
        </button>
        {categories.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setManaging((v) => !v);
              setPanel({ kind: "none" });
            }}
            className="ml-auto flex items-center gap-1 font-medium text-muted transition hover:text-foreground"
          >
            {managing ? <Check size={12} /> : <Settings2 size={12} />}
            {managing ? "Done" : "Edit categories"}
          </button>
        )}
      </div>

      {managing && <p className="text-[11px] text-muted">Tap a category to delete it.</p>}

      {panel.kind === "category" && (
        <form onSubmit={handleCreateCategory} className="space-y-2.5 rounded-xl border border-border bg-surface-raised/40 p-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Category name, e.g. Reading"
            maxLength={30}
            autoFocus
            className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <div className="flex gap-2">
            {ACTIVITY_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setNewColor(color)}
                aria-label={`Colour ${color}`}
                aria-pressed={newColor === color}
                className={cn(
                  "h-7 w-7 rounded-full ring-offset-2 ring-offset-surface transition",
                  newColor === color && "ring-2 ring-foreground",
                )}
                style={{ background: color }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending || !newName.trim()}
              className="flex-1 rounded-xl bg-accent-soft/60 py-2 text-xs font-medium text-foreground disabled:opacity-50"
            >
              {pending ? "Adding…" : "Add category"}
            </button>
            <button
              type="button"
              onClick={() => setPanel({ kind: "none" })}
              className="rounded-xl px-3 py-2 text-xs text-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {panel.kind === "add" && (
        <ActivityEntryForm categories={categories} onDone={() => setPanel({ kind: "none" })} />
      )}
      {panel.kind === "edit" && (
        <ActivityEntryForm
          key={panel.entry.id}
          categories={categories}
          entry={panel.entry}
          onDone={() => setPanel({ kind: "none" })}
        />
      )}

      {error && <p className="text-[11px] text-danger">{error}</p>}

      {todaysEntries.length > 0 && (
        <div className="space-y-1 border-t border-border pt-2.5">
          <p className="mb-1.5 text-[11px] font-medium text-muted">Logged today</p>
          {todaysEntries.map((entry) => {
            const category = categoryById.get(entry.category_id);
            const seconds = (new Date(entry.ended_at!).getTime() - new Date(entry.started_at).getTime()) / 1000;
            return (
              <div key={entry.id} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: category?.color }} />
                <span className="min-w-0 flex-1 truncate">{category?.name ?? "Deleted"}</span>
                <span className="shrink-0 text-muted">
                  {formatTime(entry.started_at)} to {formatTime(entry.ended_at!)}
                </span>
                <span className="w-14 shrink-0 text-right text-muted tabular-nums">{formatDuration(seconds)}</span>
                <button
                  type="button"
                  onClick={() => setPanel({ kind: "edit", entry })}
                  className="shrink-0 text-muted hover:text-foreground"
                  aria-label="Edit entry"
                >
                  <Pencil size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => run(() => deleteActivityEntry(entry.id))}
                  className="shrink-0 text-muted hover:text-danger"
                  aria-label="Delete entry"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {deletingCategory && (
        <ConfirmDialog
          title={`Delete "${deletingCategory.name}"?`}
          description="Every entry logged under it will be deleted too."
          pending={pending}
          onCancel={() => setDeletingCategory(null)}
          onConfirm={() =>
            startPendingTransition(async () => {
              try {
                await deleteActivityCategory(deletingCategory.id);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Something went wrong.");
              }
              setDeletingCategory(null);
            })
          }
        />
      )}
    </div>
  );
}
