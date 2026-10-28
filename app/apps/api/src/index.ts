import { Hono } from "hono";
import { cors } from "hono/cors";
import { and, eq, gt, inArray, sql } from "drizzle-orm";
import { keywordMatches, renderTemplate, type CommentEvent } from "@ig-autodm/shared";
import { requireUser } from "./auth";
import { decryptToken, encryptToken, makeState, requireEnv, verifyState } from "./crypto";
import { exchangeCode, getFollowStatus, getProfile, getUserProfile, listMedia, oauthStartUrl, postCommentReply, sendDirectDm, sendPrivateReply, toLongLived } from "./meta";
import { ensureLink, renderLink } from "./links";
import { cacheThumbnail } from "./cloudinary";
import { getDb } from "./db";

// Account owned by the Supabase user, or null.
async function ownedAccount(c: any, igUserId: string) {
  const user = c.get("user");
  const db = getDb(c.env);
  const { users, igAccounts } = await import("@ig-autodm/db");
  const [u] = await db.select().from(users).where(eq(users.supabaseUserId, user.id));
  if (!u) return null;
  const [a] = await db
    .select()
    .from(igAccounts)
    .where(and(eq(igAccounts.userId, u.id), eq(igAccounts.igUserId, igUserId)));
  return a ?? null;
}

type Bindings = {
  WEBHOOK_VERIFY_TOKEN: string;
  COMMENT_QUEUE: Queue<CommentEvent>;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  META_APP_ID: string;
  META_APP_SECRET: string;
  META_IG_APP_ID?: string;
  META_IG_APP_SECRET?: string;
  ENCRYPTION_KEY: string;
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN?: string;
  WEB_BASE: string;
  OAUTH_BASE_URL?: string;
  CLOUDINARY_URL?: string;
  BREVO_API_KEY: string;
  MAIL_FROM: string;
  ADMIN_EMAILS?: string;
  DM_COOLDOWN_MIN?: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: { user: any } }>();

// Dashboard (different origin) calls this API from the browser.
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const allowed = [c.env.WEB_BASE, "http://localhost:4321", "http://lvh.me:4321"];
      return allowed.includes(origin) ? origin : null;
    },
  }),
);

app.get("/health", (c) => c.json({ ok: true }));

app.get("/me", requireUser, (c) => {
  const u = c.get("user");
  return c.json({ id: u.id, email: u.email ?? null });
});

// Meta webhook verification (GET hub.challenge).
// Accepts the platform token OR any BYOK user's personal token.
app.get("/webhook/meta", async (c) => {
  const mode = c.req.query("hub.mode");
  const token = c.req.query("hub.verify_token") ?? "";
  const challenge = c.req.query("hub.challenge");
  if (mode === "subscribe" && token && token === c.env.WEBHOOK_VERIFY_TOKEN) {
    return c.text(challenge ?? "");
  }
  if (mode === "subscribe" && token) {
    try {
      const db = getDb(c.env);
      const { byokCredentials } = await import("@ig-autodm/db");
      const rows = await db.select({ id: byokCredentials.id }).from(byokCredentials).where(eq(byokCredentials.webhookVerifyToken, token));
      if (rows.length) {
        // Stamp success so the onboarding wizard can show "webhook configured".
        await db.update(byokCredentials).set({ webhookVerifiedAt: new Date() }).where(eq(byokCredentials.id, rows[0].id)).catch(() => {});
        return c.text(challenge ?? "");
      }
    } catch {
      /* fall through to 403 */
    }
  }
  return c.text("Forbidden", 403);
});

// Meta comment events → enqueue for worker
app.post("/webhook/meta", async (c) => {
  const body = await c.req.json().catch(() => null);
  const entries: any[] = body?.entry ?? [];
  let enqueued = 0;
  for (const entry of entries) {
    const igUserId = String(entry.id ?? "");
    for (const change of entry.changes ?? []) {
      if (change.field !== "comments") continue;
      const v = change.value ?? {};
      // FB sends verb:"add"; IG webhooks omit verb — accept when a comment id exists.
      if (v.verb && v.verb !== "add") continue;
      const ev: CommentEvent = {
        igUserId,
        commentId: String(v.comment_id ?? v.id ?? ""),
        mediaId: v.media_id ?? v.media?.id ? String(v.media_id ?? v.media?.id) : undefined,
        text: v.text ?? undefined,
        commenterId: v.from?.id ? String(v.from.id) : undefined,
        commenterUsername: v.from?.username,
      };
      if (!ev.commentId) {
        console.log("webhook: comment event without id, value=", JSON.stringify(v).slice(0, 300));
        continue;
      }
      await c.env.COMMENT_QUEUE.send(ev);
      enqueued++;
    }
    // Inbound DMs (gate confirmations, postbacks). Needs `messages` field subscribed.
    for (const m of entry.messaging ?? []) {
      const igsid = m.sender?.id ? String(m.sender.id) : "";
      const text = m.message?.text ?? "";
      const payload = m.message?.quick_reply?.payload ?? m.postback?.payload ?? "";
      if (!igsid || (!text && !payload)) continue;
      await c.env.COMMENT_QUEUE.send({
        igUserId,
        commentId: `dm:${m.message?.mid ?? Date.now()}`,
        text: payload ? `[postback:${payload}] ${text}` : text,
        commenterId: igsid,
      } as CommentEvent);
      enqueued++;
    }
  }
  return c.json({ ok: true, enqueued });
});

// Tracked link redirect: GET /r/:code → target + click log.
app.get("/r/:code", async (c) => {
  const db = getDb(c.env);
  const { links, clicks } = await import("@ig-autodm/db");
  const [link] = await db.select().from(links).where(eq(links.code, c.req.param("code")));
  if (!link) return c.text("Link not found", 404);
  await db.insert(clicks).values({ linkId: link.id, createdAt: new Date() }).catch(() => {});
  return c.redirect(link.target, 302);
});

