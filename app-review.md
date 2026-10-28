# App Review dossier — IG AutoDM (bruhh / bruhh-IG)
Goal: Advanced Access for 3 permissions → any Instagram Business/Creator user can OAuth-connect (no tester roles).

## 0. Ownership
| Task | Owner | Status |
|---|---|---|
| App settings: icon, category, contact email | YOU | icon done — confirm rest |
| Privacy URL → https://ig-autodm.pages.dev/privacy | YOU | TODO (dashboard) |
| Data deletion URL → https://ig-autodm.pages.dev/data-deletion | YOU | TODO (dashboard) |
| Business verification (business.facebook.com) | YOU | TODO — start first, slowest step |
| Webhook subscription: comments (+messages later) | YOU | callback configured |
| Test IG Business account for reviewers + credentials | YOU | TODO |
| Screencast recording (script §3) | YOU | TODO after 1–6 done |
| Submit review (3 permission requests) | YOU | TODO last |
| Working product, legal pages, disconnect, logs | DONE | this repo |

## 1. Permission use-cases (paste into each request, adapt tone as needed)

### instagram_business_basic
> IG AutoDM needs to read the connected account's profile, media list, and comments to function at all. On login we fetch the user's posts to show the per-video dashboard; on every comment webhook we read the comment text to match the user's trigger keyword. Without this scope the app cannot list posts or see comments. Demo: dashboard media grid loading + keyword match (screencast 0:00–0:40).

### instagram_business_manage_comments
> When a comment matches the user's trigger word, the app posts the public reply the user wrote (POST /{comment-id}/replies). This is the core feature: creators configure per-post reply texts in the dashboard; the app publishes them automatically. Replies are never generated content — always the user's own saved text. Demo: comment "LINK" on test post → public reply appears (screencast 0:40–1:20).

### instagram_business_manage_messages
> Same trigger also sends ONE private reply DM containing the user's saved message/link (POST /{ig-user-id}/messages with recipient.comment_id, within Meta's 7-day private-reply window, one per comment, deduped, ~180/hr cap). This is the comment-to-DM feature. No cold outreach: DMs only ever respond to the commenter's own comment. Demo: DM arrives in test inbox (screencast 1:20–2:00).

## 2. Data handling answers (standard questionnaire)
- Data collected: Supabase Auth identity (email); IG user ID, username, encrypted access token; user-written keywords/replies/DMs; send logs (status + error reasons).
- Why: solely to deliver configured comment replies + DMs and show dashboard/logs.
- Sharing: Meta (API calls on user's behalf only); Supabase (auth); Turso + Cloudflare (hosting). No sale, no ads, no third-party analytics on user content.
- Retention: tokens/configs kept while connected; logs for debugging; full deletion ≤30 days on request (self-serve Disconnect + email flow on /data-deletion).
- Security: tokens AES-GCM encrypted at rest, HTTPS everywhere, per-user scoping on all endpoints.

## 3. Screencast script (~2 min, record logged-in as test user)
1. (0:00) Dashboard: show connected test IG, automation ON.
2. (0:20) Open a test post, set keyword LINK + reply + DM, Save.
3. (0:45) From second account, comment "LINK please" on that post.
4. (1:00) Show public reply under comment + DM arriving in inbox (both phones/accounts visible).
5. (1:30) Dashboard logs/stats increment; toggle automation OFF; Disconnect button (mention data removal).
6. Narrate each Meta permission as it is exercised (basic → manage_comments → manage_messages).

## 4. Test credentials for reviewers
- Provide: Google test login (email+password) for the app + test IG Business account (username+password) with 1–2 public posts.
- Reviewer flow: login → Connect Instagram → approve OAuth → set per-post message → comment → verify reply + DM.
- Keep test accounts OUT of App Roles dependency: reviewers use their own test users; app must be submittable in dev state (it is).

## 5. Webhook proof
- Callback URL in dashboard, `comments` field subscribed; verification via hub.challenge (implemented, tested).
- Note: events only fire for connected accounts; reviewer test will trigger on their test post.

## 6. Common rejection reasons (pre-empted)
- Generic use-case text → ours names exact endpoints + user-visible behavior per permission.
- Missing data controls → Disconnect (deletes tokens/settings/history) + /data-deletion email flow, both live.
- Placeholder legal URLs → MUST swap facebook.com placeholders for live URLs before submit (§0).
- Screencast doesn't show permission in use → script maps each scope to a timestamp.
