# IG AutoDM

**Instagram Comment → DM SaaS Platform**

A full-stack Instagram automation platform that detects comments matching specific criteria and automatically sends direct messages in response.

## 🚀 Quick Links

- **Documentation**: [IG AutoDM Architecture PDF](IG_AutoDM_Architecture_Final.pdf)
- **Report**: [IG AutoDM Report](ig_autodm_report.pdf)
- **Tech Stack**: [techstack.md](techstack.md)
- **URL Config**: [urls.txt](urls.txt)
- **Live Demo**: Pending deployment

## 📦 Project Structure

```text
ig-autodm/
├── apps/
│   ├── api/           # Cloudflare Workers API (Hono framework)
│   ├── web/           # Astro frontend
│   └── web-react/     # React frontend
├── packages/
│   ├── db/            # Drizzle ORM & PostgreSQL (Turso)
│   └── shared/        # Shared utilities & types
├── appscreenshot/     # App screenshots
├── docs/              # Architecture diagrams
└── README.md          # You are here
```

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vite + React, Astro |
| **Backend** | Cloudflare Workers, Hono |
| **Database** | PostgreSQL (Turso) with Drizzle ORM |
| **Storage** | Cloudinary (media assets) |
| **Auth** | Instagram Graph API (Meta) |
| **UI** | Tailwind CSS |

## 📱 App Screenshot

![IG AutoDM Screenshot](appscreenshot/Screenshot_2026-10-29_00-27-47.png)

*App interface showing comment monitoring and DM automation*

## 🛠️ Development

```bash
# Install dependencies
npm install

# Development
npm run dev:api    # API server
npm run dev:web    # Web frontend

# Build
npm run build

# DB Migrations
npm run db:generate
npm run db:migrate
```

## 📄 License

MIT - Copyright (c) IG AutoDM Project
