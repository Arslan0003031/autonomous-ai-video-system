"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressBar } from "@/components/ui/progress-bar";

const EXAMPLE_PROMPTS = [
  "Create a video explaining the top 5 AI breakthroughs happening in 2025",
  "Make a viral YouTube Short about how to build passive income with AI tools",
  "Produce an educational video about quantum computing for beginners",
  "Create a motivational video about building a successful startup in 30 days",
  "Make a documentary-style video about the history of the internet",
  "Create a video explaining why Bitcoin will reach $1 million",
];

const AGENT_FLOW = [
  { id: "research", label: "Research & Script", icon: "📝", desc: "GPT-4o researches topic & writes structured scene-by-scene script" },
  { id: "parallel", label: "Parallel Processing", icon: "⚡", desc: "Voiceover + Visuals + Music + Thumbnail generate simultaneously", isParallel: true },
  { id: "render", label: "AI Rendering", icon: "🎬", desc: "FFmpeg assembles clips, burns Hormozi-style subtitles, mixes audio" },
  { id: "publish", label: "YouTube Publish", icon: "🚀", desc: "OAuth upload with SEO metadata, thumbnail, privacy settings" },
];

export default function CreatePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [useMockApi, setUseMockApi] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  const [visibility, setVisibility] = useState<"private" | "public" | "unlisted">("private");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, useMockApi, requireApproval, youtubeVisibility: visibility }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start pipeline");
      router.push(`/projects/${data.projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-3">
          <span>AI Creator Studio</span>
          <span>/</span>
          <span className="text-zinc-300">New Video</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Create New Video
        </h1>
        <p className="text-zinc-400">
          Enter a prompt and our multi-agent AI system will handle everything—research, scripting, voiceover, visuals, editing, and publishing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Prompt */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <label className="block text-sm font-semibold text-zinc-100 mb-3">
                🎯 Video Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the video you want to create..."
                rows={5}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 resize-none transition-colors"
                disabled={loading}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-zinc-600">
                  {prompt.length} / 500 characters
                </span>
                {prompt.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPrompt("")}
                    className="text-xs text-zinc-600 hover:text-zinc-400"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Example prompts */}
              <div className="mt-4">
                <p className="text-xs text-zinc-600 mb-2">💡 Example prompts:</p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_PROMPTS.slice(0, 3).map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setPrompt(ex)}
                      className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-lg transition-colors text-left"
                    >
                      {ex.slice(0, 50)}...
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-zinc-100">⚙️ Pipeline Settings</h3>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-zinc-300 font-medium">Mock APIs (Free)</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Use simulated responses instead of real APIs</p>
                </div>
                <button
                  type="button"
                  onClick={() => setUseMockApi(!useMockApi)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    useMockApi ? "bg-blue-600" : "bg-zinc-700"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${
                      useMockApi ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="border-t border-zinc-800 pt-4 flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-zinc-300 font-medium">Human-in-the-Loop</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Pause after scripting for your approval</p>
                </div>
                <button
                  type="button"
                  onClick={() => setRequireApproval(!requireApproval)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    requireApproval ? "bg-amber-500" : "bg-zinc-700"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${
                      requireApproval ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <p className="text-sm text-zinc-300 font-medium mb-2">YouTube Visibility</p>
                <div className="flex gap-2">
                  {(["private", "unlisted", "public"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVisibility(v)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-colors ${
                        visibility === v
                          ? "bg-blue-600 text-white"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      }`}
                    >
                      {v === "private" && "🔒 "}
                      {v === "unlisted" && "🔗 "}
                      {v === "public" && "🌐 "}
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
                ⚠ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || prompt.trim().length < 5}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Launching Pipeline...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                  Launch AI Pipeline
                </>
              )}
            </button>
          </form>
        </div>

        {/* Pipeline Preview */}
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-zinc-100 mb-4">🤖 Agent Pipeline</h3>
            <div className="space-y-3">
              {AGENT_FLOW.map((step, i) => (
                <div key={step.id} className="relative">
                  <div
                    className={`rounded-xl p-3 ${
                      step.isParallel
                        ? "bg-purple-500/10 border border-purple-500/20"
                        : "bg-zinc-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{step.icon}</span>
                      <span className="text-xs font-semibold text-zinc-200">{step.label}</span>
                      {step.isParallel && (
                        <span className="text-[10px] text-purple-400 bg-purple-500/20 px-1.5 py-0.5 rounded-full">
                          ∥ parallel
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">{step.desc}</p>
                  </div>
                  {i < AGENT_FLOW.length - 1 && (
                    <div className="flex justify-center my-1">
                      <div className="w-px h-3 bg-zinc-700" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cost estimate */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-zinc-100 mb-3">💰 Estimated Costs</h3>
            <div className="space-y-2">
              {[
                { api: "GPT-4o (Script)", cost: "$0.012" },
                { api: "ElevenLabs (TTS)", cost: "$0.015" },
                { api: "DALL-E 3 (Visuals)", cost: "$0.040" },
                { api: "Epidemic Sound", cost: "$0.005" },
                { api: "YouTube API", cost: "Free" },
              ].map(({ api, cost }) => (
                <div key={api} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">{api}</span>
                  <span className={cost === "Free" ? "text-emerald-400" : "text-zinc-300"}>
                    {cost}
                  </span>
                </div>
              ))}
              <div className="border-t border-zinc-800 pt-2 flex items-center justify-between text-xs font-semibold">
                <span className="text-zinc-300">Total Estimate</span>
                <span className="text-blue-400">~$0.072</span>
              </div>
              {useMockApi && (
                <p className="text-xs text-amber-400 mt-1">
                  ⚡ Mock mode: $0.00 (no real API calls)
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
