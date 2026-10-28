import { API_BASE } from "./config";

export type Account = {
  igUserId: string;
  username: string;
  keyword: string | null;
  dmEnabled: boolean;
  replyEnabled: boolean;
  tokenExpires: string | null;
  defaultCommentReply: string | null;
  defaultDmText: string | null;
  viaByok: boolean;
};

export type MediaItem = {
  mediaId: string;
  caption: string | null;
  mediaType: string;
  thumbnailUrl: string | null;
  permalink: string | null;
  timestamp: string | null;
  stats: { replies: number; dms: number };
  clicks?: number;
  config: {
    keyword: string | null;
    commentReply: string | null;
    dmText: string | null;
    replyEnabled: boolean;
    dmEnabled: boolean;
    linkUrl?: string | null;
    followGate?: boolean | null;
    linkTrack?: boolean | null;
  } | null;
};

export type Stats = {
  connectedAccounts: number;
  activeConfigs: number;
  dmsSent7d: number;
  repliesSent7d: number;
};

export type ByokChecks = { appIdValid: boolean; secretValid: boolean; accessible: boolean | null };

export type OnboardingState = { step: number; checks: Record<string, boolean> };

async function req<T>(
  path: string,
  token: string | null,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      detail = j?.error || j?.message || JSON.stringify(j);
    } catch {
      detail = await res.text().catch(() => "");
    }
    throw new Error(detail || `Request failed (${res.status})`);
  }
  // 204
  if (res.status === 204) return {} as T;
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

export const api = {
  health: () => req<{ ok: boolean }>("/health", null),
  me: (token: string) => req<{ id: string; email: string }>("/me", token),
  accounts: (token: string) =>
    req<{ accounts: Account[] }>("/accounts", token),
  updateDefaults: (
    token: string,
    igUserId: string,
    body: Partial<
      Pick<
        Account,
        "keyword" | "defaultCommentReply" | "defaultDmText" | "replyEnabled" | "dmEnabled"
      >
    >
  ) =>
    req<{ account: Account }>(`/accounts/${encodeURIComponent(igUserId)}/defaults`, token, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  media: (token: string, account: string) =>
    req<{ media: MediaItem[] }>(`/media?account=${encodeURIComponent(account)}`, token),
  saveMediaConfig: (
    token: string,
    body: {
      igUserId: string;
      mediaId: string;
      keyword?: string | null;
      commentReply?: string | null;
      dmText?: string | null;
      replyEnabled?: boolean;
      dmEnabled?: boolean;
      linkUrl?: string | null;
      followGate?: boolean | null;
      linkTrack?: boolean | null;
    }
  ) =>
    req<{ ok: boolean; config: MediaItem["config"] }>("/media-config", token, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  clearMediaConfig: (token: string, igUserId: string, mediaId: string) =>
    req<{ ok: boolean }>("/media-config", token, {
      method: "PUT",
      body: JSON.stringify({ igUserId, mediaId, clear: true }),
    }),
  stats: (token: string) => req<Stats>("/stats", token),
  byok: (token: string) =>
    req<{ configured: boolean; verifyToken?: string }>("/byok", token),
  saveByok: (token: string, body: { igAppId: string; igAppSecret: string }) =>
    req<{ ok: boolean; configured: boolean }>("/byok", token, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  removeByok: (token: string) =>
    req<{ ok: boolean }>("/byok", token, { method: "DELETE" }),
  connectUrlByok: (token: string) =>
    req<{ url: string }>("/connect/meta?byok=1", token),
  byokCheck: async (
    token: string,
    body: { igAppId: string; igAppSecret: string }
  ): Promise<{ ok: boolean; checks?: ByokChecks; appName?: string | null; warning?: string; error?: string }> => {
    // 400s carry structured checks — parse, don't throw.
    const res = await fetch(`${API_BASE}/byok/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }).catch(() => null);
    if (!res) return { ok: false, error: "Couldn't reach the server. Check your connection and try again." };
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, checks: j.checks, error: j.error || "Verification failed." };
    return { ok: true, checks: j.checks, appName: j.appName ?? null };
  },
  onboardingGet: (token: string) => req<OnboardingState>("/onboarding", token),
  onboardingSave: (token: string, body: { step?: number; checks?: Record<string, boolean> }) =>
    req<OnboardingState>("/onboarding", token, { method: "PUT", body: JSON.stringify(body) }),
};
