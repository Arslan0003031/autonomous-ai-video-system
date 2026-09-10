import { NextRequest } from "next/server";
import { db } from "@/db";
import { projects, agentRuns, projectLogs } from "@/db/schema";
import { eq, asc, gt } from "drizzle-orm";

// GET /api/projects/[id]/stream — Server-Sent Events for real-time updates
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const encoder = new TextEncoder();
  let lastLogId = 0;
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // stream closed
        }
      };

      // Send heartbeat every 2s and project state every poll cycle
      const interval = setInterval(async () => {
        if (closed) {
          clearInterval(interval);
          return;
        }

        try {
          const [project] = await db
            .select()
            .from(projects)
            .where(eq(projects.id, id))
            .limit(1);

          if (!project) {
            send("error", { message: "Project not found" });
            clearInterval(interval);
            controller.close();
            return;
          }

          const agents = await db
            .select()
            .from(agentRuns)
            .where(eq(agentRuns.projectId, id));

          // Only send new logs since last poll
          const newLogs = await db
            .select()
            .from(projectLogs)
            .where(
              lastLogId > 0
                ? gt(projectLogs.id, lastLogId)
                : eq(projectLogs.projectId, id)
            )
            .orderBy(asc(projectLogs.createdAt))
            .limit(50);

          if (newLogs.length > 0) {
            lastLogId = newLogs[newLogs.length - 1].id;
          }

          send("update", {
            project,
            agents,
            newLogs,
            timestamp: new Date().toISOString(),
          });

          // Auto-close stream when pipeline terminates
          if (
            project.status === "PUBLISHED" ||
            project.status === "FAILED"
          ) {
            setTimeout(() => {
              clearInterval(interval);
              if (!closed) {
                closed = true;
                try {
                  controller.close();
                } catch {
                  // already closed
                }
              }
            }, 3000);
          }
        } catch {
          send("heartbeat", { ts: Date.now() });
        }
      }, 1500);
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