// --- Connect Instagram (Meta OAuth, step 3) ---
// OAuth callback base: explicit public URL when set (tunnel/ngrok for local
// dev, real domain in prod), else the request origin.
const redirectUri = (c: any) =>
  `${c.env.OAUTH_BASE_URL || new URL(c.req.url).origin}/connect/meta/callback`;

// Resolve the caller's BYOK credentials (decrypted). Null when not configured.
async function userByok(c: any): Promise<{ appId: string; appSecret: string } | null> {
  const user = c.get("user");
  const db = getDb(c.env);
  const { users, byokCredentials } = await import("@ig-autodm/db");
  const [u] = await db.select().from(users).where(eq(users.supabaseUserId, user.id));
  if (!u) return null;
  const [row] = await db.select().from(byokCredentials).where(eq(byokCredentials.userId, u.id));
  if (!row) return null;
  const key = (c.env as Bindings).ENCRYPTION_KEY;
  return { appId: await decryptToken(row.igAppIdEnc, key), appSecret: await decryptToken(row.igAppSecretEnc, key) };
}

// --- BYOK: caller's own Meta app (Advanced) ---
// Save own Instagram App ID + Secret (encrypted; never returned).
app.put("/byok", requireUser, requireEnv, async (c) => {
  const b = await c.req.json().catch(() => ({}));
  const igAppId = String(b.igAppId ?? "").trim();
  const igAppSecret = String(b.igAppSecret ?? "").trim();
  if (!/^\d{5,25}$/.test(igAppId)) return c.json({ error: "App ID must be the numeric Instagram App ID" }, 400);
  if (igAppSecret.length < 8) return c.json({ error: "App Secret looks too short" }, 400);
  const user = c.get("user");
  const db = getDb(c.env);
  const { users, byokCredentials } = await import("@ig-autodm/db");
  await db.insert(users).values({ supabaseUserId: user.id, createdAt: new Date() }).onConflictDoNothing();
  const [u] = await db.select().from(users).where(eq(users.supabaseUserId, user.id));
  const key = (c.env as Bindings).ENCRYPTION_KEY;
  const row = {
    userId: u.id,
    igAppIdEnc: await encryptToken(igAppId, key),
    igAppSecretEnc: await encryptToken(igAppSecret, key),
    createdAt: new Date(),
  };
  const [existing] = await db.select().from(byokCredentials).where(eq(byokCredentials.userId, u.id));
  if (existing) {
    await db.update(byokCredentials).set({ igAppIdEnc: row.igAppIdEnc, igAppSecretEnc: row.igAppSecretEnc }).where(eq(byokCredentials.id, existing.id));
  } else {
    await db.insert(byokCredentials).values(row);
  }
  return c.json({ ok: true, configured: true });
});

// Status + the caller's PERSONAL webhook verify token (generated on first
// read). Each BYOK app subscribes webhooks with its own token; secrets stay hidden.
app.get("/byok", requireUser, async (c) => {
  const b = await userByok(c).catch(() => null);
  if (!b) return c.json({ configured: false });
  const user = c.get("user");
  const db = getDb(c.env);
  const { users, byokCredentials } = await import("@ig-autodm/db");
  const [u] = await db.select().from(users).where(eq(users.supabaseUserId, user.id));
  const [row] = u
    ? await db.select().from(byokCredentials).where(eq(byokCredentials.userId, u.id))
    : [];
  let token = row?.webhookVerifyToken ?? null;
  if (row && !token) {
    const { randomHex } = await import("./crypto");
    token = `byok_${randomHex(16)}`;
    await db.update(byokCredentials).set({ webhookVerifyToken: token }).where(eq(byokCredentials.id, row.id));
  }
  return c.json({ configured: true, verifyToken: token, webhookVerified: !!row?.webhookVerifiedAt });
});

app.delete("/byok", requireUser, async (c) => {
  const user = c.get("user");
  const db = getDb(c.env);
  const { users, byokCredentials } = await import("@ig-autodm/db");
  const [u] = await db.select().from(users).where(eq(users.supabaseUserId, user.id));
  if (u) await db.delete(byokCredentials).where(eq(byokCredentials.userId, u.id));
  return c.json({ ok: true, configured: false });
});

