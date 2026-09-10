import { BaseAgent } from "./base-agent";
import type { AgentContext, AgentResult, Script } from "./types";
import { db } from "@/db";
import { scriptScenes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { openAIJson } from "@/lib/ai";

interface ResearchInput { prompt: string; }

export class ResearchScriptingAgent extends BaseAgent<ResearchInput, Script> {
  name = "research_scripting";
  displayName = "Research & Scripting Agent";

  async execute(input: ResearchInput, context: AgentContext): Promise<AgentResult<Script>> {
    await this.log(context.projectId, "INFO", `Researching topic: "${input.prompt}"`);
    if (this.useMockApi) throw new Error("Mock mode is not supported by the production API path.");
    const started = Date.now();
    const script = await openAIJson<Script>(`${ResearchScriptingAgent.buildSystemPrompt()}\n\nCreate the video for this topic:\n${input.prompt}`);
    if (!script.title || !script.fullVoiceoverText || !Array.isArray(script.scenes)) throw new Error("Invalid script returned by OpenAI");
    await db.delete(scriptScenes).where(eq(scriptScenes.projectId, context.projectId));
    for (const scene of script.scenes) {
      await db.insert(scriptScenes).values({ projectId: context.projectId, sceneIndex: scene.sceneIndex, visualDescription: scene.visualDescription, voiceoverText: scene.voiceoverText, textOverlay: scene.textOverlay ?? null, durationSeconds: scene.durationSeconds ?? null });
    }
    const cost = 0;
    await this.log(context.projectId, "SUCCESS", `Script generated with ${script.scenes.length} scenes`);
    return { success: true, data: script, costUsd: cost, durationMs: Date.now() - started };
  }

  static buildSystemPrompt(): string {
    return `You are an expert YouTube researcher and scriptwriter. Produce ONLY valid JSON matching this shape: {title:string,mood:string,targetDurationSeconds:number,fullVoiceoverText:string,scenes:[{sceneIndex:number,visualDescription:string,voiceoverText:string,textOverlay:string,durationSeconds:number}]}. Create an engaging factual/educational video with a strong first-10-second hook. Keep scene narration and total duration coherent. Do not invent citations or claim live facts unless clearly general knowledge.`;
  }
}
