export const dynamic = "force-dynamic";

export default function PipelinePage() {
  const agents = [
    {
      id: "orchestrator",
      name: "Orchestrator",
      icon: "🧠",
      color: "blue",
      description: "Master agent. Manages state machine, delegates tasks, handles retries, and coordinates the entire pipeline.",
      tech: ["LangGraph State Machine", "PostgreSQL Persistence", "Exponential Backoff"],
      inputs: ["User Prompt"],
      outputs: ["ProjectID", "Pipeline State"],
    },
    {
      id: "research_scripting",
      name: "Research & Scripting Agent",
      icon: "📝",
      color: "purple",
      description: "Searches the web for context using Tavily/Perplexity API, then generates a structured scene-by-scene script with GPT-4o.",
      tech: ["Tavily Search API", "GPT-4o / Claude 3.5", "Structured JSON Output"],
      inputs: ["Topic Prompt"],
      outputs: ["Full Script JSON", "Scene Breakdown", "Mood Tag"],
    },
    {
      id: "voiceover",
      name: "Voiceover Agent",
      icon: "🎙️",
      color: "green",
      description: "Converts script text to natural speech with word-level timestamps for accurate subtitle alignment.",
      tech: ["ElevenLabs API", "OpenAI TTS (fallback)", "Word Timestamps"],
      inputs: ["Script Text"],
      outputs: ["WAV/MP3 Audio", "Word Timestamps"],
      parallel: true,
    },
    {
      id: "visual_assets",
      name: "Visual Asset Agent",
      icon: "🖼️",
      color: "green",
      description: "Generates images with DALL-E 3 or fetches stock footage from Pexels based on each scene description.",
      tech: ["DALL-E 3", "Pexels API", "Midjourney (optional)"],
      inputs: ["Scene Descriptions"],
      outputs: ["MP4/PNG per Scene"],
      parallel: true,
    },
    {
      id: "music",
      name: "Music & SFX Agent",
      icon: "🎵",
      color: "green",
      description: "Selects or generates background music matching the script mood. Auto-ducks volume during voiceover.",
      tech: ["Epidemic Sound API", "Suno/Udio AI", "Auto-Duck Algorithm"],
      inputs: ["Mood Tag"],
      outputs: ["MP3 Track", "Auto-ducked Mix"],
      parallel: true,
    },
    {
      id: "thumbnail_seo",
      name: "Thumbnail & SEO Agent",
      icon: "🎯",
      color: "green",
      description: "Generates YouTube-optimized title, description, and tags. Creates thumbnail with DALL-E 3 + text overlay via Pillow.",
      tech: ["GPT-4o SEO", "DALL-E 3", "Python PIL/Pillow"],
      inputs: ["Script Title", "Mood"],
      outputs: ["metadata.json", "thumbnail.png"],
      parallel: true,
    },
    {
      id: "rendering",
      name: "Editing & Rendering Agent",
      icon: "🎬",
      color: "amber",
      description: "The core engine. Assembles all assets using MoviePy/FFmpeg with Ken Burns effect, Hormozi-style subtitles, and audio mixing.",
      tech: ["FFmpeg / MoviePy", "OpenAI Whisper (SRT)", "H.264 1080p60"],
      inputs: ["Audio", "Visuals", "Music", "SRT Subs"],
      outputs: ["final_output.mp4"],
    },
    {
      id: "publishing",
      name: "Publishing Agent",
      icon: "🚀",
      color: "red",
      description: "Uploads to YouTube via Data API v3 with OAuth 2.0. Sets thumbnail, metadata, and privacy settings.",
      tech: ["YouTube Data API v3", "OAuth 2.0", "Resumable Upload"],
      inputs: ["MP4 File", "Metadata", "Thumbnail"],
      outputs: ["YouTube URL"],
    },
  ];

  const COLOR_STYLES: Record<string, string> = {
    blue: "border-blue-500/30 bg-blue-500/5",
    purple: "border-purple-500/30 bg-purple-500/5",
    green: "border-emerald-500/30 bg-emerald-500/5",
    amber: "border-amber-500/30 bg-amber-500/5",
    red: "border-red-500/30 bg-red-500/5",
  };

  const BADGE_COLORS: Record<string, string> = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    green: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Pipeline Architecture</h1>
        <p className="text-zinc-500 text-sm">
          Multi-agent system with state machine orchestration. Agents 3–6 run in <span className="text-emerald-400">parallel</span> to minimize render time.
        </p>
      </div>

      {/* State machine overview */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">🔄 State Machine Flow</h2>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {[
            "PENDING", "RESEARCHING", "SCRIPTING_COMPLETE",
            "VOICEOVER_IN_PROGRESS", "→ PARALLEL ←",
            "THUMBNAIL_COMPLETE", "RENDERING_IN_PROGRESS",
            "RENDERING_COMPLETE", "PUBLISHING_IN_PROGRESS", "PUBLISHED"
          ].map((state, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-lg font-mono ${
                state.includes("→") || state.includes("←")
                  ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                  : state === "PUBLISHED"
                  ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                  : "text-zinc-400 bg-zinc-800 border border-zinc-700"
              }`}>
                {state}
              </span>
              {i < 9 && <span className="text-zinc-700">→</span>}
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-zinc-600">
          + FAILED and AWAITING_APPROVAL are reachable from any state. AWAITING_APPROVAL requires user action to resume.
        </div>
      </div>

      {/* Agent cards */}
      <div className="space-y-4">
        {agents.map((agent, i) => (
          <div key={agent.id}>
            {/* Parallel label */}
            {agent.id === "voiceover" && (
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
                <span className="text-xs text-emerald-400 font-semibold px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  ∥ PARALLEL EXECUTION ZONE
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
              </div>
            )}
            {agent.id === "rendering" && (
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-600 to-transparent" />
                <span className="text-xs text-zinc-500 px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full">
                  ▼ SEQUENTIAL CONTINUES
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-600 to-transparent" />
              </div>
            )}

            <div className={`border rounded-2xl p-5 ${COLOR_STYLES[agent.color] ?? "border-zinc-700 bg-zinc-900"}`}>
              <div className="flex items-start gap-4">
                <div className="text-3xl flex-shrink-0">{agent.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="text-base font-semibold text-white">{agent.name}</h3>
                    {agent.parallel && (
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${BADGE_COLORS[agent.color]}`}>
                        ∥ parallel
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400 mb-4 leading-relaxed">{agent.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-zinc-600 uppercase tracking-wide font-medium mb-1.5">⚙ Tech Stack</p>
                      <div className="flex flex-wrap gap-1">
                        {agent.tech.map((t) => (
                          <span key={t} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-600 uppercase tracking-wide font-medium mb-1.5">→ Inputs</p>
                      <div className="flex flex-wrap gap-1">
                        {agent.inputs.map((inp) => (
                          <span key={inp} className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                            {inp}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-600 uppercase tracking-wide font-medium mb-1.5">← Outputs</p>
                      <div className="flex flex-wrap gap-1">
                        {agent.outputs.map((out) => (
                          <span key={out} className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            {out}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
