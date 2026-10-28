# Tech Stack — Instagram Comment → DM SaaS

## Summary
Astro + Hono on Cloudflare, Supabase Auth (Facebook), Turso + Drizzle, Cloudflare Queues/KV/Cron, Cloudinary thumbnails, Meta Instagram Graph API.

**MVP cost: $0** (all free tiers).

## Stack table

| Layer | Choice | Purpose | Cost |
|---|---|---|---|
| Frontend | **Astro** (Cloudflare Pages / Workers Assets) | Landing, login, dashboard UI | free |
| API | **Hono** on Cloudflare Workers | REST API + Meta webhook receiver | free |
| App DB | **Turso** (libSQL) | users, IG accounts, media configs, logs | free |
| ORM | **Drizzle** | type-safe schema/queries over Turso | free |
| Auth | **Supabase Auth** — Facebook provider | “Continue with Facebook” SaaS login | free (50k MAU) |
| IG connection | **Meta OAuth** (Facebook Login for Business / IG Login) | separate “Connect Instagram” step; stores tokens | free |
| Queue | **Cloudflare Queues** | comment events → send worker (retry, rate-limit) | free |
| Sessions / OAuth state | **Cloudflare KV** | Supabase session helpers as needed, Meta OAuth state | free |
| Cron | **Workers Cron Triggers** | token refresh (~every 50 days) | free |
| Media | **Cloudinary** | IG post/reel **thumbnails only** (picker UI) | free |
| Messaging | **Instagram Graph API** | comment replies + private replies (DMs) | free |
| Webhooks | **Meta Webhooks** | `comments` field → your endpoint | free |

## Repo layout (monorepo, 2 deploys)

```
apps/
  web/          # Astro — landing, login, dashboard
  api/          # Hono Worker — /webhook/meta, /connect/*, /accounts, /media, /logs
packages/
  db/           # Drizzle schema + Turso client
  shared/       # types + Meta Graph helpers
```

- `web` → Cloudflare Pages (or Workers Assets)
- `api` → Cloudflare Workers (optional `api.*` subdomain)

## Auth design (Option B)

```
1. Continue with Facebook  → Supabase Auth session → dashboard
2. Dashboard → "Connect Instagram" → Meta OAuth
   scopes: instagram_basic, instagram_manage_comments,
           instagram_manage_messages, pages_show_list,
           pages_read_engagement, business_management (as needed)
   → callback → encrypt token → row in ig_accounts (Turso)
```

- Two Facebook clicks by design (login ≠ connect IG).
- Local `users.supabase_user_id` maps app data to Supabase identity.
- App issues its own protected routes via Supabase JWT verification (Hono middleware).

## Database schema (Turso / Drizzle)

```sql
users            -- id, supabase_user_id UNIQUE, created_at
ig_accounts      -- id, user_id FK, ig_user_id, page_id, username,
                 -- token_enc, token_expires,
                 -- default_comment_reply, default_dm_text,
                 -- dm_enabled, keyword
media_configs    -- id, account_id FK, media_id,
                 -- comment_reply, dm_text, dm_enabled, keyword
                 -- (NULL = fall back to account defaults)
comment_logs     -- id, account_id, media_id, comment_id, commenter_id,
                 -- action (comment_reply | private_reply),
                 -- status, error, created_at
media_cache      -- account_id, media_id, caption,
                 -- thumbnail_url (Cloudinary), permalink
```

## Request flows

### Webhook → actions
```
Meta POST /webhook/meta
  → verify hub.challenge (GET) + signature/verify token
  → parse changes[].value (comment_id, media_id, from, text)
  → enqueue job
Worker:
  → lookup ig_account by ig_user_id (from payload)
  → load media_configs[media_id] ?? account defaults
  → filters: self-comment, dedup comment_id, keyword match
  → comment reply on?  POST /{comment_id}/replies
  → DM on?             POST /{ig_user_id}/messages
                         recipient: { comment_id }
  → insert comment_logs
Rate cap: ~190 private replies/hour/account (queue overflow)
```

