"use client";

import type { ConversionRecentItem } from "@MediaConvertor/conversion";
import { Card } from "@MediaConvertor/ui/components/card";
import { useEffect, useState } from "react";

const RECENT_KEY = "mc_recent_items";

function readRecent(): ConversionRecentItem[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as ConversionRecentItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function RecentPage() {
  const [items, setItems] = useState<ConversionRecentItem[]>([]);

  useEffect(() => {
    setItems(readRecent());
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-4">
      <h1 className="text-xl font-semibold">Recent Conversions</h1>

      <Card className="rounded-2xl bg-card p-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No conversions yet.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="rounded-xl border border-border p-2 text-sm">
                <p className="font-medium">{item.inputName}</p>
                <p className="text-muted-foreground">
                  {item.outputFormat.toUpperCase()} · {item.quality}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
