import { BaseAgent } from "./base-agent";
import type { AgentContext, AgentResult, Script, VisualAsset } from "./types";
import { db } from "@/db"; import { scriptScenes } from "@/db/schema"; import { and, eq } from "drizzle-orm"; import fs from "node:fs/promises"; import path from "node:path";
interface VisualInput { script: Script; }
export class VisualAssetAgent extends BaseAgent<VisualInput,VisualAsset[]> { name="visual_assets"; displayName="Visual Asset Agent";
 async execute(input:VisualInput,context:AgentContext):Promise<AgentResult<VisualAsset[]>>{
  const key=process.env.PEXELS_API_KEY; if(!key) throw new Error("PEXELS_API_KEY is required"); await fs.mkdir(context.workspaceDir,{recursive:true}); const assets:VisualAsset[]=[];
  for(const scene of input.script.scenes){
   const q=encodeURIComponent(scene.visualDescription.slice(0,180)); const r=await fetch(`https://api.pexels.com/v1/videos/search?query=${q}&per_page=5&orientation=${process.env.PEXELS_ORIENTATION||"landscape"}`,{headers:{Authorization:key}}); if(!r.ok) throw new Error(`Pexels ${r.status}: ${await r.text()}`); const d=await r.json(); const video=d.videos?.[0]; const file=video?.video_files?.sort((a:any,b:any)=>(b.width*b.height)-(a.width*a.height)).find((x:any)=>x.file_type==="video/mp4") ?? video?.video_files?.[0];
   if(!file?.link) throw new Error(`No Pexels video found for scene ${scene.sceneIndex}`); const b=await fetch(file.link); if(!b.ok) throw new Error(`Failed downloading Pexels asset for scene ${scene.sceneIndex}`); const local=path.join(context.workspaceDir,`scene_${scene.sceneIndex}.mp4`); await fs.writeFile(local,Buffer.from(await b.arrayBuffer()));
   assets.push({sceneIndex:scene.sceneIndex,assetType:"video",assetUrl:video.url,localPath:local}); await db.update(scriptScenes).set({assetUrl:video.url,assetType:"video"}).where(and(eq(scriptScenes.projectId,context.projectId),eq(scriptScenes.sceneIndex,scene.sceneIndex)));
  }
  return {success:true,data:assets,costUsd:0,durationMs:0};
 }
}