### Dashboard
```
Astro UI → Hono API (Supabase JWT) → Turso / Cloudinary
  - list connected accounts
  - list media (Graph API) + thumbnails (Cloudinary URL cached in media_cache)
  - upsert media_config / account defaults
  - read comment_logs
```

## Meta Graph API usage

| Action | Endpoint |
|---|---|
| Public comment reply | `POST /{ig_comment_id}/replies` |
| Private reply (DM) | `POST /{ig_user_id}/messages` with `recipient.comment_id` |
| List media | `GET /{ig_user_id}/media` |
| Long-lived token exchange | `GET /oauth/access_token` (grant_type=fb_exchange_token) |
| Token refresh | cron near day ~50 of ~60-day Page token |

Private reply rules: **1 per comment**, within **7 days**; not a true cold DM (Meta-compliant).

## Cloudinary scope
- Only cache/transform IG `media_thumbnail_url` (or fetch media_url) for the per-video picker.
- Store resulting Cloudinary URL on `media_cache.thumbnail_url`.
- No user uploads in MVP.

## Environment / secrets

### Cloudflare (wrangler)
- `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (or anon + JWKS for JWT verify)
- `META_APP_ID`, `META_APP_SECRET`, `WEBHOOK_VERIFY_TOKEN`
- `CLOUDINARY_URL` (cloud_name, api_key, api_secret)
- Queue + KV + cron bindings

### Turso
- App tables above (Drizzle migrations)

### Supabase
- Facebook OAuth provider enabled (app id/secret)
- Redirect URL → your deployed origin

### Meta App
- Products: Instagram Graph API, Webhooks, Messenger/Instagram Messaging
- Subscribe field: `comments`
- Callback URL → `https://<api>/webhook/meta`

## Reference repos (logic to port)
| Repo | Steal |
|---|---|
| [diwenne/openreply](https://github.com/diwenne/openreply) (or im-anishraj/instagram-comment-to-dm) | webhook verify, keyword match, private reply, rate limit, dedup, token refresh, META_APP_REVIEW.md |
| [finnick-oss/instabot](https://github.com/finnick-oss/instabot) | per-post config UX (post selector, toggles) |
| [LubomirGeorgiev/cloudflare-workers-nextjs-saas-template](https://github.com/LubomirGeorgiev/cloudflare-workers-nextjs-saas-template) | monorepo/deploy patterns (adapted to Astro+Hono) |
| [sakthi-byte/Instagram-Comment-Automation-Tutorial](https://github.com/sakthi-byte/Instagram-Comment-Automation-Tutorial) | Meta setup walkthrough |

## Explicitly not used
- n8n (single-account hack → wrong fit for multi-user SaaS)
- Postgres/Redis/Vercel/Railway from reference repos → mapped to Turso + CF Queues
- True cold DM / scraping / password bots (ToS + ban risk)
- Prisma (chose Drizzle for Turso)

## Build order
1. Scaffold monorepo: Astro + Hono + Drizzle/Turso → deploy stubs
2. Supabase FB auth + protected dashboard shell
3. Meta Connect Instagram OAuth → encrypt + store token
4. Webhook + Queue → public comment reply
5. Private reply (DM) + dedup + rate limit
6. Per-video config + Cloudinary thumbnails
7. Logs UI + token-refresh cron
8. Meta App Review submission

## Cost summary
| Item | MVP | Scale trigger |
|---|---|---|
| Cloudflare free tier | $0 | Workers Paid $5/mo if limits exceeded |
| Supabase free | $0 | paid plans after 50k MAU |
| Turso free | $0 | paid row/s limits |
| Cloudinary free | $0 | paid bandwidth |
| Meta API | $0 | — |
| **Total** | **~$0** | **$5–25/mo realistic early scale** |
