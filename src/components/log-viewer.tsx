"use client";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { ProjectLog } from "@/db/schema";

const LEVEL_STYLES: Record<string, string> = {
  INFO: "text-zinc-400",
  WARN: "text-amber-400",
  ERROR: "text-red-400",
  SUCCESS: "text-emerald-400",
  DEBUG: "text-zinc-600",
};

const LEVEL_PREFIX: Record<string, string> = {
  INFO: "ℹ",
  WARN: "⚠",
  ERROR: "✗",
  SUCCESS: "✓",
  DEBUG: "·",
};

interface LogViewerProps {
  logs: ProjectLog[];
  autoScroll?: boolean;
  maxHeight?: string;
}

export function LogViewer({ logs, autoScroll = true, maxHeight = "320px" }: LogViewerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-zinc-600 text-sm">
        No logs yet...
      </div>
    );
  }

  return (
    <div
      className="font-mono text-xs bg-zinc-950 rounded-xl border border-zinc-800 overflow-y-auto p-3 space-y-0.5"
      style={{ maxHeight }}
    >
      {logs.map((log) => (
        <div key={log.id} className="flex items-start gap-2 leading-5">
          <span className="text-zinc-700 flex-shrink-0 select-none">
            {new Date(log.createdAt).toISOString().slice(11, 19)}
          </span>
          <span
            className={cn(
              "flex-shrink-0 w-4 text-center",
              LEVEL_STYLES[log.level]
            )}
          >
            {LEVEL_PREFIX[log.level] ?? "·"}
          </span>
          {log.agentName && (
            <span className="text-purple-400/60 flex-shrink-0">
              [{log.agentName}]
            </span>
          )}
          <span className={cn(LEVEL_STYLES[log.level], "break-all")}>
            {log.message}
          </span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
