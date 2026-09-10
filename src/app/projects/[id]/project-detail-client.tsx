"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { AgentStatusCard } from "@/components/agent-status-card";
import { LogViewer } from "@/components/log-viewer";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { formatCost } from "@/lib/utils";
import type { Project, AgentRun, ProjectLog, ScriptScene, SeoMetadata, CostTracking } from "@/db/schema";

interface ProjectData {
  project: Project;
  agents: AgentRun[];
  logs: ProjectLog[];
  scenes: ScriptScene[];
  seo: SeoMetadata | null;
  costs: CostTracking[];
}

interface StreamUpdate {
  project: Project;
  agents: AgentRun[];
  newLogs: ProjectLog[];
}

const PARALLEL_AGENTS = new Set(["voiceover", "visual_assets", "music", "thumbnail_seo"]);

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

const AGENT_ORDER = [
  "research_scripting",
  "voiceover",
  "visual_assets",
  "music",
  "thumbnail_seo",
  "rendering",
  "publishing",
];

function sortAgents(agents: AgentRun[]): AgentRun[] {
  return [...agents].sort(
    (a, b) =>
      (AGENT_ORDER.indexOf(a.agentName) ?? 99) -
      (AGENT_ORDER.indexOf(b.agentName) ?? 99)
  );
}