// Verify App ID + Secret WITHOUT saving (wizard Step 2).
// Instagram App IDs cannot be resolved server-side (no public app-info
// endpoint), so Meta confirmation is opportunistic: a Facebook-resolvable
// ID confirms strongly, anything else defers to connect-time verification.
// This endpoint NEVER false-rejects real credentials — format failures are
// the only hard errors.
app.post("/byok/check", requireUser, requireEnv, async (c) => {
  const b = await c.req.json().catch(() => ({}));
  const igAppId = String(b.igAppId ?? "").trim();
  const igAppSecret = String(b.igAppSecret ?? "").trim();
  if (!/^\d{5,25}$/.test(igAppId)) {
    return c.json({ ok: false, error: "That doesn't look like a Meta App ID — it's the long number in Business login settings.", checks: { appIdValid: false, secretValid: false, accessible: null } }, 400);
  }
  if (igAppSecret.length < 8) {
    return c.json({ ok: false, error: "That secret looks too short — copy the full App Secret (Show button in Meta).", checks: { appIdValid: true, secretValid: false, accessible: null } }, 400);
  }
  // Opportunistic: resolvable only for Facebook App IDs, never Instagram ones.
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${encodeURIComponent(igAppId)}?fields=id,name&access_token=${encodeURIComponent(igAppId)}%7C${encodeURIComponent(igAppSecret)}`,
    );
    const j = (await res.json().catch(() => ({}))) as any;
    if (res.ok && !j.error && String(j.id) === igAppId) {
      return c.json({ ok: true, checks: { appIdValid: true, secretValid: true, accessible: true }, appName: j.name ?? null });
    }
  } catch {
    /* fall through to unverified-but-saveable */
  }
  return c.json({
    ok: true,
    checks: { appIdValid: true, secretValid: true, accessible: null },
    warning: "Format looks right. Meta can't confirm Instagram App IDs in advance — we'll verify automatically when you connect in Step 3.",
  });
});

// Onboarding progress (server-side so leaving for Meta/Instagram resumes exactly).
app.get("/onboarding", requireUser, async (c) => {
  const user = c.get("user");
  const db = getDb(c.env);
  const { users, onboardingState } = await import("@ig-autodm/db");
  const [u] = await db.select().from(users).where(eq(users.supabaseUserId, user.id));
  if (!u) return c.json({ step: 1, checks: {} });
  const [s] = await db.select().from(onboardingState).where(eq(onboardingState.userId, u.id));
  let checks: Record<string, boolean> = {};
  try {
    checks = JSON.parse(s?.checks ?? "{}");
  } catch {
    checks = {};
  }
  return c.json({ step: s?.step ?? 1, checks });
});

app.put("/onboarding", requireUser, async (c) => {
  const b = await c.req.json().catch(() => ({}));
  const user = c.get("user");
  const db = getDb(c.env);
  const { users, onboardingState } = await import("@ig-autodm/db");
  await db.insert(users).values({ supabaseUserId: user.id, createdAt: new Date() }).onConflictDoNothing();
  const [u] = await db.select().from(users).where(eq(users.supabaseUserId, user.id));
  const step = Math.min(3, Math.max(1, Number(b.step) || 1));
  const incoming = b.checks && typeof b.checks === "object" ? b.checks : {};
  const [s] = await db.select().from(onboardingState).where(eq(onboardingState.userId, u.id));
  let checks: Record<string, boolean> = {};
  try {
    checks = JSON.parse(s?.checks ?? "{}");
  } catch {
    checks = {};
  }
  for (const [k, v] of Object.entries(incoming)) {
    if (typeof v === "boolean" && /^[a-zA-Z0-9_]{1,40}$/.test(k)) checks[k] = v;
  }
  const row = { userId: u.id, step, checks: JSON.stringify(checks), updatedAt: new Date() };
  if (s) {
    await db.update(onboardingState).set({ step, checks: row.checks, updatedAt: row.updatedAt }).where(eq(onboardingState.id, s.id));
  } else {
    await db.insert(onboardingState).values(row);
  }
  return c.json({ ok: true, step, checks });
});

// Connect Instagram — BYOK only: every user connects through their own Meta app.
// Returns the Meta dialog URL; dashboard navigates there (token stays in header).
app.get("/connect/meta", requireUser, requireEnv, async (c) => {
  const user = c.get("user");
  const b = await userByok(c);
  if (!b) return c.json({ error: "save your App ID + Secret in Advanced first" }, 400);
  const state = await makeState(user.id, c.env.META_APP_SECRET, true);
  return c.json({ url: oauthStartUrl(b.appId, redirectUri(c), state) });
});

app.get("/connect/meta/callback", requireEnv, async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state") ?? "";
  const verified = await verifyState(state, c.env.META_APP_SECRET);
  if (!code || !verified) {
    return c.redirect(`${c.env.WEB_BASE}/dashboard?connect=error`, 302);
  }
  const supabaseUserId = verified.userId;
  if (!verified.byok) {
    return c.redirect(`${c.env.WEB_BASE}/dashboard?connect=error&detail=${encodeURIComponent("reconnect from the dashboard using your own app")}`, 302);
  }
  try {
    // Exchange against the user's own app (BYOK-only platform).
    let appId: string;
    let appSecret: string;
    {
      const db0 = getDb(c.env);
      const { users: u0, byokCredentials: b0 } = await import("@ig-autodm/db");
      const [uu] = await db0.select().from(u0).where(eq(u0.supabaseUserId, supabaseUserId));
      const [bb] = uu
        ? await db0.select().from(b0).where(eq(b0.userId, uu.id))
        : [];
      if (!bb) throw new Error("BYOK credentials missing — save them and retry");
      const key = (c.env as Bindings).ENCRYPTION_KEY;
      appId = await decryptToken(bb.igAppIdEnc, key);
      appSecret = await decryptToken(bb.igAppSecretEnc, key);
    }
    const { shortToken, igUserId } = await exchangeCode(code, appId, appSecret, redirectUri(c));
    // Long-lived exchange may be disabled on fresh apps; fall back to the
    // 1-hour short token (honest expiry) so connection + testing unblock.
    let long = shortToken;
    let expiresIn = 3300;
    try {
      const ll = await toLongLived(shortToken, appId, appSecret);
      long = ll.token;
      expiresIn = ll.expiresIn;
    } catch (e) {
      console.error("long-lived exchange unavailable, using short token:", (e as Error).message);
    }
    const profile = await getProfile(long);
    const db = getDb(c.env);
    const { users, igAccounts } = await import("@ig-autodm/db");
    await db.insert(users).values({ supabaseUserId, createdAt: new Date() }).onConflictDoNothing();
    const [user] = await db.select().from(users).where(eq(users.supabaseUserId, supabaseUserId));
    const enc = await encryptToken(long, c.env.ENCRYPTION_KEY);
    const expires = new Date(Date.now() + expiresIn * 1000);
    // One row per IG account: reconnect refreshes, new IG inserts (multi-account safe).
    const gid = profile.igUserId || igUserId;
    const [existing] = await db.select().from(igAccounts).where(eq(igAccounts.igUserId, gid));
    if (existing) {
      await db
        .update(igAccounts)
        .set({ userId: user.id, username: profile.username, tokenEnc: enc, tokenExpires: expires, viaByok: verified.byok })
        .where(eq(igAccounts.id, existing.id));
    } else {
      await db.insert(igAccounts).values({
        userId: user.id,
        igUserId: gid,
        pageId: null,
        username: profile.username,
        tokenEnc: enc,
        tokenExpires: expires,
        viaByok: verified.byok,
      });
    }
    return c.redirect(`${c.env.WEB_BASE}/dashboard?connected=1`, 302);
  } catch (e) {
    console.error("connect failed:", e);
    const detail = encodeURIComponent(String((e as Error)?.message ?? e).slice(0, 140));
    return c.redirect(`${c.env.WEB_BASE}/dashboard?connect=error&detail=${detail}`, 302);
  }
});

app.get("/accounts", requireUser, async (c) => {
  const user = c.get("user");
  const db = getDb(c.env);
  const { users, igAccounts } = await import("@ig-autodm/db");
  const [u] = await db.select().from(users).where(eq(users.supabaseUserId, user.id));
  if (!u) return c.json({ accounts: [] });
  const rows = await db.select().from(igAccounts).where(eq(igAccounts.userId, u.id));
  return c.json({ accounts: rows.map((r) => ({ igUserId: r.igUserId, username: r.username, keyword: r.keyword, dmEnabled: r.dmEnabled, replyEnabled: r.replyEnabled, tokenExpires: r.tokenExpires ? new Date(toMs(r.tokenExpires as any)).toISOString() : null, defaultCommentReply: r.defaultCommentReply, defaultDmText: r.defaultDmText, viaByok: !!r.viaByok })) });
});

// Disconnect: remove tokens, settings, cache, and logs for one owned account.
app.post("/accounts/:igUserId/disconnect", requireUser, async (c) => {
  const acct = await ownedAccount(c, c.req.param("igUserId"));
  if (!acct) return c.json({ error: "unknown account" }, 404);
  const db = getDb(c.env);
  const { igAccounts, mediaConfigs, mediaCache, commentLogs } = await import("@ig-autodm/db");
  await db.delete(mediaConfigs).where(eq(mediaConfigs.accountId, acct.id));
  await db.delete(mediaCache).where(eq(mediaCache.accountId, acct.id));
  await db.delete(commentLogs).where(eq(commentLogs.accountId, acct.id));
  await db.delete(igAccounts).where(eq(igAccounts.id, acct.id));
  return c.json({ ok: true });
});

// --- Dashboard stats (step 6) ---
app.get("/stats", requireUser, async (c) => {
  const user = c.get("user");
  const db = getDb(c.env);
  const { users, igAccounts, mediaConfigs, commentLogs } = await import("@ig-autodm/db");
  const empty = { connectedAccounts: 0, activeConfigs: 0, dmsSent7d: 0, repliesSent7d: 0 };
  const [u] = await db.select().from(users).where(eq(users.supabaseUserId, user.id));
  if (!u) return c.json(empty);
  const accts = await db.select().from(igAccounts).where(eq(igAccounts.userId, u.id));
  const ids = accts.map((a) => a.id);
  const overrides = ids.length
    ? await db.select({ id: mediaConfigs.id }).from(mediaConfigs).where(inArray(mediaConfigs.accountId, ids))
    : [];
  let dms = 0;
  let replies = 0;
  if (ids.length) {
    const weekAgo = new Date(Date.now() - 7 * 86400_000);
    const rows = await db
      .select({ action: commentLogs.action })
      .from(commentLogs)
      .where(
        and(inArray(commentLogs.accountId, ids), eq(commentLogs.status, "sent"), gt(commentLogs.createdAt, weekAgo)),
      );
    for (const r of rows) {
      if (r.action === "private_reply") dms++;
      else if (r.action === "comment_reply") replies++;
    }
  }
  const withDefaults = accts.filter(
    (a) => (a.replyEnabled && a.defaultCommentReply) || (a.dmEnabled && a.defaultDmText),
  ).length;
  return c.json({
    connectedAccounts: accts.length,
    activeConfigs: overrides.length + withDefaults,
    dmsSent7d: dms,
    repliesSent7d: replies,
  });
});

// --- Per-video configs (step 6) ---

// List recent media with cached thumbnails + existing overrides.
app.get("/media", requireUser, async (c) => {
  const igUserId = c.req.query("account") ?? "";
  const acct = await ownedAccount(c, igUserId);
  if (!acct) return c.json({ error: "unknown account" }, 404);
  const db = getDb(c.env);
  const { mediaConfigs, mediaCache, commentLogs, links, clicks } = await import("@ig-autodm/db");
  const token = await decryptToken(acct.tokenEnc, (c.env as Bindings).ENCRYPTION_KEY);
  const items = await listMedia(token, acct.igUserId);
  const statRows = await db
    .select({ mediaId: commentLogs.mediaId, action: commentLogs.action, n: sql<number>`count(*)` })
    .from(commentLogs)
    .where(and(eq(commentLogs.accountId, acct.id), eq(commentLogs.status, "sent")))
    .groupBy(commentLogs.mediaId, commentLogs.action);
  const byMedia: Record<string, { replies: number; dms: number }> = {};
  for (const r of statRows) {
    const k = r.mediaId ?? "";
    byMedia[k] = byMedia[k] ?? { replies: 0, dms: 0 };
    if (r.action === "comment_reply") byMedia[k].replies += Number(r.n);
    else if (r.action === "private_reply") byMedia[k].dms += Number(r.n);
  }
  const out: any[] = [];
  for (const m of items) {
    const thumb = m.thumbnailUrl ?? m.mediaUrl;
    const cached =
      (await cacheThumbnail((c.env as Bindings).CLOUDINARY_URL, thumb, `ig_${acct.id}_${m.id}`)) ?? thumb;
    await db
      .insert(mediaCache)
      .values({ accountId: acct.id, mediaId: m.id, caption: m.caption?.slice(0, 300), thumbnailUrl: cached, permalink: m.permalink })
      .catch(() => {});
    const [cfg] = await db
      .select()
      .from(mediaConfigs)
      .where(and(eq(mediaConfigs.accountId, acct.id), eq(mediaConfigs.mediaId, m.id)));
    out.push({
      mediaId: m.id,
      caption: m.caption,
      mediaType: m.mediaType,
      thumbnailUrl: cached,
      permalink: m.permalink,
      timestamp: m.timestamp,
      stats: byMedia[m.id] ?? { replies: 0, dms: 0 },
      config: cfg
        ? {
            commentReply: cfg.commentReply, dmText: cfg.dmText, dmEnabled: cfg.dmEnabled,
            replyEnabled: cfg.replyEnabled, keyword: cfg.keyword,
            linkUrl: cfg.linkUrl, followGate: cfg.followGate, linkTrack: cfg.linkTrack,
          }
        : null,
    });
  }
  // Attach tracked-link click counts (one extra query per media with a config).
  for (const item of out) {
    if (!item.config?.linkUrl) {
      item.clicks = 0;
      continue;
    }
    const [lnk] = await db
      .select({ id: links.id })
      .from(links)
      .where(and(eq(links.accountId, acct.id), eq(links.target, item.config.linkUrl)));
    if (!lnk) {
      item.clicks = 0;
      continue;
    }
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)` })
      .from(clicks)
      .where(eq(clicks.linkId, lnk.id));
    item.clicks = Number(n);
  }
  return c.json({ media: out });
});

