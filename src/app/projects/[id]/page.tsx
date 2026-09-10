import { db } from "@/db";
import { projects, agentRuns, projectLogs, scriptScenes, seoMetadata, costTracking } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ProjectDetailClient } from "./project-detail-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getProjectData(id: string) {
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!project) return null;

  const [agents, logs, scenes, seoRows, costs] = await Promise.all([
    db.select().from(agentRuns).where(eq(agentRuns.projectId, id)),
    db.select().from(projectLogs).where(eq(projectLogs.projectId, id)).orderBy(asc(projectLogs.createdAt)).limit(200),
    db.select().from(scriptScenes).where(eq(scriptScenes.projectId, id)).orderBy(asc(scriptScenes.sceneIndex)),
    db.select().from(seoMetadata).where(eq(seoMetadata.projectId, id)).limit(1),
    db.select().from(costTracking).where(eq(costTracking.projectId, id)).orderBy(desc(costTracking.createdAt)),
  ]);

  return { project, agents, logs, scenes, seo: seoRows[0] ?? null, costs };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getProjectData(id);
  if (!data) notFound();

  return <ProjectDetailClient initialData={data} projectId={id} />;
}
