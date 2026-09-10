import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  real,
  pgEnum,
  serial,
  boolean,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const projectStatusEnum = pgEnum("project_status", [
  "PENDING",
  "RESEARCHING",
  "SCRIPTING",
  "SCRIPTING_COMPLETE",
  "VOICEOVER_IN_PROGRESS",
  "VOICEOVER_COMPLETE",
  "VISUALS_IN_PROGRESS",
  "VISUALS_COMPLETE",
  "MUSIC_IN_PROGRESS",
  "MUSIC_COMPLETE",
  "THUMBNAIL_IN_PROGRESS",
  "THUMBNAIL_COMPLETE",
  "RENDERING_IN_PROGRESS",
  "RENDERING_COMPLETE",
  "SEO_IN_PROGRESS",
  "SEO_COMPLETE",
  "PUBLISHING_IN_PROGRESS",
  "PUBLISHED",
  "AWAITING_APPROVAL",
  "FAILED",
  "PAUSED",
]);

export const agentStatusEnum = pgEnum("agent_status", [
  "IDLE",
  "RUNNING",
  "COMPLETE",
  "FAILED",
  "SKIPPED",
  "AWAITING_APPROVAL",
]);

export const logLevelEnum = pgEnum("log_level", [
  "INFO",
  "WARN",
  "ERROR",
  "SUCCESS",
  "DEBUG",
]);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  status: projectStatusEnum("status").notNull().default("PENDING"),
  progress: integer("progress").notNull().default(0),
  requireApproval: boolean("require_approval").notNull().default(false),
  youtubeVisibility: text("youtube_visibility").notNull().default("private"),
  youtubeUrl: text("youtube_url"),
  thumbnailUrl: text("thumbnail_url"),
  totalCostUsd: real("total_cost_usd").notNull().default(0),
  errorMessage: text("error_message"),
  workspaceDir: text("workspace_dir"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const agentRuns = pgTable("agent_runs", {
  id: serial("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  agentName: text("agent_name").notNull(),
  status: agentStatusEnum("status").notNull().default("IDLE"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  durationMs: integer("duration_ms"),
  costUsd: real("cost_usd").notNull().default(0),
  retryCount: integer("retry_count").notNull().default(0),
  inputData: jsonb("input_data"),
  outputData: jsonb("output_data"),
  errorMessage: text("error_message"),
});

export const projectLogs = pgTable("project_logs", {
  id: serial("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  agentName: text("agent_name"),
  level: logLevelEnum("level").notNull().default("INFO"),
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const scriptScenes = pgTable("script_scenes", {
  id: serial("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  sceneIndex: integer("scene_index").notNull(),
  visualDescription: text("visual_description").notNull(),
  voiceoverText: text("voiceover_text").notNull(),
  textOverlay: text("text_overlay"),
  assetUrl: text("asset_url"),
  assetType: text("asset_type"),
  durationSeconds: real("duration_seconds"),
});

export const projectAssets = pgTable("project_assets", {
  id: serial("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  assetType: text("asset_type").notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const seoMetadata = pgTable("seo_metadata", {
  id: serial("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  videoTitle: text("video_title"),
  videoDescription: text("video_description"),
  tags: jsonb("tags").$type<string[]>(),
  category: text("category"),
  language: text("language").default("en"),
});

export const costTracking = pgTable("cost_tracking", {
  id: serial("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  agentName: text("agent_name").notNull(),
  apiProvider: text("api_provider").notNull(),
  operation: text("operation").notNull(),
  units: real("units"),
  unitType: text("unit_type"),
  costUsd: real("cost_usd").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type AgentRun = typeof agentRuns.$inferSelect;
export type ProjectLog = typeof projectLogs.$inferSelect;
export type ScriptScene = typeof scriptScenes.$inferSelect;
export type ProjectAsset = typeof projectAssets.$inferSelect;
export type SeoMetadata = typeof seoMetadata.$inferSelect;
export type CostTracking = typeof costTracking.$inferSelect;

export type ProjectStatus = (typeof projectStatusEnum.enumValues)[number];
export type AgentStatus = (typeof agentStatusEnum.enumValues)[number];
export type LogLevel = (typeof logLevelEnum.enumValues)[number];