// Update account-level defaults.
app.put("/accounts/:igUserId/defaults", requireUser, async (c) => {
  const acct = await ownedAccount(c, c.req.param("igUserId"));
  if (!acct) return c.json({ error: "unknown account" }, 404);
  const b = await c.req.json().catch(() => ({}));
  const db = getDb(c.env);
  const { igAccounts } = await import("@ig-autodm/db");
  const patch: Record<string, unknown> = {};
  for (const k of ["defaultCommentReply", "defaultDmText", "keyword"] as const) {
    if (k in b) patch[k] = b[k] ?? null;
  }
  for (const k of ["dmEnabled", "replyEnabled"] as const) {
    if (k in b) patch[k] = !!b[k];
  }
  if (Object.keys(patch).length) {
    await db.update(igAccounts).set(patch).where(eq(igAccounts.id, acct.id));
  }
  return c.json({ ok: true });
});

// Create/update a per-video override (null field = fall back to account default).
// {clear:true} deletes the override entirely.
app.put("/media-config", requireUser, async (c) => {
  const b = await c.req.json().catch(() => ({}));
  if (!b?.igUserId || !b?.mediaId) return c.json({ error: "igUserId + mediaId required" }, 400);
  const acct = await ownedAccount(c, b.igUserId);
  if (!acct) return c.json({ error: "unknown account" }, 404);
  const db = getDb(c.env);
  const { mediaConfigs } = await import("@ig-autodm/db");
  const where = and(eq(mediaConfigs.accountId, acct.id), eq(mediaConfigs.mediaId, b.mediaId));
  if (b.clear) {
    await db.delete(mediaConfigs).where(where);
    return c.json({ ok: true, cleared: true });
  }
  const patch: Record<string, unknown> = {};
  for (const k of ["commentReply", "dmText", "keyword", "linkUrl"] as const) {
    if (k in b) patch[k] = b[k] ?? null;
  }
  for (const k of ["dmEnabled", "replyEnabled"] as const) {
    if (k in b) patch[k] = b[k] === null ? null : !!b[k];
  }
  if ("followGate" in b) patch.followGate = b.followGate === null ? null : !!b.followGate;
  if ("linkTrack" in b) patch.linkTrack = b.linkTrack === null ? null : !!b.linkTrack;
  const [existing] = await db.select().from(mediaConfigs).where(where);
  if (existing) {
    if (Object.keys(patch).length) await db.update(mediaConfigs).set(patch).where(eq(mediaConfigs.id, existing.id));
  } else {
    await db.insert(mediaConfigs).values({ accountId: acct.id, mediaId: b.mediaId, ...patch });
  }
  return c.json({ ok: true });
});

