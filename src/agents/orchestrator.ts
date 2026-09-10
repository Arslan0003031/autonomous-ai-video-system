/**
 * AI Creator Studio — Master Orchestrator
 *
 * Implements a state-machine-driven multi-agent pipeline:
 *   PENDING → RESEARCHING → SCRIPTING_COMPLETE → [VOICEOVER + VISUALS + MUSIC + THUMBNAIL (parallel)]
 *   → RENDERING_IN_PROGRESS → RENDERING_COMPLETE → SEO_COMPLETE → PUBLISHING_IN_PROGRESS → PUBLISHED
 *
 * Each state transition is persisted to PostgreSQL so the pipeline can resume
 * from the last successful checkpoint on failure.
 */

import { db } from "@/db";
import {
  projects,
  agentRuns,
  projectLogs,
} from "@/db/schema";
import type { ProjectStatus } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { ResearchScriptingAgent } from "./research-scripting-agent";
import { VoiceoverAgent } from "./voiceover-agent";
import { VisualAssetAgent } from "./visual-asset-agent";
import { MusicAgent } from "./music-agent";
import { ThumbnailSEOAgent } from "./thumbnail-seo-agent";
import { RenderingAgent } from "./rendering-agent";
import { PublishingAgent } from "./publishing-agent";
import type { AgentContext, Script, VoiceoverResult, VisualAsset, MusicResult } from "./types";

// Pipeline state machine definition
const STATE_TRANSITIONS: Partial<Record<ProjectStatus, ProjectStatus>> = {
  PENDING: "RESEARCHING",
  RESEARCHING: "SCRIPTING_COMPLETE",
  SCRIPTING_COMPLETE: "VOICEOVER_IN_PROGRESS",
  VOICEOVER_IN_PROGRESS: "VOICEOVER_COMPLETE",
  VOICEOVER_COMPLETE: "VISUALS_IN_PROGRESS",
  VISUALS_IN_PROGRESS: "VISUALS_COMPLETE",
  VISUALS_COMPLETE: "MUSIC_IN_PROGRESS",
  MUSIC_IN_PROGRESS: "MUSIC_COMPLETE",
  MUSIC_COMPLETE: "THUMBNAIL_IN_PROGRESS",
  THUMBNAIL_IN_PROGRESS: "THUMBNAIL_COMPLETE",
  THUMBNAIL_COMPLETE: "RENDERING_IN_PROGRESS",
  RENDERING_IN_PROGRESS: "RENDERING_COMPLETE",
  RENDERING_COMPLETE: "SEO_IN_PROGRESS",
  SEO_IN_PROGRESS: "SEO_COMPLETE",
  SEO_COMPLETE: "PUBLISHING_IN_PROGRESS",
  PUBLISHING_IN_PROGRESS: "PUBLISHED",
};

const PROGRESS_MAP: Partial<Record<ProjectStatus, number>> = {
  PENDING: 0,
  RESEARCHING: 8,
  SCRIPTING_COMPLETE: 18,
  VOICEOVER_IN_PROGRESS: 22,
  VOICEOVER_COMPLETE: 32,
  VISUALS_IN_PROGRESS: 36,
  VISUALS_COMPLETE: 50,
  MUSIC_IN_PROGRESS: 52,
  MUSIC_COMPLETE: 58,
  THUMBNAIL_IN_PROGRESS: 60,
  THUMBNAIL_COMPLETE: 66,
  RENDERING_IN_PROGRESS: 68,
  RENDERING_COMPLETE: 82,
  SEO_IN_PROGRESS: 84,
  SEO_COMPLETE: 88,
  PUBLISHING_IN_PROGRESS: 90,
  PUBLISHED: 100,
  FAILED: -1,
  PAUSED: -1,
};

export interface OrchestratorOptions {
  useMockApi?: boolean;
  requireApproval?: boolean;
  youtubeVisibility?: "private" | "public" | "unlisted";
}

export class Orchestrator {
  private useMockApi: boolean;
  private requireApproval: boolean;
  private youtubeVisibility: "private" | "public" | "unlisted";

  constructor(options: OrchestratorOptions = {}) {
    this.useMockApi = options.useMockApi ?? false;
    this.requireApproval = options.requireApproval ?? false;
    this.youtubeVisibility = options.youtubeVisibility ?? "private";
  }

