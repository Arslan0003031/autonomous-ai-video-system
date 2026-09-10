export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/db";
import { projects, agentRuns, costTracking } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { formatCost } from "@/lib/utils";

async function getDashboardData() {
  const [allProjects, totalCostRows] = await Promise.all([
    db
      .select({
        id: projects.id,
        title: projects.title,
        status: projects.status,
        progress: projects.progress,
        totalCostUsd: projects.totalCostUsd,
        createdAt: projects.createdAt,
        youtubeUrl: projects.youtubeUrl,
        errorMessage: projects.errorMessage,
      })
      .from(projects)
      .orderBy(desc(projects.createdAt))
      .limit(20),
    db.select({ total: sql<number>`coalesce(sum(cost_usd), 0)` }).from(costTracking),
  ]);

  const published = allProjects.filter((p) => p.status === "PUBLISHED").length;
  const failed = allProjects.filter((p) => p.status === "FAILED").length;
  const running = allProjects.filter(
    (p) =>
      p.status !== "PUBLISHED" && p.status !== "FAILED" && p.status !== "PENDING"
  ).length;

  return {
    projects: allProjects,
    stats: {
      total: allProjects.length,
      published,
      running,
      failed,
      totalCost: totalCostRows[0]?.total ?? 0,
    },
  };
}

const STATUS_BADGE_MAP: Record<
  string,
  "default" | "success" | "warning" | "error" | "info" | "purple" | "ghost"
> = {
  PUBLISHED: "success",
  FAILED: "error",
  PENDING: "ghost",
  AWAITING_APPROVAL: "warning",
  RENDERING_IN_PROGRESS: "purple",
  RENDERING_COMPLETE: "purple",
  PUBLISHING_IN_PROGRESS: "info",
};

function getStatusBadge(status: string) {
  for (const key of Object.keys(STATUS_BADGE_MAP)) {
    if (status === key) return STATUS_BADGE_MAP[key];
  }
  if (status.includes("PROGRESS") || status.includes("RESEARCHING"))
    return "info";
  if (status.includes("COMPLETE")) return "purple";
  return "ghost";
}

export default async function DashboardPage() {
  const { projects: projectList, stats } = await getDashboardData();

  return (
    <div className="p-8">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden mb-8 h-48">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/70 to-transparent" />
        <div className="relative z-10 p-8 h-full flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">
              Multi-Agent AI System
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">
            AI Creator Studio
          </h1>
          <p className="text-zinc-400 text-sm">
            Autonomous video production pipeline · From prompt to YouTube in minutes
          </p>
        </div>
        <div className="absolute top-4 right-6 z-10">
          <Link
            href="/create"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-900/40"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Video
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total Projects",
            value: stats.total,
            icon: "📁",
            sub: "all time",
            color: "text-blue-400",
          },
          {
            label: "Published",
            value: stats.published,
            icon: "🚀",
            sub: "live on YouTube",
            color: "text-emerald-400",
          },
          {
            label: "In Progress",
            value: stats.running,
            icon: "⚡",
            sub: "pipeline running",
            color: "text-amber-400",
          },
          {
            label: "Total API Cost",
            value: formatCost(stats.totalCost),
            icon: "💰",
            sub: "across all projects",
            color: "text-purple-400",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
          >
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-sm text-zinc-100 font-medium mt-0.5">{stat.label}</div>
            <div className="text-xs text-zinc-500 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Projects Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-100">
            Recent Projects
          </h2>
          <Link
            href="/projects"
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            View all →
          </Link>
        </div>

        {projectList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-4">🎬</div>
            <p className="text-zinc-400 text-sm mb-4">No projects yet</p>
            <Link
              href="/create"
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              Create your first video
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {projectList.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-800/50 transition-colors group"
              >
                {/* Title & status */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-zinc-100 truncate group-hover:text-white">
                      {project.title}
                    </span>
                    {project.youtubeUrl && (
                      <svg viewBox="0 0 24 24" fill="#ef4444" className="w-4 h-4 flex-shrink-0">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-2.75 12.64 12.64 0 0 0-8.45 0A4.83 4.83 0 0 1 3.6 6.69 49.36 49.36 0 0 0 3 12a49.36 49.36 0 0 0 .6 5.31 4.83 4.83 0 0 1 3.77 2.75 12.64 12.64 0 0 0 8.45 0 4.83 4.83 0 0 1 3.77-2.75A49.36 49.36 0 0 0 21 12a49.36 49.36 0 0 0-.41-5.31zM9.75 15.02V8.98L15.5 12z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusBadge(project.status)}>
                      {project.status.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-xs text-zinc-600">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Progress */}
                <div className="w-36">
                  <ProgressBar
                    value={project.progress}
                    size="sm"
                    color={
                      project.status === "FAILED"
                        ? "amber"
                        : project.status === "PUBLISHED"
                        ? "green"
                        : "blue"
                    }
                  />
                  <div className="text-xs text-zinc-600 mt-1 text-right">
                    {project.progress}%
                  </div>
                </div>

                {/* Cost */}
                <div className="text-xs text-zinc-500 w-16 text-right">
                  {formatCost(project.totalCostUsd)}
                </div>

                {/* Arrow */}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 flex-shrink-0 transition-colors"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