// Inbound DM handling: resolves open follow-gates. Fail-open throughout:
// unknown follow status still delivers — a real follower is never trapped.
async function handleInboundDm(db: any, env: Bindings, acct: any, ev: CommentEvent) {
  const schema = await import("@ig-autodm/db");
  const { gateWaits } = schema;
  const { log, claim, finalize } = eventLogger(db, schema, ev);
  const senderId = ev.commenterId ?? "";
  if (!senderId) return;
  // Dedupe Meta's webhook retries: same message id processes exactly once.
  const inboundClaim = await claim("inbound_dm", acct.id);
  if (!inboundClaim) return;
  await finalize(inboundClaim, "received");
  const text = ev.text ?? "";
  const postback = text.match(/\[postback:([^\]]+)\]/)?.[1] ?? "";
  const clean = text.replace(/\[postback:[^\]]+\]\s*/, "").trim();
  const confirmed = postback === "GATE_DONE" || /^(done|yes|y|ok|okay|i followed|followed)$/i.test(clean);
  const waits = await db.select().from(gateWaits).where(eq(gateWaits.accountId, acct.id));
  const fresh = waits.filter((w: any) => Date.now() - toMs(w.createdAt) < 7 * 86400_000);
  const match =
    fresh.find((w: any) => w.igsid && w.igsid === senderId) ??
    fresh.sort((a: any, b: any) => b.id - a.id)[0];
  if (!match || !confirmed) return; // plain chat, or still waiting on them
  const token = await decryptToken(acct.tokenEnc, env.ENCRYPTION_KEY);
  // Prefer the wait's comment-scope ID (profile-readable); the inbound sender
  // ID lives in a different scope Meta won't resolve. Falls back to sender.
  const checkId = (match.igsid || senderId) ?? "";
  const follows = checkId ? await getFollowStatus(token, checkId) : null;
  if (follows === false && (match.attempts ?? 0) < 1) {
    // Step 2: now the button appears — tap it after following.
    // A second failure delivers anyway (Meta follow data lags; never loop forever).
    await sendDirectDm(
      token, acct.igUserId, senderId,
      `Tap below once you've followed @${acct.username} 👇`,
      [{ title: "☑ I am following", payload: "GATE_DONE" }],
    );
    await db.update(gateWaits).set({ attempts: (match.attempts ?? 0) + 1 }).where(eq(gateWaits.id, match.id));
    await log("gate_prompt", "sent", undefined, acct.id);
    return;
  }
  const claimId = await claim("private_reply", acct.id);
  if (!claimId) return; // duplicate delivery already handled
  try {
    await sendDirectDm(token, acct.igUserId, senderId, match.dmText ?? "Here's your link!");
    await db.delete(gateWaits).where(eq(gateWaits.id, match.id));
    await finalize(claimId, "sent");
  } catch (e) {
    await finalize(claimId, "failed", String((e as Error)?.message ?? e).slice(0, 200));
  }
}