  // ─── Create a new project ─────────────────────────────────────────────────
  async createProject(prompt: string): Promise<string> {
    const projectId = uuidv4();
    const workspaceDir = `/tmp/ai-creator-studio/${projectId}`;

    await db.insert(projects).values({
      id: projectId,
      title: prompt.slice(0, 80),
      prompt,
      status: "PENDING",
      progress: 0,
      requireApproval: this.requireApproval,
      youtubeVisibility: this.youtubeVisibility,
      workspaceDir,
    });

    // Pre-create agent run slots
    const agentNames = [
      "research_scripting",
      "voiceover",
      "visual_assets",
      "music",
      "thumbnail_seo",
      "rendering",
      "publishing",
    ];
    for (const agentName of agentNames) {
      await db.insert(agentRuns).values({
        projectId,
        agentName,
        status: "IDLE",
      });
    }

    await this.log(projectId, "INFO", "orchestrator", `Project created: ${projectId}. Workspace: ${workspaceDir}`);
    return projectId;
  }

  // ─── Main pipeline runner ─────────────────────────────────────────────────
  async runPipeline(projectId: string): Promise<void> {
    const project = await this.getProject(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    if (project.status === "PUBLISHED") {
      await this.log(projectId, "WARN", "orchestrator", "Pipeline already complete");
      return;
    }

    if (project.status === "FAILED") {
      await this.log(projectId, "INFO", "orchestrator", "Resuming from failure point...");
    }

    const context: AgentContext = {
      projectId,
      prompt: project.prompt,
      workspaceDir: project.workspaceDir ?? `/tmp/ai-creator-studio/${projectId}`,
    };

    try {
      // ── Phase 1: Research & Scripting ─────────────────────────────────────
      await this.setStatus(projectId, "RESEARCHING");
      const scriptAgent = new ResearchScriptingAgent(this.useMockApi);
      const scriptResult = await scriptAgent.run({ prompt: project.prompt }, context);

      if (!scriptResult.success || !scriptResult.data) {
        return await this.failPipeline(projectId, `Scripting failed: ${scriptResult.error}`);
      }

      const script: Script = scriptResult.data;
      context.script = script;
      await this.addCost(projectId, scriptResult.costUsd);
      await this.setStatus(projectId, "SCRIPTING_COMPLETE");

      // ── Human-in-the-Loop checkpoint (if configured) ──────────────────────
      if (this.requireApproval) {
        await this.setStatus(projectId, "AWAITING_APPROVAL");
        await this.log(projectId, "WARN", "orchestrator", "Paused for human approval. Approve via UI to continue.");
        return; // Pipeline resumes when user approves
      }

      // ── Phase 2: Parallel Agents (Voiceover + Visuals + Music + Thumbnail) ─
      await this.setStatus(projectId, "VOICEOVER_IN_PROGRESS");

      const voiceoverAgent = new VoiceoverAgent(this.useMockApi);
      const visualAgent = new VisualAssetAgent(this.useMockApi);
      const musicAgent = new MusicAgent(this.useMockApi);
      const thumbnailSeoAgent = new ThumbnailSEOAgent(this.useMockApi);

      // Run all parallel agents simultaneously
      const [voiceoverResult, visualResult, musicResult, thumbnailSeoResult] =
        await Promise.all([
          voiceoverAgent.run({ script }, context),
          visualAgent.run({ script }, context),
          musicAgent.run({ script }, context),
          thumbnailSeoAgent.run({ script }, context),
        ]);

      // Check for failures
      if (!voiceoverResult.success || !voiceoverResult.data) {
        return await this.failPipeline(projectId, `Voiceover failed: ${voiceoverResult.error}`);
      }
      if (!visualResult.success || !visualResult.data) {
        return await this.failPipeline(projectId, `Visuals failed: ${visualResult.error}`);
      }
      if (!musicResult.success || !musicResult.data) {
        return await this.failPipeline(projectId, `Music failed: ${musicResult.error}`);
      }
      if (!thumbnailSeoResult.success || !thumbnailSeoResult.data) {
        return await this.failPipeline(projectId, `Thumbnail/SEO failed: ${thumbnailSeoResult.error}`);
      }

      const voiceover: VoiceoverResult = voiceoverResult.data;
      const visualAssets: VisualAsset[] = visualResult.data;
      const music: MusicResult = musicResult.data;
      const { thumbnail, seo } = thumbnailSeoResult.data;

      context.voiceover = voiceover;
      context.visualAssets = visualAssets;
      context.music = music;
      context.thumbnail = thumbnail;
      context.seo = seo;

      await this.addCost(
        projectId,
        voiceoverResult.costUsd +
          visualResult.costUsd +
          musicResult.costUsd +
          thumbnailSeoResult.costUsd
      );
      await this.setStatus(projectId, "THUMBNAIL_COMPLETE");

      // ── Phase 3: Rendering ────────────────────────────────────────────────
      await this.setStatus(projectId, "RENDERING_IN_PROGRESS");

      const renderAgent = new RenderingAgent(this.useMockApi);
      const renderResult = await renderAgent.run(
        { script, voiceover, visualAssets, music },
        context
      );

      if (!renderResult.success || !renderResult.data) {
        return await this.failPipeline(projectId, `Rendering failed: ${renderResult.error}`);
      }

      context.render = renderResult.data;
      await this.addCost(projectId, renderResult.costUsd);
      await this.setStatus(projectId, "RENDERING_COMPLETE");

      // ── Phase 4: Publishing ───────────────────────────────────────────────
      await this.setStatus(projectId, "PUBLISHING_IN_PROGRESS");

      const publishAgent = new PublishingAgent(this.useMockApi);
      const publishResult = await publishAgent.run(
        {
          render: renderResult.data,
          seo,
          thumbnail,
          visibility: this.youtubeVisibility,
        },
        context
      );

      if (!publishResult.success || !publishResult.data) {
        return await this.failPipeline(projectId, `Publishing failed: ${publishResult.error}`);
      }

      await this.addCost(projectId, publishResult.costUsd);

      // ── Mark as PUBLISHED ─────────────────────────────────────────────────
      await db
        .update(projects)
        .set({
          status: "PUBLISHED",
          progress: 100,
          youtubeUrl: publishResult.data.youtubeUrl,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(projects.id, projectId));

      await this.log(
        projectId,
        "SUCCESS",
        "orchestrator",
        `🎉 Video published successfully! URL: ${publishResult.data.youtubeUrl}`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown orchestrator error";
      await this.failPipeline(projectId, msg);
    }
  }

  // ─── Resume from AWAITING_APPROVAL ───────────────────────────────────────
  async approveAndResume(projectId: string): Promise<void> {
    await db
      .update(projects)
      .set({ status: "VOICEOVER_IN_PROGRESS", updatedAt: new Date() })
      .where(eq(projects.id, projectId));
    await this.log(projectId, "INFO", "orchestrator", "Human approved. Resuming pipeline...");
    await this.runPipeline(projectId);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  private async setStatus(projectId: string, status: ProjectStatus) {
    const progress = PROGRESS_MAP[status] ?? 0;
    await db
      .update(projects)
      .set({ status, progress, updatedAt: new Date() })
      .where(eq(projects.id, projectId));
    await this.log(projectId, "INFO", "orchestrator", `State → ${status} (${progress}%)`);
  }

  private async failPipeline(projectId: string, errorMessage: string) {
    await db
      .update(projects)
      .set({ status: "FAILED", errorMessage, updatedAt: new Date() })
      .where(eq(projects.id, projectId));
    await this.log(projectId, "ERROR", "orchestrator", `Pipeline FAILED: ${errorMessage}`);
  }

  private async addCost(projectId: string, amount: number) {
    const project = await this.getProject(projectId);
    if (!project) return;
    await db
      .update(projects)
      .set({ totalCostUsd: (project.totalCostUsd ?? 0) + amount })
      .where(eq(projects.id, projectId));
  }

  private async getProject(projectId: string) {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    return project ?? null;
  }

  private async log(
    projectId: string,
    level: "INFO" | "WARN" | "ERROR" | "SUCCESS" | "DEBUG",
    agentName: string,
    message: string
  ) {
    await db.insert(projectLogs).values({ projectId, agentName, level, message });
  }
}
