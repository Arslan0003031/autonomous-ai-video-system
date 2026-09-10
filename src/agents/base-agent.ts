import { db } from "@/db";
import { agentRuns, costTracking, projectLogs } from "@/db/schema";
import type { AgentStatus, LogLevel } from "@/db/schema";
import type { AgentContext, AgentResult } from "./types";
import { eq, and } from "drizzle-orm";

export abstract class BaseAgent<TInput = unknown, TOutput = unknown> {
  abstract name: string;
  abstract displayName: string;
  protected useMockApi: boolean;

  constructor(useMockApi = false) {
    this.useMockApi = useMockApi;
  }

  abstract execute(
    input: TInput,
    context: AgentContext
  ): Promise<AgentResult<TOutput>>;

  async run(
    input: TInput,
    context: AgentContext
  ): Promise<AgentResult<TOutput>> {
    const startedAt = new Date();
    const start = Date.now();

    // Upsert agent run record
    const existing = await db
      .select()
      .from(agentRuns)
      .where(
        and(
          eq(agentRuns.projectId, context.projectId),
          eq(agentRuns.agentName, this.name)
        )
      )
      .limit(1);

    let runId: number;
    if (existing.length > 0) {
      await db
        .update(agentRuns)
        .set({
          status: "RUNNING",
          startedAt,
          errorMessage: null,
          inputData: input as Record<string, unknown>,
        })
        .where(eq(agentRuns.id, existing[0].id));
      runId = existing[0].id;
    } else {
      const [inserted] = await db
        .insert(agentRuns)
        .values({
          projectId: context.projectId,
          agentName: this.name,
          status: "RUNNING",
          startedAt,
          inputData: input as Record<string, unknown>,
        })
        .returning();
      runId = inserted.id;
    }

    await this.log(context.projectId, "INFO", `${this.displayName} started`);

    try {
      const result = await this.execute(input, context);
      const durationMs = Date.now() - start;

      await db
        .update(agentRuns)
        .set({
          status: result.success ? "COMPLETE" : "FAILED",
          completedAt: new Date(),
          durationMs,
          costUsd: result.costUsd,
          outputData: result.data as Record<string, unknown>,
          errorMessage: result.error ?? null,
          retryCount: (existing[0]?.retryCount ?? 0),
        })
        .where(eq(agentRuns.id, runId));

      if (result.success) {
        await this.log(
          context.projectId,
          "SUCCESS",
          `${this.displayName} completed in ${durationMs}ms. Cost: $${result.costUsd.toFixed(4)}`
        );
      } else {
        await this.log(
          context.projectId,
          "ERROR",
          `${this.displayName} failed: ${result.error}`
        );
      }

      return { ...result, durationMs };
    } catch (err) {
      const durationMs = Date.now() - start;
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";

      await db
        .update(agentRuns)
        .set({
          status: "FAILED",
          completedAt: new Date(),
          durationMs,
          errorMessage,
        })
        .where(eq(agentRuns.id, runId));

      await this.log(
        context.projectId,
        "ERROR",
        `${this.displayName} threw exception: ${errorMessage}`
      );

      return { success: false, error: errorMessage, costUsd: 0, durationMs };
    }
  }

  protected async log(
    projectId: string,
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>
  ) {
    await db.insert(projectLogs).values({
      projectId,
      agentName: this.name,
      level,
      message,
      metadata: metadata ?? null,
    });
  }

  protected async trackCost(
    projectId: string,
    apiProvider: string,
    operation: string,
    costUsd: number,
    units?: number,
    unitType?: string
  ) {
    await db.insert(costTracking).values({
      projectId,
      agentName: this.name,
      apiProvider,
      operation,
      costUsd,
      units: units ?? null,
      unitType: unitType ?? null,
    });
  }

  async updateStatus(projectId: string, status: AgentStatus) {
    await db
      .update(agentRuns)
      .set({ status })
      .where(
        and(
          eq(agentRuns.projectId, projectId),
          eq(agentRuns.agentName, this.name)
        )
      );
  }
}
