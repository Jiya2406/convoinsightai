# ConvoInsight AI — Phase 3: Prisma Schema, Database & Authentication

> **Status:** Phase 3 of 9 — Project scaffold + Prisma schema + Neon PostgreSQL + NextAuth (Auth.js v5) + RBAC
> **Date:** 2026-07-02

---

## 1. What was built
- **Project scaffold:** Next.js 15 + TypeScript + Tailwind (shadcn tokens) config files.
- **Prisma schema:** all 16 tables (+ `PromptTestResult`) with enums, relations, indexes, constraints.
- **Prisma client singleton** with hot-reload safety.
- **Seed script** (idempotent): 3 roles, 3 demo users, 7 providers, HR assistant + versioned knowledge + governance rules.
- **Authentication:** Auth.js v5 (NextAuth) Credentials + JWT sessions.
- **RBAC:** permission matrix + `can()`/`assertCan()` guards + server-side session helpers.
- **Minimal login + protected dashboard** to verify auth end-to-end (polished UI comes in Phase 5).

## 2. Key decisions
| Decision | Why |
|---|---|
| **Auth.js v5 (next-auth@beta)** over v4 | v4 has peer-dependency conflicts with Next 15 / React 19; v5 targets App Router |
| **JWT sessions, no Prisma adapter** | Credentials + JWT don't need DB-stored sessions → no `Account/Session` tables → cleaner schema |
| **Server-side guards, no edge middleware** | Prisma/bcrypt can't run on the edge; guarding in the `(dashboard)` layout (Node runtime) is simpler and safe |
| **bcryptjs** over native bcrypt | Pure JS → no Windows build-tool headaches |

---

## 3. 🔑 MANUAL SETUP — Neon PostgreSQL (required before migrating)

**Why Neon?** We need a real PostgreSQL database. Neon is serverless Postgres with a free tier, works perfectly with Vercel, and gives you a connection string in ~2 minutes. No credit card required.

### Step-by-step
1. Go to **https://neon.tech** → click **Sign up** (use GitHub or Google — fastest).
2. On first login, Neon prompts **Create a project**:
   - **Project name:** `convoinsight-ai`
   - **Postgres version:** leave default (17).
   - **Region:** pick the one closest to you.
   - Click **Create project**.
3. You land on the project dashboard. A **Connection string** panel is shown.
   - Ensure the **Connection pooling** toggle is **ON** (recommended for serverless).
   - Click the **copy** icon. You'll get a string like:
     ```
     postgresql://convoinsight_owner:npg_XXXX@ep-cool-name-123456-pooler.us-east-2.aws.neon.tech/convoinsight?sslmode=require
     ```
4. In the project root, **create a file named `.env`** (copy from `.env.example`) and paste:
   ```env
   DATABASE_URL="postgresql://...paste the copied string..."
   ```
5. Generate the auth secret. In the project terminal run:
   ```bash
   npx auth secret
   ```
   This creates/updates `.env` with `AUTH_SECRET`. *(If it doesn't, run `openssl rand -base64 32` and paste it as `AUTH_SECRET="..."`.)*
6. Leave `GEMINI_API_KEY=""` for now (used in Phase 6). Keep `AI_PROVIDER="mock"`.

### Where to paste / what to copy — summary
| Value | Copy from | Paste into |
|---|---|---|
| `DATABASE_URL` | Neon connection-string panel (pooled) | `.env` |
| `AUTH_SECRET` | `npx auth secret` output | `.env` |

---

## 4. Run migrations + seed
With `.env` filled in, run these **in order** from the project root:

```bash
# 1. Create the tables in Neon from the Prisma schema
npx prisma migrate dev --name init

# 2. Populate demo data (roles, users, providers, HR assistant)
npm run db:seed

# 3. (Optional) Open a visual DB browser to confirm rows exist
npx prisma studio
```

---

## 5. ✔️ Verification checklist
1. **DB connection:** `npx prisma migrate dev --name init` completes without error and prints *"Your database is now in sync with your schema."*
2. **Seed:** `npm run db:seed` prints `✅ Seed complete.`
3. **Studio:** `npx prisma studio` → `User` table shows 3 users; `Provider` shows 7 (Mock + Gemini active).
4. **App boots:** `npm run dev` → open http://localhost:3000 → redirected to `/login`.
5. **Login works:** sign in with `admin@convoinsight.ai` / `Passw0rd!` → lands on `/dashboard` showing role **ADMIN** + 13 permissions.
6. **RBAC differs by role:** sign out, log in as `analyst@convoinsight.ai` / `Passw0rd!` → dashboard shows only 3 permissions.
7. **Route protection:** open http://localhost:3000/dashboard in a private window (logged out) → redirected to `/login`.

### Demo credentials (all password `Passw0rd!`)
| Email | Role | Permissions |
|---|---|---|
| admin@convoinsight.ai | ADMIN | all 13 |
| reviewer@convoinsight.ai | REVIEWER | 7 |
| analyst@convoinsight.ai | ANALYST | 3 |

---

## 6. ⚠️ Common errors & fixes
| Error | Cause | Fix |
|---|---|---|
| `Environment variable not found: DATABASE_URL` | `.env` missing/misnamed | Ensure file is `.env` (not `.env.txt`) in project root |
| `Can't reach database server` | Wrong/expired Neon string, or non-pooled | Re-copy the **pooled** string; keep `?sslmode=require` |
| `P1001` timeout | Neon project sleeping / region far | Retry (Neon wakes on connect); pick a closer region |
| `[auth][error] MissingSecret` | `AUTH_SECRET` not set | Run `npx auth secret` |
| Login always "Invalid" | Seed not run | Run `npm run db:seed` |
| `prisma#seed deprecated` warning | Prisma 6 notice | Harmless on v6; safe to ignore for the hackathon |

---

## 7. Files created this phase
```
convoinsight-ai/
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── tailwind.config.ts
├── .gitignore
├── .env.example
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── src/
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── (auth)/login/page.tsx
    │   ├── (dashboard)/
    │   │   ├── layout.tsx
    │   │   └── dashboard/
    │   │       ├── page.tsx
    │   │       └── sign-out-button.tsx
    │   └── api/auth/[...nextauth]/route.ts
    ├── lib/
    │   ├── db/prisma.ts
    │   ├── utils.ts
    │   └── auth/
    │       ├── auth.ts
    │       ├── rbac.ts
    │       └── session.ts
    └── types/next-auth.d.ts
```

---

## 8. Next phase — Phase 4
**Backend APIs + Repository + Services:** build the `/api/v1` route handlers with the Repository + Service layers, Zod validation, centralized error handling, logging, and audit-log writes — starting with Assistants, Conversations, and Providers.