// DB timestamps are stored as SECONDS (driver); normalize to ms for all date math.
const toMs = (v: unknown): number => {
  const ms = v instanceof Date ? v.getTime() : typeof v === "number" ? v : new Date(v as any).getTime();
  return ms < 1e12 ? ms * 1000 : ms;
};
const isConflict = (e: unknown) => /unique|constraint/i.test(String((e as Error)?.message ?? e));

// Stable per-commenter identity for cooldowns: numeric ID when present,
// otherwise namespaced username (poller events carry no author ID).
const commenterIdentity = (ev: CommentEvent): string =>
  ev.commenterId || (ev.commenterUsername ? `u:${ev.commenterUsername.toLowerCase()}` : "");

// Per-event log helpers shared by comment + inbound paths.
// log() is idempotent (UNIQUE conflict = silent). claim()/finalize() ensure
// only one worker sends per (comment, action); stale claims (>10 min) reclaimed.
function eventLogger(db: any, schema: any, ev: CommentEvent) {
  const { commentLogs } = schema;
  const who = commenterIdentity(ev);
  const log = async (action: string, status: string, error?: string, accountId?: number) => {
    await db.insert(commentLogs).values({
      accountId: accountId ?? null,
      mediaId: ev.mediaId,
      commentId: ev.commentId,
      commenterId: ev.commenterId,
      commenter: who || null,
      action,
      status,
      error,
      createdAt: new Date(),
    }).catch(() => {});
  };
  const claim = async (action: string, accountId: number): Promise<number | null> => {
    try {
      const [row] = await db.insert(commentLogs).values({
        accountId,
        mediaId: ev.mediaId,
        commentId: ev.commentId,
        commenterId: ev.commenterId,
        commenter: who || null,
        action,
        status: "sending",
        createdAt: new Date(),
      }).returning({ id: commentLogs.id });
      if (row?.id) return row.id;
    } catch (e) {
      if (!isConflict(e)) console.error("claim insert failed:", (e as Error).message);
    }
    try {
      const [row] = await db.select().from(commentLogs).where(and(eq(commentLogs.commentId, ev.commentId), eq(commentLogs.action, action)));
      if (row && row.status === "sending" && Date.now() - toMs(row.createdAt as any) > 10 * 60_000) {
        await db.delete(commentLogs).where(eq(commentLogs.id, row.id));
        return claim(action, accountId);
      }
    } catch {
      /* fall through → treated as duplicate */
    }
    return null;
  };
  const finalize = async (id: number, status: string, error?: string) => {
    await db.update(commentLogs).set({ status, error }).where(eq(commentLogs.id, id)).catch(() => {});
  };
  return { log, claim, finalize };
}

