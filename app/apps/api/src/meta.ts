// Instagram API with Instagram Login (official path, no Facebook Page required).
// Docs: developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login
const VERSION = "v21.0";
const AUTH_URL = "https://www.instagram.com/oauth/authorize";
const TOKEN_URL = "https://api.instagram.com/oauth/access_token";
// Token endpoints are versionless; regular API calls use the versioned host.
const IG_TOKEN_BASE = "https://graph.instagram.com";
export const IG_GRAPH = `${IG_TOKEN_BASE}/${VERSION}`;

export const META_SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_comments",
  "instagram_business_manage_messages",
].join(",");

// Instagram App ID/Secret from: App Dashboard > Instagram > API setup with
// Instagram login > Business login settings. Fall back to the Meta App ID/secret.
export function igCreds(env: {
  META_IG_APP_ID?: string;
  META_IG_APP_SECRET?: string;
  META_APP_ID: string;
  META_APP_SECRET: string;
}) {
  return {
    appId: env.META_IG_APP_ID || env.META_APP_ID,
    appSecret: env.META_IG_APP_SECRET || env.META_APP_SECRET,
  };
}

export function oauthStartUrl(igAppId: string, redirectUri: string, state: string): string {
  const q = new URLSearchParams({
    client_id: igAppId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: META_SCOPES,
    state,
  });
  return `${AUTH_URL}?${q}`;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = (await res.json().catch(() => ({}))) as any;
  if (!res.ok || json.error) {
    const e = json.error ?? {};
    console.error("meta api error:", JSON.stringify({ url: url.split("?")[0], status: res.status, code: e.code, type: e.type, message: e.message }));
    throw new Error(e.message ? `Meta: ${e.message}` : `Meta API ${res.status}`);
  }
  return json as T;
}

export async function exchangeCode(code: string, igAppId: string, igSecret: string, redirectUri: string) {
  const json = await api<any>(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: igAppId,
      client_secret: igSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    }),
  });
  // Meta returns either flat {access_token,user_id} or {data:[{access_token,user_id,…}]}.
  const d = json.data?.[0] ?? json;
  if (!d.access_token) throw new Error("Meta: code exchange returned no access_token");
  console.log("code exchange ok: shape=", json.data ? "data[0]" : "flat", "user_id=", d.user_id ?? "?", "perms=", d.permissions ?? json.permissions ?? "?", "token_prefix=", String(d.access_token).slice(0, 4));
  return { shortToken: d.access_token as string, igUserId: String(d.user_id ?? "") };
}

export async function toLongLived(shortToken: string, igAppId: string, igSecret: string) {
  const params = {
    grant_type: "ig_exchange_token",
    client_id: igAppId,
    client_secret: igSecret,
    access_token: shortToken,
  };
  // Documented form: GET with query params.
  try {
    const q = new URLSearchParams(params);
    const json = await api<{ access_token: string; expires_in: number }>(
      `${IG_TOKEN_BASE}/access_token?${q}`,
    );
    return { token: json.access_token, expiresIn: json.expires_in ?? 5184000 };
  } catch (e) {
    console.error("long-lived GET failed, retrying POST:", (e as Error).message);
  }
  // Fallback: POST form-encoded (api.instagram.com convention).
  const json = await api<{ access_token: string; expires_in: number }>(`${IG_TOKEN_BASE}/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  return { token: json.access_token, expiresIn: json.expires_in ?? 5184000 };
}

export async function getProfile(token: string) {
  // user_id is the webhook-matching IG ID (entry.id); id is app-scoped.
  const q = new URLSearchParams({ fields: "id,username,user_id", access_token: token });
  const json = await api<{ id: string; username: string; user_id?: string }>(`${IG_GRAPH}/me?${q}`);
  return { id: json.id, igUserId: json.user_id ?? json.id, username: json.username ?? "" };
}

// Private reply: one DM per comment, within 7 days (Instagram Login path).
export async function sendPrivateReply(
  token: string,
  igUserId: string,
  commentId: string,
  text: string,
  quickReplies?: { title: string; payload: string }[],
) {
  const message: any = { text };
  if (quickReplies?.length) {
    message.quick_replies = quickReplies.map((q) => ({ content_type: "text", title: q.title, payload: q.payload }));
  }
  const res = await fetch(`${IG_GRAPH}/${encodeURIComponent(igUserId)}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { comment_id: commentId },
      message,
      access_token: token,
    }),
  });
  const json = (await res.json().catch(() => ({}))) as any;
  if (!res.ok || json.error) throw new Error(`private reply failed: ${json.error?.message ?? res.status}`);
  return json;
}

