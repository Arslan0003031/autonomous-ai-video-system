import { BaseAgent } from "./base-agent";
import type { AgentContext, AgentResult, Script, VoiceoverResult, WordTimestamp } from "./types";
import fs from "node:fs/promises";
import path from "node:path";

interface VoiceoverInput { script: Script; }
export class VoiceoverAgent extends BaseAgent<VoiceoverInput, VoiceoverResult> {
  name = "voiceover"; displayName = "Voiceover Agent";
  async execute(input: VoiceoverInput, context: AgentContext): Promise<AgentResult<VoiceoverResult>> {
    const key = process.env.ELEVENLABS_API_KEY; if (!key) throw new Error("ELEVENLABS_API_KEY is required");
    await fs.mkdir(context.workspaceDir, { recursive: true });
    const voiceId = process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb";
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`, { method:"POST", headers:{"xi-api-key":key,"Content-Type":"application/json"}, body:JSON.stringify({text:input.script.fullVoiceoverText,model_id:process.env.ELEVENLABS_MODEL||"eleven_multilingual_v2",voice_settings:{stability:0.5,similarity_boost:0.75}}) });
    if(!res.ok) throw new Error(`ElevenLabs TTS ${res.status}: ${await res.text()}`);
    const data=await res.json(); if(!data.audio_base64) throw new Error("ElevenLabs returned no audio");
    const audioPath=path.join(context.workspaceDir,"voiceover.mp3"); await fs.writeFile(audioPath,Buffer.from(data.audio_base64,"base64"));
    const a=data.alignment; const words:WordTimestamp[]=[];
    if(a){ let start=-1, word=""; for(let i=0;i<a.characters.length;i++){ const ch=a.characters[i]; if(ch!==" " && start<0){start=i;} if(ch===" " || i===a.characters.length-1){ const end=i===a.characters.length-1?i+1:i; if(start>=0){word=a.characters.slice(start,end).join(""); const st=a.character_start_times_seconds[start], en=a.character_end_times_seconds[end-1]; words.push({word,startSeconds:st,endSeconds:en});} start=-1; } } }
    const durationSeconds=words.at(-1)?.endSeconds ?? 0;
    const cost=0;
    return {success:true,data:{audioUrl:audioPath,durationSeconds,wordTimestamps:words},costUsd:cost,durationMs:0};
  }
}