// Shared event processor: used by the queue (webhooks) and the poller (cron).
// ponytail: full account+media scan every poll; per-account state if accounts scale.
async function processCommentEvent(db: any, env: Bindings, ev: CommentEvent) {
  const schema = await import("@ig-autodm/db");
  const { igAccounts, mediaConfigs, commentLogs, gateWaits } = schema;
  const { log, claim, finalize } = eventLogger(db, schema, ev);
  const sendPublicReply = async (acct: any, text: string) => {
    const token = await decryptToken(acct.tokenEnc, (env as Bindings).ENCRYPTION_KEY);
    await postCommentReply(token, ev.commentId, renderTemplate(text, { username: ev.commenterUsername }));
  };
  const sendDm = async (acct: any, text: string) => {
    const token = await decryptToken(acct.tokenEnc, (env as Bindings).ENCRYPTION_KEY);
    await sendPrivateReply(token, acct.igUserId, ev.commentId, renderTemplate(text, { username: ev.commenterUsername }));
  };
  const hourlyCapOk = async (accountId: number) => {    const hourAgo = new Date(Date.now() - 3600_000);
    const recent = await db
      .select({ id: commentLogs.id })
      .from(commentLogs)
      .where(
        and(
          eq(commentLogs.accountId, accountId),
          eq(commentLogs.action, "private_reply"),
          eq(commentLogs.status, "sent"),
          gt(commentLogs.createdAt, hourAgo),
        ),
      );
    return recent.length < 180;
  };
  // Per-user DM cooldown: same commenter doesn't get a second DM within the
  // window (default 60 min, DM_COOLDOWN_MIN=0 disables). Public replies still send.
  const inCooldown = async (accountId: number): Promise<boolean> => {
    const mins = Number((env as Bindings).DM_COOLDOWN_MIN ?? 60);
    const who = commenterIdentity(ev);
    if (!who || !(mins > 0)) return false;
    const since = new Date(Date.now() - mins * 60_000);
    const rows = await db
      .select({ id: commentLogs.id })
      .from(commentLogs)
      .where(
        and(
          eq(commentLogs.accountId, accountId),
          eq(commentLogs.action, "private_reply"),
          eq(commentLogs.status, "sent"),
          eq(commentLogs.commenter, who),
          gt(commentLogs.createdAt, since),
        ),
      );
    return rows.length > 0;
  };
  const shortBase = () =>
    (env as Bindings).OAUTH_BASE_URL || "https://ig-autodm-api.admingamergully.workers.dev";
  try {
    const [acct] = await db.select().from(igAccounts).where(eq(igAccounts.igUserId, ev.igUserId));
    if (!acct) {
      console.log("event: no account for", ev.igUserId);
      await log("comment_reply", "skipped", `unknown account ${ev.igUserId}`);
      return;
    }
    // Inbound DMs (gate confirmations) route here; comment events continue below.
    if (ev.commentId.startsWith("dm:")) {
      await handleInboundDm(db, env as Bindings, acct, ev);
      return;
    }
    // Learn comment-scope ID mapping (comment from.ids ARE profile-readable,
    // unlike messaging sender IDs). Powers the follower pre-check + poller path.
    if (ev.commenterId && ev.commenterUsername) {
      try {
        const { knownUsers } = await import("@ig-autodm/db");
        const uname = ev.commenterUsername.toLowerCase();
        const [ex] = await db.select().from(knownUsers).where(and(eq(knownUsers.accountId, acct.id), eq(knownUsers.usernameLower, uname)));
        if (ex) {
          if (ex.igsid !== ev.commenterId) {
            await db.update(knownUsers).set({ igsid: ev.commenterId, checkedAt: new Date() }).where(eq(knownUsers.id, ex.id));
          }
        } else {
          await db.insert(knownUsers).values({ accountId: acct.id, usernameLower: uname, igsid: ev.commenterId, follows: null, checkedAt: new Date() }).catch(() => {});
        }
      } catch {
        /* best effort */
      }
    }
        let keyword = acct.keyword;
        let reply = acct.defaultCommentReply;
        let replyOn = acct.replyEnabled ?? true;
        let dm = acct.defaultDmText;
        let dmOn = acct.dmEnabled ?? false;
        let linkUrl: string | null = null;
        let gateOn = false;
        let linkTrack = true;
        if (ev.mediaId) {
          const [m] = await db
            .select()
            .from(mediaConfigs)
            .where(and(eq(mediaConfigs.accountId, acct.id), eq(mediaConfigs.mediaId, ev.mediaId)));
          if (m) {
            // Override row = complete per-post config: null text = off (no fallback).
            keyword = m.keyword ?? keyword;
            reply = m.commentReply;
            replyOn = m.replyEnabled ?? !!m.commentReply;
            dm = m.dmText;
            dmOn = m.dmEnabled ?? !!m.dmText;
            linkUrl = m.linkUrl ?? null;
            gateOn = m.followGate ?? false;
            linkTrack = m.linkTrack ?? false;
          }
        }
        const self =
          !!ev.commenterUsername &&
          !!acct.username &&
          ev.commenterUsername.toLowerCase() === acct.username.toLowerCase();
        const kwOk = keywordMatches(ev.text, keyword);
        // --- public reply path
        if (self) {
          await log("comment_reply", "skipped", "self-comment", acct.id);
        } else if (!replyOn || !reply) {
          await log("comment_reply", "skipped", "reply disabled/empty", acct.id);
        } else if (!kwOk) {
          await log("comment_reply", "skipped", "keyword miss", acct.id);
        } else {
          const claimId = await claim("comment_reply", acct.id);
          if (claimId) {
            try {
              await sendPublicReply(acct, reply);
              await finalize(claimId, "sent");
            } catch (e) {
              await finalize(claimId, "failed", String((e as Error)?.message ?? e).slice(0, 200));
            }
          }
          // silent when claimed elsewhere: duplicate delivery
        }
        // --- private reply (DM) path
        // Resolve tracked link first (shared by direct + gate delivery).
        const { links: linksTbl } = await import("@ig-autodm/db");
        let shortUrl: string | null = null;
        let linkCode: string | null = null;
        if (linkUrl && dm) {
          if (linkTrack) {
            try {
              const link = await ensureLink(db, { links: linksTbl }, acct.id, ev.mediaId, linkUrl);
              linkCode = link.code;
              shortUrl = `${shortBase()}/r/${link.code}`;
            } catch (e) {
              console.error("link mint failed, sending raw URL:", (e as Error).message);
              shortUrl = linkUrl; // degrade: untracked raw link rather than no DM
            }
          } else {
            shortUrl = linkUrl; // direct mode: recipient sees the real URL, no click counted
          }
        }
        const dmFinal = dm ? renderTemplate(renderLink(dm, shortUrl), { username: ev.commenterUsername }) : null;
        if (!dmOn || !dmFinal) {
          await log("private_reply", "skipped", "dm disabled/empty", acct.id);
        } else if (self) {
          await log("private_reply", "skipped", "self-comment", acct.id);
        } else if (!kwOk) {
          await log("private_reply", "skipped", "keyword miss", acct.id);
        } else if (await inCooldown(acct.id)) {
          await log("private_reply", "skipped", "cooldown", acct.id);
        } else if (!(await hourlyCapOk(acct.id))) {
          await log("private_reply", "skipped", "hourly rate cap", acct.id);
        } else if (gateOn) {
          // Followers skip the gate entirely: best-effort status check first.
          // Unknown/error simply falls through to the normal gate flow below.
          let gateToken: string | null = null;
          try {
            gateToken = await decryptToken(acct.tokenEnc, (env as Bindings).ENCRYPTION_KEY);
          } catch (e) {
            await log("gate_prompt", "failed", "token decrypt failed", acct.id);
          }
          let followsNow: boolean | null = null;
          // Poller comments carry no author ID — resolve via learned username mapping.
          let checkId: string | null = ev.commenterId ?? null;
          if (!checkId && ev.commenterUsername) {
            try {
              const { knownUsers } = await import("@ig-autodm/db");
              const [known] = await db.select().from(knownUsers).where(and(eq(knownUsers.accountId, acct.id), eq(knownUsers.usernameLower, ev.commenterUsername.toLowerCase())));
              if (known) checkId = known.igsid;
            } catch {
              /* fall through to gate */
            }
          }
          if (gateToken && checkId) {
            try {
              followsNow = await getFollowStatus(gateToken, checkId);
            } catch {
              followsNow = null;
            }
          }
          if (gateToken && followsNow === true) {
            const claimId = await claim("private_reply", acct.id);
            if (claimId) {
              try {
                await sendDm(acct, dmFinal);
                await finalize(claimId, "sent");
              } catch (e) {
                await finalize(claimId, "failed", String((e as Error)?.message ?? e).slice(0, 200));
              }
            }
            // silent when claimed elsewhere: duplicate delivery
          } else {
            // Follow gate: claim the prompt via wait row FIRST (dedupes races),
            // then send. Send failure deletes the wait so a later cycle retries.
            // Match includes media + 7-day age so one stale wait can't block a post.
            const SEVEN_D = 7 * 86400_000;
            const [open] = await db
              .select()
              .from(gateWaits)
              .where(
                and(
                  eq(gateWaits.accountId, acct.id),
                  eq(gateWaits.igsid, ev.commenterId ?? ""),
                  eq(gateWaits.mediaId, ev.mediaId ?? ""),
                ),
              );
          const openFresh = open && Date.now() - toMs(open.createdAt) < SEVEN_D ? open : null;
          if (openFresh) {
            await log("gate_prompt", "skipped", "already prompted", acct.id);
          } else if (await inCooldown(acct.id)) {
            await log("gate_prompt", "skipped", "cooldown", acct.id);
          } else {
              let prompted = false;
              try {
                await db.insert(gateWaits).values({
                  accountId: acct.id,
                  igsid: ev.commenterId ?? "",
                  mediaId: ev.mediaId ?? "",
                  linkCode,
                  dmText: dmFinal,
                  createdAt: new Date(),
                });
                prompted = true;
              } catch (e) {
                if (!isConflict(e)) throw e;
                await log("gate_prompt", "skipped", "already prompted", acct.id);
              }
              if (prompted) {
                try {
                  const token = gateToken ?? await decryptToken(acct.tokenEnc, (env as Bindings).ENCRYPTION_KEY);
                  // Step 1: plain-text prompt (no button yet) — button arrives at step 2.
                  // Neutral wording: follow status is unknowable until they message us.
                  const prompt = `Hey ${ev.commenterUsername ? `@${ev.commenterUsername}` : "there"}! This link is for followers \u2014 hit follow @${acct.username}, then reply DONE here and I'll send it right over.`;
                  await sendPrivateReply(token, acct.igUserId, ev.commentId, prompt);
                  await log("gate_prompt", "sent", undefined, acct.id);
                } catch (e) {
                  await db.delete(gateWaits).where(and(eq(gateWaits.accountId, acct.id), eq(gateWaits.igsid, ev.commenterId ?? ""), eq(gateWaits.mediaId, ev.mediaId ?? "")));
                  await log("gate_prompt", "failed", String((e as Error)?.message ?? e).slice(0, 200), acct.id);
                }
              }
            }
          }
        } else {
          const claimId = await claim("private_reply", acct.id);
          if (claimId) {
            try {
              await sendDm(acct, dmFinal);
              await finalize(claimId, "sent");
            } catch (e) {
              await finalize(claimId, "failed", String((e as Error)?.message ?? e).slice(0, 200));
            }
          }
          // silent when claimed elsewhere: duplicate delivery
        }
  } catch (e) {
    console.error("event failed:", ev.commentId, (e as Error).message);
    await log("comment_reply", "failed", String((e as Error)?.message ?? e).slice(0, 200));
  }
}

