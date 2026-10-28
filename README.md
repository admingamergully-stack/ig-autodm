# IG AutoDM

[https://ig-autodm.pages.dev](https://ig-autodm.pages.dev) | [https://ig-autodm.vercel.app](https://ig-autodm.vercel.app) | [GitHub Repository](https://github.com/admingamergully-stack/ig-autodm)

**Instagram Comment → DM SaaS Platform**

A full-stack Instagram automation platform that detects comments matching specific criteria and automatically sends direct messages in response.

## 🌟 Features

- **Comment Monitoring**: Real-time comment tracking via Instagram Graph API
- **Auto DM**: Automatically send direct messages to matching comments
- **Filtering**: Keyword, user, and engagement filters
- **Analytics**: Track DM delivery and engagement metrics
- **Multi-platform**: Cloudflare Workers for global edge deployment

## 📦 Project Structure

```text
ig-autodm/
├── apps/
│   ├── api/           # Cloudflare Workers API (Hono framework)
│   │   └── wrangler.jsonc  # Workers deployment config
│   ├── web/           # Astro frontend
│   └── web-react/     # React frontend (Vite)
├── packages/
│   ├── db/            # Drizzle ORM & PostgreSQL (Turso)
│   └── shared/        # Shared utilities & types
├── appscreenshot/     # App screenshots
│   └── Screenshot_2026-10-29_00-27-47.png
├── docs/              # Architecture diagrams
│   └── IG_AutoDM_Architecture_Final.pdf
└── README.md
