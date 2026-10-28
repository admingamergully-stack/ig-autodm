import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  supabaseUserId: text("supabase_user_id").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const igAccounts = sqliteTable("ig_accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  igUserId: text("ig_user_id").notNull().unique(),
  pageId: text("page_id"),
  username: text("username"),
  tokenEnc: text("token_enc").notNull(),
  tokenExpires: integer("token_expires", { mode: "timestamp" }),
  defaultCommentReply: text("default_comment_reply"),
  defaultDmText: text("default_dm_text"),
  dmEnabled: integer("dm_enabled", { mode: "boolean" }).notNull().default(false),
  replyEnabled: integer("reply_enabled", { mode: "boolean" }).notNull().default(true),
  keyword: text("keyword"),
  viaByok: integer("via_byok", { mode: "boolean" }),
});

export const mediaConfigs = sqliteTable("media_configs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull(),
  mediaId: text("media_id").notNull(),
  commentReply: text("comment_reply"),
  dmText: text("dm_text"),
  dmEnabled: integer("dm_enabled", { mode: "boolean" }),
  replyEnabled: integer("reply_enabled", { mode: "boolean" }),
  keyword: text("keyword"),
  linkUrl: text("link_url"),
  followGate: integer("follow_gate", { mode: "boolean" }),
  linkTrack: integer("link_track", { mode: "boolean" }),
});

export const links = sqliteTable("links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull(),
  mediaId: text("media_id"),
  code: text("code").notNull().unique(),
  target: text("target").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const clicks = sqliteTable("clicks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  linkId: integer("link_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const gateWaits = sqliteTable("gate_waits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull(),
  igsid: text("igsid").notNull(),
  mediaId: text("media_id"),
  linkCode: text("link_code"),
  dmText: text("dm_text"),
  attempts: integer("attempts"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (t) => [uniqueIndex("gate_wait_uidx").on(t.accountId, t.igsid, t.mediaId)]);

export const commentLogs = sqliteTable("comment_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id"),
  mediaId: text("media_id"),
  commentId: text("comment_id").notNull(),
  commenterId: text("commenter_id"),
  commenter: text("commenter"),
  action: text("action").notNull(),
  status: text("status").notNull(),
  error: text("error"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (t) => [uniqueIndex("comment_action_uidx").on(t.commentId, t.action)]);

export const mediaCache = sqliteTable("media_cache", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull(),
  mediaId: text("media_id").notNull(),
  caption: text("caption"),
  thumbnailUrl: text("thumbnail_url"),
  permalink: text("permalink"),
});

export const accessRequests = sqliteTable("access_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  igUsername: text("ig_username").notNull(),
  email: text("email").notNull(),
  verifyToken: text("verify_token").notNull().unique(),
  emailVerifiedAt: integer("email_verified_at", { mode: "timestamp" }),
  consentAt: integer("consent_at", { mode: "timestamp" }),
  status: text("status").notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const byokCredentials = sqliteTable("byok_credentials", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().unique(),
  igAppIdEnc: text("ig_app_id_enc").notNull(),
  igAppSecretEnc: text("ig_app_secret_enc").notNull(),
  webhookVerifyToken: text("webhook_verify_token"),
  webhookVerifiedAt: integer("webhook_verified_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Wizard progress (server-side so leaving for Meta/Instagram resumes exactly).
export const onboardingState = sqliteTable("onboarding_state", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().unique(),
  step: integer("step").notNull().default(1),
  checks: text("checks").notNull().default("{}"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
// Learned username → comment-scope ID mapping (poller comments carry
// no author ID; resolve a follower check). Refreshed on every inbound DM.
export const knownUsers = sqliteTable("known_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull(),
  usernameLower: text("username_lower").notNull(),
  igsid: text("igsid").notNull(),
  follows: integer("follows", { mode: "boolean" }),
  checkedAt: integer("checked_at", { mode: "timestamp" }).notNull(),
}, (t) => [uniqueIndex("known_user_uidx").on(t.accountId, t.usernameLower)]);