export default {
  fetch: app.fetch,
  // Webhook path (Live apps).
  async queue(batch: MessageBatch<CommentEvent>, env: Bindings) {
    const db = getDb(env);
    for (const msg of batch.messages) {
      await processCommentEvent(db, env, msg.body);
      msg.ack();
    }
  },
  // Polling fallback (dev/BYOK apps never get webhooks): sweep comments on
  // CONFIGURED posts only, every minute. Same processor, same dedup.
  async scheduled(_event: ScheduledEvent, env: Bindings) {
    const db = getDb(env);
    const { igAccounts, mediaConfigs } = await import("@ig-autodm/db");
    const { listComments } = await import("./meta");
    const rows = await db.select().from(igAccounts);
    for (const acct of rows) {
      try {
        // Master off + no configured posts = nothing to do.
        const cfgs = await db
          .select()
          .from(mediaConfigs)
          .where(eq(mediaConfigs.accountId, acct.id));
        if (!cfgs.length) continue;
        if (!acct.replyEnabled && !acct.dmEnabled) continue;
        const token = await decryptToken(acct.tokenEnc, (env as Bindings).ENCRYPTION_KEY);
        for (const cfg of cfgs.slice(0, 20)) {
          let comments: Awaited<ReturnType<typeof listComments>> = [];
          try {
            comments = await listComments(token, cfg.mediaId, 20);
          } catch (e) {
            console.error("poll: list comments failed:", cfg.mediaId, (e as Error).message);
            continue;
          }
          for (const c of comments) {
            const age = Date.now() - new Date(c.timestamp ?? 0).getTime();
            if (!c.timestamp || age < 0 || age > 75 * 60_000) continue;
            await processCommentEvent(db, env as Bindings, {
              igUserId: acct.igUserId,
              commentId: c.id,
              mediaId: cfg.mediaId,
              text: c.text,
              commenterUsername: c.username,
            });
          }
        }
      } catch (e) {
        console.error("poll failed:", acct.username, (e as Error).message);
      }
    }
  },
};
