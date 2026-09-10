import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, agentRuns, costTracking } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { Orchestrator } from "@/agents/orchestrator";

// GET /api/projects — list all projects with agent run summaries
export async function GET() {
  try {
    const rows = await db
      .select({
        project: projects,
        agentCount: sql<number>`count(distinct ${agentRuns.id})`.as("agentCount"),
        totalCost: sql<number>`coalesce(sum(${costTracking.costUsd}), 0)`.as("totalCost"),
      })
      .from(projects)
      .leftJoin(agentRuns, eq(agentRuns.projectId, projects.id))
      .leftJoin(costTracking, eq(costTracking.projectId, projects.id))
      .groupBy(projects.id)
      .orderBy(desc(projects.createdAt));

    return NextResponse.json({ projects: rows });
  } catch (err) {
    console.error("[GET /api/projects]", err);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

// POST /api/projects — create and start a new project
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, useMockApi = false, requireApproval = false, youtubeVisibility = "private" } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 5) {
      return NextResponse.json({ error: "Prompt must be at least 5 characters" }, { status: 400 });
    }

    const orchestrator = new Orchestrator({
      useMockApi: Boolean(useMockApi),
      requireApproval: Boolean(requireApproval),
      youtubeVisibility: youtubeVisibility as "private" | "public" | "unlisted",
    });

    const projectId = await orchestrator.createProject(prompt.trim());

    // Run pipeline in background (non-blocking)
    setImmediate(async () => {
      try {
        await orchestrator.runPipeline(projectId);
      } catch (err) {
        console.error(`[Pipeline Error] Project ${projectId}:`, err);
      }
    });

    return NextResponse.json({ projectId, message: "Pipeline started" }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/projects]", err);
    return NextResponse.json({ error: "Failed to start pipeline" }, { status: 500 });
  }
}
