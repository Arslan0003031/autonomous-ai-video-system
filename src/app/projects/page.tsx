import { db } from "@/db";
import { projects, costTracking, agentRuns } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { formatCost } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getProjects() {
  return db
    .select({
      id: projects.id,
      title: projects.title,
      prompt: projects.prompt,
      status: projects.status,
      progress: projects.progress,
      totalCostUsd: projects.totalCostUsd,
      createdAt: projects.createdAt,
      completedAt: projects.completedAt,
      youtubeUrl: projects.youtubeUrl,
      errorMessage: projects.errorMessage,
      youtubeVisibility: projects.youtubeVisibility,
    })
    .from(projects)
    .orderBy(desc(projects.createdAt));
}

const STATUS_BADGE_MAP: Record<string, "default" | "success" | "warning" | "error" | "info" | "purple" | "ghost"> = {
  PUBLISHED: "success",
  FAILED: "error",
  PENDING: "ghost",
  AWAITING_APPROVAL: "warning",
};

function getStatusBadge(status: string) {
  if (STATUS_BADGE_MAP[status]) return STATUS_BADGE_MAP[status];
  if (status.includes("PROGRESS") || status === "RESEARCHING") return "info";
  if (status.includes("COMPLETE")) return "purple";
  return "ghost";
}

export default async function ProjectsPage() {
  const projectList = await getProjects();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">All Projects</h1>
          <p className="text-zinc-500 text-sm mt-1">{projectList.length} total projects</p>
        </div>
        <Link
          href="/create"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          + New Video
        </Link>
      </div>

      {projectList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-6xl mb-4">🎬</div>
          <h2 className="text-xl font-semibold text-zinc-300 mb-2">No projects yet</h2>
          <p className="text-zinc-500 mb-6">Start by creating your first AI-generated video</p>
          <Link
            href="/create"
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-xl transition-colors"
          >
            Create First Video
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {projectList.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-black/30"
            >
              {/* Status row */}
              <div className="flex items-center justify-between mb-3">
                <Badge variant={getStatusBadge(project.status)}>
                  {project.status !== "PUBLISHED" &&
                    project.status !== "FAILED" &&
                    project.status !== "PENDING" && (
                      <span className="inline-block w-1.5 h-1.5 bg-current rounded-full animate-pulse mr-1" />
                    )}
                  {project.status.replace(/_/g, " ")}
                </Badge>
                <span className="text-xs text-zinc-600 capitalize">
                  {project.youtubeVisibility}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white mb-2 line-clamp-2">
                {project.title}
              </h3>
              <p className="text-xs text-zinc-500 line-clamp-2 mb-4">{project.prompt}</p>

              {/* Progress */}
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

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 text-xs text-zinc-600">
                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                <span className={project.totalCostUsd > 0 ? "text-emerald-500" : ""}>
                  {formatCost(project.totalCostUsd)}
                </span>
              </div>

              {/* YouTube link */}
              {project.youtubeUrl && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-red-400">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-2.75 12.64 12.64 0 0 0-8.45 0A4.83 4.83 0 0 1 3.6 6.69 49.36 49.36 0 0 0 3 12a49.36 49.36 0 0 0 .6 5.31 4.83 4.83 0 0 1 3.77 2.75 12.64 12.64 0 0 0 8.45 0 4.83 4.83 0 0 1 3.77-2.75A49.36 49.36 0 0 0 21 12a49.36 49.36 0 0 0-.41-5.31zM9.75 15.02V8.98L15.5 12z" />
                  </svg>
                  Published on YouTube
                </div>
              )}

              {project.errorMessage && (
                <div className="mt-2 text-xs text-red-400 truncate">
                  ⚠ {project.errorMessage}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
