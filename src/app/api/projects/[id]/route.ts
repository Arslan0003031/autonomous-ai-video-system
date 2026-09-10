import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  projects,
  agentRuns,
  projectLogs,
  scriptScenes,
  seoMetadata,
  costTracking,
} from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { Orchestrator } from "@/agents/orchestrator";

// GET /api/projects/[id] — full project detail
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const [agents, logs, scenes, seo, costs] = await Promise.all([
      db.select().from(agentRuns).where(eq(agentRuns.projectId, id)),
      db
        .select()
        .from(projectLogs)
        .where(eq(projectLogs.projectId, id))
        .orderBy(asc(projectLogs.createdAt))
        .limit(200),
      db
        .select()
        .from(scriptScenes)
        .where(eq(scriptScenes.projectId, id))
        .orderBy(asc(scriptScenes.sceneIndex)),
      db.select().from(seoMetadata).where(eq(seoMetadata.projectId, id)).limit(1),
      db.select().from(costTracking).where(eq(costTracking.projectId, id)).orderBy(desc(costTracking.createdAt)),
    ]);

    return NextResponse.json({
      project,
      agents,
      logs,
      scenes,
      seo: seo[0] ?? null,
      costs,
    });
  } catch (err) {
    console.error(`[GET /api/projects/${id}]`, err);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

// PATCH /api/projects/[id] — approve, retry, pause
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "approve") {
      const orchestrator = new Orchestrator({ useMockApi: false });
      setImmediate(async () => {
        await orchestrator.approveAndResume(id);
      });
      return NextResponse.json({ message: "Pipeline resumed" });
    }

    if (action === "retry") {
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, id))
        .limit(1);

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      const orchestrator = new Orchestrator({
        useMockApi: false,
        youtubeVisibility: project.youtubeVisibility as "private" | "public" | "unlisted",
        requireApproval: project.requireApproval,
      });

      setImmediate(async () => {
        await orchestrator.runPipeline(id);
      });

      return NextResponse.json({ message: "Pipeline retrying" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error(`[PATCH /api/projects/${id}]`, err);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

// DELETE /api/projects/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await db.delete(projects).where(eq(projects.id, id));
    return NextResponse.json({ message: "Project deleted" });
  } catch (err) {
    console.error(`[DELETE /api/projects/${id}]`, err);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
