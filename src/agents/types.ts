// ─── Shared Agent Types ────────────────────────────────────────────────────────

export interface ScriptScene {
  sceneIndex: number;
  visualDescription: string;
  voiceoverText: string;
  textOverlay: string;
  durationSeconds?: number;
}

export interface Script {
  title: string;
  fullVoiceoverText: string;
  mood: string;
  targetDurationSeconds: number;
  scenes: ScriptScene[];
}

export interface VoiceoverResult {
  audioUrl: string;
  durationSeconds: number;
  wordTimestamps: WordTimestamp[];
}

export interface WordTimestamp {
  word: string;
  startSeconds: number;
  endSeconds: number;
}

export interface VisualAsset {
  sceneIndex: number;
  assetType: "image" | "video";
  assetUrl: string;
  localPath: string;
}

export interface MusicResult {
  trackUrl: string;
  localPath: string;
  mood: string;
  durationSeconds: number;
}

export interface RenderResult {
  videoPath: string;
  durationSeconds: number;
  fileSizeBytes: number;
}

export interface ThumbnailResult {
  imagePath: string;
  width: number;
  height: number;
}

export interface SEOResult {
  title: string;
  description: string;
  tags: string[];
  category: string;
}

export interface PublishResult {
  youtubeVideoId: string;
  youtubeUrl: string;
  visibility: string;
}

export interface AgentContext {
  projectId: string;
  prompt: string;
  workspaceDir: string;
  script?: Script;
  voiceover?: VoiceoverResult;
  visualAssets?: VisualAsset[];
  music?: MusicResult;
  render?: RenderResult;
  thumbnail?: ThumbnailResult;
  seo?: SEOResult;
}

export interface AgentResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  costUsd: number;
  durationMs: number;
}

export interface AgentInterface<TInput, TOutput> {
  name: string;
  run(input: TInput, context: AgentContext): Promise<AgentResult<TOutput>>;
}
