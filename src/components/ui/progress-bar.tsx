"use client";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
  showLabel?: boolean;
  color?: "blue" | "green" | "purple" | "amber";
  size?: "sm" | "md" | "lg";
}

const COLORS = {
  blue: "from-blue-600 to-cyan-500",
  green: "from-emerald-600 to-green-400",
  purple: "from-purple-600 to-pink-500",
  amber: "from-amber-600 to-orange-400",
};

const SIZES = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

export function ProgressBar({
  value,
  className,
  showLabel = false,
  color = "blue",
  size = "md",
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex-1 bg-zinc-800 rounded-full overflow-hidden",
          SIZES[size]
        )}
      >
        <div
          className={cn(
            "h-full bg-gradient-to-r rounded-full transition-all duration-700 ease-out",
            COLORS[color],
            clamped === 0 && "w-0"
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-zinc-400 w-8 text-right">{clamped}%</span>
      )}
    </div>
  );
}
