export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const apiKeys = [
    {
      id: "openai",
      name: "OpenAI API",
      envKey: "OPENAI_API_KEY",
      agents: ["Research & Scripting", "Thumbnail & SEO"],
      icon: "🧠",
      docs: "https://platform.openai.com/api-keys",
      cost: "~$0.015/1K tokens (GPT-4o)",
    },
    {
      id: "elevenlabs",
      name: "ElevenLabs",
      envKey: "ELEVENLABS_API_KEY",
      agents: ["Voiceover Agent"],
      icon: "🎙️",
      docs: "https://elevenlabs.io/docs",
      cost: "~$0.015/1K characters",
    },
    {
      id: "pexels",
      name: "Pexels API",
      envKey: "PEXELS_API_KEY",
      agents: ["Visual Asset Agent"],
      icon: "🖼️",
      docs: "https://www.pexels.com/api",
      cost: "Free tier available",
    },
    {
      id: "dalle",
      name: "DALL-E 3 (OpenAI)",
      envKey: "OPENAI_API_KEY",
      agents: ["Visual Asset Agent", "Thumbnail Agent"],
      icon: "🎨",
      docs: "https://platform.openai.com/docs/guides/images",
      cost: "$0.040/image (1024×1024)",
    },
    {
      id: "epidemic",
      name: "Epidemic Sound",
      envKey: "EPIDEMIC_SOUND_API_KEY",
      agents: ["Music & SFX Agent"],
      icon: "🎵",
      docs: "https://www.epidemicsound.com/api",
      cost: "Subscription-based",
    },
    {
      id: "youtube",
      name: "YouTube Data API v3",
      envKey: "YOUTUBE_CLIENT_ID",
      agents: ["Publishing Agent"],
      icon: "📺",
      docs: "https://developers.google.com/youtube/v3",
      cost: "Free (quota-based)",
    },
    {
      id: "tavily",
      name: "Tavily Search API",
      envKey: "TAVILY_API_KEY",
      agents: ["Research & Scripting Agent"],
      icon: "🔍",
      docs: "https://docs.tavily.com",
      cost: "1000 free searches/month",
    },
  ];

  const envVarsList = [
    { key: "DATABASE_URL", desc: "PostgreSQL connection string", required: true },
    { key: "OPENAI_API_KEY", desc: "OpenAI API key (GPT-4o, DALL-E 3, Whisper)", required: true },
    { key: "ELEVENLABS_API_KEY", desc: "ElevenLabs text-to-speech API key", required: false },
    { key: "ELEVENLABS_VOICE_ID", desc: "Specific voice ID (default: Rachel)", required: false },
    { key: "PEXELS_API_KEY", desc: "Pexels stock media API key", required: false },
    { key: "EPIDEMIC_SOUND_API_KEY", desc: "Epidemic Sound music licensing", required: false },
    { key: "TAVILY_API_KEY", desc: "Tavily web search API key", required: false },
    { key: "YOUTUBE_CLIENT_ID", desc: "Google OAuth 2.0 client ID", required: false },
    { key: "YOUTUBE_CLIENT_SECRET", desc: "Google OAuth 2.0 client secret", required: false },
    { key: "YOUTUBE_REFRESH_TOKEN", desc: "YouTube long-lived refresh token", required: false },
    { key: "USE_MOCK_API", desc: "Set to 'true' to use mock responses (dev mode)", required: false },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Settings & Configuration</h1>
        <p className="text-zinc-500 text-sm">Configure API keys and system settings for the AI pipeline.</p>
      </div>

      {/* Mock Mode Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 mb-8">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚡</span>
          <div>
            <h3 className="text-amber-400 font-semibold mb-1">Mock API Mode Active</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              The system is running with simulated API responses. No real API calls are made and no costs are incurred.
              To enable real APIs, set <code className="text-amber-300 bg-zinc-800 px-1.5 py-0.5 rounded text-xs">USE_MOCK_API=false</code> in
              your <code className="text-amber-300 bg-zinc-800 px-1.5 py-0.5 rounded text-xs">.env</code> file and
              configure the required API keys below.
            </p>
          </div>
        </div>
      </div>

      {/* API Keys Reference */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-zinc-100 mb-4">🔑 API Integrations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {apiKeys.map((api) => (
            <div key={api.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{api.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-100">{api.name}</h3>
                    <a
                      href={api.docs}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Docs →
                    </a>
                  </div>
                  <code className="text-xs text-amber-300 bg-zinc-800 px-2 py-0.5 rounded mt-1 inline-block">
                    {api.envKey}
                  </code>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {api.agents.map((agent) => (
                      <span key={agent} className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                        {agent}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-600 mt-1.5">{api.cost}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* .env reference */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-100">📄 Environment Variables Reference</h2>
          <p className="text-xs text-zinc-500 mt-1">Add these to your <code className="text-zinc-400">.env</code> file</p>
        </div>
        <div className="p-5 font-mono text-xs space-y-2">
          {envVarsList.map((env) => (
            <div key={env.key} className="flex items-start gap-3">
              <span
                className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-sans font-medium ${
                  env.required
                    ? "bg-red-500/20 text-red-400"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {env.required ? "REQ" : "OPT"}
              </span>
              <span className="text-blue-400">{env.key}</span>
              <span className="text-zinc-600">=</span>
              <span className="text-zinc-500 font-sans text-xs"># {env.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FFmpeg Setup */}
      <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-zinc-100 mb-3">🎬 Rendering Engine Setup (FFmpeg)</h2>
        <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
          The rendering agent uses FFmpeg for video compilation. Install it in your environment:
        </p>
        <div className="space-y-2 font-mono text-xs">
          {[
            { label: "Ubuntu/Debian", cmd: "sudo apt-get install ffmpeg" },
            { label: "macOS (Homebrew)", cmd: "brew install ffmpeg" },
            { label: "Windows (Chocolatey)", cmd: "choco install ffmpeg" },
            { label: "Python (MoviePy)", cmd: "pip install moviepy" },
          ].map(({ label, cmd }) => (
            <div key={label} className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5">
              <span className="text-zinc-600 font-sans text-[11px] w-36 flex-shrink-0">{label}</span>
              <span className="text-emerald-400">$ {cmd}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