export function ProjectDetailClient({
  initialData,
  projectId,
}: {
  initialData: ProjectData;
  projectId: string;
}) {
  const [project, setProject] = useState<Project>(initialData.project);
  const [agents, setAgents] = useState<AgentRun[]>(initialData.agents);
  const [logs, setLogs] = useState<ProjectLog[]>(initialData.logs);
  const [scenes] = useState<ScriptScene[]>(initialData.scenes);
  const [seo] = useState<SeoMetadata | null>(initialData.seo);
  const [costs, setCosts] = useState<CostTracking[]>(initialData.costs);
  const [activeTab, setActiveTab] = useState<"pipeline" | "script" | "seo" | "costs" | "logs">("pipeline");
  const [approving, setApproving] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const streamRef = useRef<EventSource | null>(null);

  const isTerminated =
    project.status === "PUBLISHED" || project.status === "FAILED";

  const connectStream = useCallback(() => {
    if (streamRef.current) streamRef.current.close();
    const es = new EventSource(`/api/projects/${projectId}/stream`);
    streamRef.current = es;

    es.addEventListener("update", (e) => {
      try {
        const data: StreamUpdate = JSON.parse(e.data);
        setProject(data.project);
        setAgents(data.agents);
        if (data.newLogs.length > 0) {
          setLogs((prev) => [...prev, ...data.newLogs]);
        }
      } catch {
        // ignore parse errors
      }
    });

    es.addEventListener("error", () => {
      // Reconnect after 3s if not terminated
      setTimeout(() => {
        if (!isTerminated) connectStream();
      }, 3000);
    });
  }, [projectId, isTerminated]);

  useEffect(() => {
    if (!isTerminated) {
      connectStream();
    }
    return () => {
      streamRef.current?.close();
    };
  }, [connectStream, isTerminated]);

  const handleApprove = async () => {
    setApproving(true);
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    setApproving(false);
    connectStream();
  };

  const handleRetry = async () => {
    setRetrying(true);
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "retry" }),
    });
    setRetrying(false);
    connectStream();
  };

  const sortedAgents = sortAgents(agents);
  const totalCost = costs.reduce((sum, c) => sum + c.costUsd, 0);

  return (
    <div className="min-h-screen p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
        <Link href="/" className="hover:text-zinc-300">Dashboard</Link>
        <span>/</span>
        <Link href="/projects" className="hover:text-zinc-300">Projects</Link>
        <span>/</span>
        <span className="text-zinc-300 font-medium truncate max-w-xs">{project.title}</span>
      </div>

      {/* Project Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <Badge variant={getStatusBadge(project.status)}>
                {!isTerminated && project.status !== "PENDING" && project.status !== "AWAITING_APPROVAL" && (
                  <span className="inline-block w-1.5 h-1.5 bg-current rounded-full animate-pulse mr-1" />
                )}
                {project.status.replace(/_/g, " ")}
              </Badge>
              {project.youtubeUrl && (
                <a
                  href={project.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-1 rounded-full hover:bg-red-500/20 transition-colors flex items-center gap-1"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-2.75 12.64 12.64 0 0 0-8.45 0A4.83 4.83 0 0 1 3.6 6.69 49.36 49.36 0 0 0 3 12a49.36 49.36 0 0 0 .6 5.31 4.83 4.83 0 0 1 3.77 2.75 12.64 12.64 0 0 0 8.45 0 4.83 4.83 0 0 1 3.77-2.75A49.36 49.36 0 0 0 21 12a49.36 49.36 0 0 0-.41-5.31zM9.75 15.02V8.98L15.5 12z" />
                  </svg>
                  View on YouTube
                </a>
              )}
              <span className="text-xs text-zinc-600">
                {formatCost(totalCost)} total cost
              </span>
              <span className="text-xs text-zinc-600">
                {new Date(project.createdAt).toLocaleString()}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mb-1 truncate">{project.title}</h1>
            <p className="text-sm text-zinc-500 line-clamp-2">{project.prompt}</p>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            {project.status === "AWAITING_APPROVAL" && (
              <button
                onClick={handleApprove}
                disabled={approving}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
              >
                {approving ? <Spinner size="sm" /> : "✓"}
                Approve & Continue
              </button>
            )}
            {project.status === "FAILED" && (
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
              >
                {retrying ? <Spinner size="sm" /> : "↺"}
                Retry Pipeline
              </button>
            )}
            <Link
              href="/create"
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium px-4 py-2 rounded-xl text-sm transition-colors"
            >
              + New Video
            </Link>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
            <span>Pipeline Progress</span>
            <span className="font-medium text-zinc-300">{project.progress}%</span>
          </div>
          <ProgressBar
            value={project.progress}
            size="lg"
            color={project.status === "FAILED" ? "amber" : project.status === "PUBLISHED" ? "green" : "blue"}
            showLabel={false}
          />
        </div>

        {project.status === "FAILED" && project.errorMessage && (
          <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
            ⚠ {project.errorMessage}
          </div>
        )}

        {project.status === "AWAITING_APPROVAL" && (
          <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-sm text-amber-400">
            ⏸ Pipeline paused — Human-in-the-loop review required. Review the script below and approve to continue.
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
        {(["pipeline", "script", "seo", "costs", "logs"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              activeTab === tab
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab === "pipeline" && "🤖 "}
            {tab === "script" && "📝 "}
            {tab === "seo" && "🎯 "}
            {tab === "costs" && "💰 "}
            {tab === "logs" && "📋 "}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab: Pipeline */}
      {activeTab === "pipeline" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedAgents.map((agent) => (
            <AgentStatusCard
              key={agent.id}
              agent={agent}
              isParallel={PARALLEL_AGENTS.has(agent.agentName)}
            />
          ))}
        </div>
      )}

      {/* Tab: Script */}
      {activeTab === "script" && (
        <div className="space-y-4">
          {scenes.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500">
              Script not yet generated...
            </div>
          ) : (
            scenes.map((scene) => (
              <div key={scene.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-bold text-white">
                    {scene.sceneIndex + 1}
                  </div>
                  <div className="flex-1">
                    {scene.textOverlay && (
                      <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                        {scene.textOverlay}
                      </div>
                    )}
                    {scene.durationSeconds && (
                      <div className="text-xs text-zinc-500">{scene.durationSeconds}s</div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-zinc-600 font-medium mb-1 uppercase tracking-wide">🖼 Visual</p>
                    <p className="text-sm text-zinc-300 leading-relaxed">{scene.visualDescription}</p>
                    {scene.assetUrl && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-zinc-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={scene.assetUrl}
                          alt={scene.visualDescription}
                          className="w-full h-32 object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-zinc-600 font-medium mb-1 uppercase tracking-wide">🎙 Voiceover</p>
                    <p className="text-sm text-zinc-300 leading-relaxed italic">"{scene.voiceoverText}"</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: SEO */}
      {activeTab === "seo" && (
        <div className="space-y-4">
          {!seo ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500">
              SEO metadata not yet generated...
            </div>
          ) : (
            <>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <label className="text-xs text-zinc-500 uppercase tracking-wide font-medium">YouTube Title</label>
                <p className="mt-2 text-lg font-semibold text-white">{seo.videoTitle}</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <label className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Description</label>
                <pre className="mt-2 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed font-sans">{seo.videoDescription}</pre>
              </div>
              {seo.tags && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                  <label className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Tags ({(seo.tags as string[]).length})</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(seo.tags as string[]).map((tag: string) => (
                      <span key={tag} className="text-xs bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-lg">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <label className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Category</label>
                <p className="mt-2 text-sm text-zinc-300">{seo.category}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab: Costs */}
      {activeTab === "costs" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-100">API Cost Breakdown</span>
            <span className="text-sm font-bold text-blue-400">{formatCost(totalCost)} total</span>
          </div>
          {costs.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">No costs tracked yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-zinc-600 uppercase tracking-wide border-b border-zinc-800">
                  <th className="px-5 py-3 text-left">Agent</th>
                  <th className="px-5 py-3 text-left">Provider</th>
                  <th className="px-5 py-3 text-left">Operation</th>
                  <th className="px-5 py-3 text-right">Units</th>
                  <th className="px-5 py-3 text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {costs.map((cost) => (
                  <tr key={cost.id} className="hover:bg-zinc-800/30">
                    <td className="px-5 py-3 text-zinc-400">{cost.agentName.replace(/_/g, " ")}</td>
                    <td className="px-5 py-3 text-zinc-300">{cost.apiProvider}</td>
                    <td className="px-5 py-3 text-zinc-500">{cost.operation}</td>
                    <td className="px-5 py-3 text-right text-zinc-500">
                      {cost.units ? `${cost.units} ${cost.unitType ?? ""}` : "-"}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-emerald-400">
                      {formatCost(cost.costUsd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Logs */}
      {activeTab === "logs" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-zinc-500">{logs.length} log entries</span>
            {!isTerminated && (
              <div className="flex items-center gap-2 text-xs text-blue-400">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                Live streaming
              </div>
            )}
          </div>
          <LogViewer logs={logs} maxHeight="600px" />
        </div>
      )}
    </div>
  );
}
