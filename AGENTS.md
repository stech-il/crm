# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is a Hebrew (RTL) CRM application built with Next.js 14 (App Router), Prisma ORM, and PostgreSQL. It allows admins to define dynamic entities and fields, then create records against those definitions.

### Services

| Service | How to run | Notes |
|---------|-----------|-------|
| PostgreSQL | `sudo service postgresql start` | Must be running before dev server or Prisma commands |
| Next.js dev server | `npm run dev` (port 3000) | Hot-reloads on file changes |

### Key commands

See `package.json` scripts. Summary:

- **Dev**: `npm run dev`
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **DB push**: `npx prisma db push`
- **DB seed**: `npm run db:seed`
- **DB studio**: `npm run db:studio` (Prisma GUI on port 5555)

### Dev environment caveats

- **`.npmrc`** has `legacy-peer-deps=true` — always use `npm install --legacy-peer-deps` or just `npm install` (the `.npmrc` handles it).
- **`.eslintrc.json`** was added to avoid the interactive ESLint prompt during `next lint` / `next build`. Two rules (`react/no-unescaped-entities`, `@next/next/no-assign-module-variable`) are downgraded to warnings due to pre-existing issues in the codebase.
- **`.env`** is required. Minimum variables: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`. See `.env.example` for full list. Cloudinary and SMTP are optional (file uploads and password reset emails won't work without them).
- **PostgreSQL** must be started before running the dev server (`sudo service postgresql start`). The database `crm` with user `crm_user` / password `crm_password` is used for local dev.
- **Seeded admin user**: `admin@crm.com` / `123456` (after running `npm run db:seed`).
- **`output: 'standalone'`** in `next.config.js` is for Render.com deployment. In dev mode (`npm run dev`), this setting is ignored and has no impact.
