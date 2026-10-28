# PRD — Instagram Comment → DM SaaS

Multi-user SaaS: connect Instagram, auto-reply to comments, and send comment-triggered DMs (Meta private replies), with per-video variants.

## Product overview
- Visitors sign up, connect their own Instagram (Professional) account, configure automation.
- When someone comments on their post/reel: optional public comment reply + optional DM (private reply).
- Per-video overrides (keyword, reply text, DM text, toggles) with account-level defaults.
- Dashboard: connected accounts, media picker, per-video config, send logs.

## Goals
- Multi-tenant SaaS you operate (not single-user tool).
- Fully Meta-compliant (official Graph API only — no scraping, no password bots).
- MVP at $0 infrastructure cost (free tiers).

## Core features (MVP)
1. **Auth** — “Continue with Facebook” via Supabase Auth (Option B: login and IG connect are separate steps).
2. **Connect Instagram** — Meta OAuth; store encrypted Page/IG tokens automatically (user never pastes IDs).
3. **Auto comment reply** — reply under each new comment (all comments or keyword-gated).
4. **Comment → DM** — private reply via `recipient.comment_id` (1 per comment, within 7 days); Meta-legal.
5. **Per-video variants** — per `media_id`: keyword, comment reply, DM text, DM on/off; fallback to account defaults.
6. **Media picker** — list posts/reels; thumbnails cached via Cloudinary.
7. **Logs** — every send/skip/fail with reason (status: queued/matched/sent/skipped/failed).

## Non-goals (MVP)
- True cold DM to strangers (blocked by Meta — not buildable via official API).
- Stripe billing / plans.
- Email/password login fallback.
- Follow-gate, tracked links, inbox (phase 2; port patterns from OpenReply later).

## User flows

### Creator onboarding
```
Land → Continue with Facebook (Supabase) → Dashboard
  → Connect Instagram (Meta OAuth)
  → tokens + ig_user_id + page_id auto-stored
  → pick post/reel → set keyword / reply / DM text → save
```

### Comment event
```
Commenter comments (e.g. "LINK")
  → Meta webhook → Hono /webhook/meta (verify challenge)
  → enqueue
  → worker: load account + media_config (fallback: account defaults)
  → skip if: self-comment, duplicate comment_id, keyword miss
  → if reply on:  POST /{comment_id}/replies
  → if DM on:     POST /{ig_user_id}/messages
                   recipient = { comment_id }   ← private reply
  → log to comment_logs
```

### How IDs work (no manual entry)
| Who | IDs |
|---|---|
| Creator | `ig_user_id`, `page_id` returned by OAuth → saved automatically |
| Commenter | only `comment_id` from webhook used → Meta routes the DM |

## User stories
- As a creator, I connect IG once and never paste IDs.
- As a creator, I set one default reply for my whole account.
- As a creator, I override reply/DM/keyword for a specific reel.
- As a commenter, I comment a keyword and receive the configured DM (if enabled).
- As a creator, I see logs of what was sent, skipped, or failed and why.

## Success metrics (early)
- Comment → reply delivered latency (target: seconds).
- Failed-send rate + top error reasons.
- % comments matching keyword → DM sent.
- Connected accounts / active configs.

## Constraints & compliance
- Instagram Business or Creator account linked to a Facebook Page required.
- Meta App Review needed before serving third-party users in production (dev mode OK for your own account).
- Rate cap ~190 private replies/hour/account (queue overflow, don’t drop).
- Token expiry: long-lived Page tokens ~60 days → cron refresh every ~50 days.
- Private reply: 1 per comment, within 7 days of comment.
- No cold outreach / scraping / browser bots (ban risk; also not in scope).

## Risks
- Meta App Review delay (7–30 days) before public launch.
- Webhook delivery gaps → optional polling sweep later (OpenReply pattern).
- Users with restrictive DM privacy never receive DMs (expected; rely on public reply fallback).
- Supabase Auth + Turso = two data stores (accepted for Option B).

## Release phases
1. Scaffold monorepo (Astro + Hono + Drizzle/Turso), deploy stubs.
2. Supabase FB login + protected dashboard shell.
3. Meta “Connect Instagram” OAuth → encrypted token store.
4. Webhook + Queue → public comment reply.
5. Private reply (DM) + dedup + rate limit.
6. Per-video config + Cloudinary thumbnails.
7. Logs UI + token-refresh cron.
8. Meta App Review (use OpenReply META_APP_REVIEW.md as checklist).

## Open questions / later
- Billing (Stripe) — phase 2.
- Follow-gate / click tracking / inbox — phase 2.
- Email/password fallback if Meta login breaks — keep env-based break-glass admin path.
