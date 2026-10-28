# IG AutoDM

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
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vite + React, Astro, Tailwind CSS |
| **Backend** | Cloudflare Workers, Hono framework |
| **Database** | PostgreSQL (Turso) with Drizzle ORM |
| **Storage** | Cloudinary (media asset management) |
| **Auth** | Instagram Graph API (Meta Developers) |
| **Deployment** | Cloudflare Workers (edge network) |

## 📱 App Screenshot

![IG AutoDM Interface](appscreenshot/Screenshot_2026-10-29_00-27-47.png)

*App interface showing comment monitoring and DM automation dashboard*

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/admingamergully-stack/ig-autodm.git
cd ig-autodm

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Configure: DATABASE_URL, INSTAGRAM_ACCESS_TOKEN, CLOUDINARY_URL, etc.

# Development
npm run dev:api    # API server (localhost Workers)
npm run dev:web    # Web frontend

# Build for production
npm run build

# DB Migrations
npm run db:generate
npm run db:migrate
```

## 📄 Documentation

- [Architecture Diagram](docs/IG_AutoDM_Architecture_Final.pdf) - 10-page system design
- [Full Report](ig_autodm_report.pdf) - Detailed analysis and findings
- [Tech Stack](techstack.md) - Detailed component breakdown
- [URL Configuration](urls.txt) - Route and endpoint mapping

## 🤝 Inspiration

This project draws inspiration from:

- **Hono.js** - Lightweight web framework for edge computing [hono.dev](https://hono.dev)
- **Turso** - Embedded relational database with remote support [turso.tech](https://turso.tech)
- **Cloudinary** - Cloud-native image and video management [cloudinary.com](https://cloudinary.com)
- **Instagram Graph API** - Official Instagram business automation API [developers.facebook.com](https://developers.facebook.com/docs/graph-api)

## 📫 Contact & Support

- **GitHub Issues**: Use the repository issue tracker
- **Discussions**: GitHub Discussions for questions
- **Email**: kaari@example.com (from project config)

## 📄 License

MIT License - Copyright (c) 2026 IG AutoDM Project
