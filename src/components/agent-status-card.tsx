"use client";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import type { AgentRun } from "@/db/schema";

const AGENT_META: Record<
  string,
  { label: string; icon: string; description: string }
> = {
  research_scripting: {
    label: "Research & Script",
    icon: "📝",
    description: "Web research + GPT-4o script generation",
  },
  voiceover: {
    label: "Voiceover",
    icon: "🎙️",
    description: "ElevenLabs TTS with word timestamps",
  },
  visual_assets: {
    label: "Visual Assets",
    icon: "🖼️",
    description: "DALL-E 3 / Pexels stock footage",
  },
  music: {
    label: "Music & SFX",
    icon: "🎵",
    description: "Mood-matched background track",
  },
  thumbnail_seo: {
    label: "Thumbnail & SEO",
    icon: "🎯",
    description: "YouTube title, tags, thumbnail",
  },
  rendering: {
    label: "Rendering",
    icon: "🎬",
    description: "FFmpeg assembly + subtitle burn-in",
  },
  publishing: {
    label: "Publishing",
    icon: "🚀",
    description: "YouTube Data API v3 upload",
  },
};

const STATUS_STYLES: Record<string, string> = {
  IDLE: "text-zinc-500",
  RUNNING: "text-blue-400",
  COMPLETE: "text-emerald-400",
  FAILED: "text-red-400",
  SKIPPED: "text-zinc-500",
  AWAITING_APPROVAL: "text-amber-400",
};

const STATUS_BADGES: Record<
  string,
  "default" | "success" | "warning" | "error" | "info" | "purple" | "ghost"
> = {
  IDLE: "ghost",
  RUNNING: "info",
  COMPLETE: "success",
  FAILED: "error",
  SKIPPED: "ghost",
  AWAITING_APPROVAL: "warning",
};

interface AgentStatusCardProps {
  agent: AgentRun;
  isParallel?: boolean;
}

export function AgentStatusCard({ agent, isParallel }: AgentStatusCardProps) {
  const meta = AGENT_META[agent.agentName] ?? {
    label: agent.agentName,
    icon: "🤖",
    description: "",
  };

  const isRunning = agent.status === "RUNNING";
  const durationMs = agent.durationMs ?? 0;
  const durationStr =
    durationMs > 0
      ? durationMs < 1000
        ? `${durationMs}ms`
        : `${(durationMs / 1000).toFixed(1)}s`
      : null;

  return (
    <div
      className={cn(
        "relative bg-zinc-900 border rounded-2xl p-4 transition-all duration-300",
        isRunning
          ? "border-blue-500/50 shadow-lg shadow-blue-900/20"
          : agent.status === "COMPLETE"
          ? "border-emerald-500/20"
          : agent.status === "FAILED"
          ? "border-red-500/30"
          : "border-zinc-800"
      )}
    >
      {/* Running pulse */}
      {isRunning && (
        <div className="absolute inset-0 rounded-2xl bg-blue-500/5 animate-pulse pointer-events-none" />
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0",
              isRunning ? "bg-blue-500/20" : "bg-zinc-800"
            )}
          >
            {isRunning ? (
              <div className="w-4 h-4 border-2 border-zinc-700 border-t-blue-400 rounded-full animate-spin" />
            ) : (
              meta.icon
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-zinc-100">{meta.label}</p>
              {isParallel && (
                <span className="text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded-full">
                  ∥ parallel
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">{meta.description}</p>
          </div>
        </div>

        <Badge variant={STATUS_BADGES[agent.status] ?? "ghost"}>
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full inline-block",
              agent.status === "RUNNING" && "bg-blue-400 animate-pulse",
              agent.status === "COMPLETE" && "bg-emerald-400",
              agent.status === "FAILED" && "bg-red-400",
              agent.status === "IDLE" && "bg-zinc-600",
              agent.status === "AWAITING_APPROVAL" && "bg-amber-400"
            )}
          />
          {agent.status}
        </Badge>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
        {agent.costUsd > 0 && (
          <span className="flex items-center gap-1">
            <span className="text-zinc-600">$</span>
            <span className="text-zinc-400">{agent.costUsd.toFixed(4)}</span>
          </span>
        )}
        {durationStr && (
          <span className="flex items-center gap-1">
            <span className="text-zinc-600">⏱</span>
            <span className="text-zinc-400">{durationStr}</span>
          </span>
        )}
        {agent.retryCount > 0 && (
          <span className="text-amber-500">↺ {agent.retryCount} retries</span>
        )}
        {agent.status === "FAILED" && agent.errorMessage && (
          <span className="text-red-400 truncate max-w-[200px]" title={agent.errorMessage}>
            ⚠ {agent.errorMessage}
          </span>
        )}
      </div>
    </div>
  );
}
