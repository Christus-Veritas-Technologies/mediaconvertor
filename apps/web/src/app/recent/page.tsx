"use client";

import type { RecentItem } from "@MediaConvertor/conversion";
import { Button } from "@MediaConvertor/ui/components/button";
import { Card } from "@MediaConvertor/ui/components/card";
import { useEffect, useState } from "react";

const RECENT_KEY = "recent_conversions";

function readRecent(): RecentItem[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as RecentItem[];
    if (!Array.isArray(parsed)) {
      window.localStorage.removeItem(RECENT_KEY);
      return [];
    }
    return parsed.sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);
  } catch {
    window.localStorage.removeItem(RECENT_KEY);
    return [];
  }
}

function formatRelative(createdAt: number): string {
  const delta = Date.now() - createdAt;
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function RecentPage() {
  const [items, setItems] = useState<RecentItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setItems(readRecent());
  }, []);

  function handleOpen(item: RecentItem) {
    if (!item.uri) {
      setErrorMessage("File not available");
      return;
    }

    const link = document.createElement("a");
    link.href = item.uri;
    link.download = item.fileName;
    link.rel = "noreferrer";
    document.body.append(link);
    link.click();
    link.remove();
    setErrorMessage(null);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
      <h1 className="text-xl font-semibold">Recent</h1>

      <Card className="rounded-2xl bg-card p-4">
        {items.length === 0 ? (
          <div className="grid min-h-36 place-items-center gap-2 text-center">
            <div className="h-12 w-12 rounded-2xl bg-secondary" />
            <p className="text-sm text-muted-foreground">No recent conversions yet</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="rounded-2xl border border-border p-3">
                <p className="truncate text-sm font-medium text-foreground">{item.fileName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.inputFormat} → {item.outputFormat}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{formatRelative(item.createdAt)}</p>
                <Button className="mt-3 h-9 rounded-xl text-xs" onClick={() => handleOpen(item)}>
                  Open File
                </Button>
              </li>
            ))}
          </ul>
        )}

        {errorMessage ? <p className="mt-3 text-sm text-destructive">{errorMessage}</p> : null}
      </Card>
    </div>
  );
}