// Freeform DM to an IGSID (24h window after they message). Used for gate delivery.
export async function sendDirectDm(
  token: string,
  igUserId: string,
  igsid: string,
  text: string,
  quickReplies?: { title: string; payload: string }[],
) {
  const message: any = { text };
  if (quickReplies?.length) {
    message.quick_replies = quickReplies.map((q) => ({ content_type: "text", title: q.title, payload: q.payload }));
  }
  const res = await fetch(`${IG_GRAPH}/${encodeURIComponent(igUserId)}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: igsid },
      message,
      access_token: token,
    }),
  });
  const json = (await res.json().catch(() => ({}))) as any;
  if (!res.ok || json.error) throw new Error(`dm send failed: ${json.error?.message ?? res.status}`);
  return json;
}

// Follow check (official User Profile API). Null = unknown → caller fails open.
export async function getFollowStatus(token: string, igsid: string): Promise<boolean | null> {
  const p = await getUserProfile(token, igsid);
  return p ? p.follows : null;
}

// Full profile: username + follow status. Null on any failure.
export async function getUserProfile(token: string, igsid: string): Promise<{ username?: string; follows: boolean | null } | null> {
  try {
    const q = new URLSearchParams({ fields: "username,is_user_follow_business", access_token: token });
    const json = await api<{ username?: string; is_user_follow_business?: boolean }>(
      `${IG_GRAPH}/${encodeURIComponent(igsid)}?${q}`,
    );
    return {
      username: json.username,
      follows: typeof json.is_user_follow_business === "boolean" ? json.is_user_follow_business : null,
    };
  } catch (e) {
    console.error("profile lookup failed (fail open):", (e as Error).message);
    return null;
  }
}

// Recent media for the per-video picker (Instagram Login path).
export interface IgMedia {
  id: string;
  caption?: string;
  mediaType?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  permalink?: string;
  timestamp?: string;
}

export async function listMedia(token: string, igUserId: string, limit = 25): Promise<IgMedia[]> {
  const q = new URLSearchParams({
    fields: "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp",
    limit: String(limit),
    access_token: token,
  });
  const json = await api<{ data?: any[] }>(`${IG_GRAPH}/${encodeURIComponent(igUserId)}/media?${q}`);
  return (json.data ?? []).map((m) => ({
    id: m.id,
    caption: m.caption,
    mediaType: m.media_type,
    mediaUrl: m.media_url,
    thumbnailUrl: m.thumbnail_url,
    permalink: m.permalink,
    timestamp: m.timestamp,
  }));
}

// Recent comments on a media object (polling fallback path).
export interface IgComment {
  id: string;
  text?: string;
  timestamp?: string;
  username?: string;
}

export async function listComments(token: string, mediaId: string, limit = 50): Promise<IgComment[]> {
  const q = new URLSearchParams({
    fields: "id,text,timestamp,username",
    limit: String(limit),
    access_token: token,
  });
  const json = await api<{ data?: any[] }>(`${IG_GRAPH}/${encodeURIComponent(mediaId)}/comments?${q}`);
  return (json.data ?? []).map((c) => ({ id: c.id, text: c.text, timestamp: c.timestamp, username: c.username }));
}

// Public reply under a comment (Instagram Login path).
export async function postCommentReply(token: string, commentId: string, text: string) {
  const res = await fetch(`${IG_GRAPH}/${encodeURIComponent(commentId)}/replies`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ message: text, access_token: token }),
  });
  const json = (await res.json().catch(() => ({}))) as any;
  if (!res.ok || json.error) throw new Error(`comment reply failed: ${json.error?.message ?? res.status}`);
  return json;
}
export async function refreshLongLived(token: string) {
  const q = new URLSearchParams({ grant_type: "ig_refresh_token", access_token: token });
  const json = await api<{ access_token: string; expires_in: number }>(
    `${IG_TOKEN_BASE}/refresh_access_token?${q}`,
  );
  return { token: json.access_token, expiresIn: json.expires_in ?? 5184000 };
}
