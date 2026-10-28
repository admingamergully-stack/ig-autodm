// Shared types + Meta Graph API helpers (ported logic reference: OpenReply).
// Pure functions only — no runtime deps, works in Workers.

export type LogAction = "comment_reply" | "private_reply";
export type LogStatus = "queued" | "sent" | "skipped" | "failed";

export interface CommentEvent {
  igUserId: string; // owner IG account id (from webhook entry.id)
  commentId: string;
  mediaId?: string;
  text?: string;
  commenterId?: string;
  commenterUsername?: string;
}

export interface EffectiveConfig {
  keyword: string | null;
  commentReply: string | null;
  dmText: string | null;
  dmEnabled: boolean;
  replyEnabled: boolean;
}

const FB_GRAPH = "https://graph.facebook.com";
export const IG_GRAPH = "https://graph.instagram.com";

export function keywordMatches(text: string | undefined, keyword: string | null): boolean {
  if (!keyword) return true;
  if (!text) return false;
  return text.toLowerCase().includes(keyword.toLowerCase());
}

export function commentReplyUrl(commentId: string, version = "v21.0", host = FB_GRAPH): string {
  return `${host}/${version}/${encodeURIComponent(commentId)}/replies`;
}

export function privateReplyUrl(igUserId: string, version = "v21.0", host = FB_GRAPH): string {
  return `${host}/${version}/${encodeURIComponent(igUserId)}/messages`;
}

export function privateReplyBody(commentId: string, text: string) {
  return { recipient: { comment_id: commentId }, message: { text } };
}

// ponytail: naive substring match; regex/word-boundary later if users ask
export function renderTemplate(template: string, vars: { username?: string }): string {
  return template.replaceAll("{username}", vars.username ?? "");
}
