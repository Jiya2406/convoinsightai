# ConvoInsight AI

**Enterprise AI Conversation Studio** — an admin platform to **monitor, evaluate, test, govern, and optimize** a fleet of AI assistants (HR, Finance, Legal, Support, Sales, and more) across any AI provider.

---

## 👥 Team

- **Team Name:** Syntax Girls
- **Team Members:** Jiya Kothari, Vishwa Bhalodiya
- **College Name:** Charusat University

---

## 🧱 Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router) + React 19 + TypeScript |
| **Styling / UI** | Tailwind CSS, shadcn/ui, Lucide Icons |
| **Data / State** | TanStack React Query |
| **Charts** | Recharts |
| **Backend** | Next.js API Routes (`/api/v1`), Repository + Service layers |
| **Database** | PostgreSQL (Neon) + Prisma ORM |
| **Auth** | Auth.js / NextAuth v5 (Credentials + JWT) + RBAC |
| **Validation** | Zod |
| **AI Providers** | Adapter pattern — **Mock** (default) + **Google Gemini** (free tier); OpenAI/Claude/DeepSeek/Llama/Azure scaffolded |

---

## ✨ Features (what each module does)

| Module | What it does |
|---|---|
| **Dashboard** | Fleet-wide KPIs — conversations, assistants, avg confidence, hallucination rate, success rate, response time, provider health, best/worst assistant, recent activity. |
| **AI Playground** | Chat with any assistant and see the response **evaluated (10 metrics)** and **governed** live, with grounded sources. |
| **Assistants** | Create / edit / delete AI assistants (persona, provider, model, temperature). |
| **Knowledge** | Versioned knowledge bases (JSON/Text). Assistants ground answers on the **active** version; activate/rollback versions. |
| **Prompt Studio** | Compare **Prompt A vs Prompt B** on the same input — side-by-side scores + winner. |
| **Conversations** | Browse all conversations; open one to see the full transcript with per-message evaluations. |
| **Evaluations** | Table of every scored response (accuracy, relevance, hallucination, confidence, etc.). |
| **Governance** | Rules applied to every response — grounding required, hallucination threshold, banned words, PII → **PASS / FLAG / BLOCK**. |
| **Analytics** | Quality trend over time + per-assistant / per-provider / governance breakdowns. |
| **Feedback** | 👍 / 👎 + comments on assistant responses. |
| **Notifications** | Alerts when a response is flagged/blocked (topbar bell + inbox). |
| **Audit Logs** | Immutable record of every mutating action, with actor + timestamp. |
| **Providers** | View/activate AI providers; Mock + Gemini are wired, others scaffolded. |

**Evaluation metrics (10):** Accuracy, Relevance, Completeness, Hallucination Risk, Confidence, Latency, Response Length, Grounded Source, Source Reference, Correctness Score.

---

## 🔄 How the Product Works (workflow)

```
Create Assistant  →  Add Knowledge  →  Playground (ask a question)
        │                                     │
        │                                     ▼
        │                     ┌──────────── AI Adapter ────────────┐
        │                     │  Mock (default) / Gemini (free tier) │
        │                     └───────────────┬────────────────────┘
        │                                     ▼
        │                       Evaluator  →  10 quality metrics
        │                                     ▼
        │                       Governance →  PASS / FLAG / BLOCK
        │                                     ▼
        │     Persist (Conversation, Messages, Evaluation, Audit, Notification)
        ▼                                     ▼
   Dashboard  ◄──────────  Analytics / Evaluations / Feedback update in real time
```

Every AI call goes through an **adapter interface**, so switching providers is a **single config change** (`src/lib/config/ai.config.ts`) — business logic never talks to a provider directly.

---

## 🚀 Build & Run Instructions

### Prerequisites
- **Node.js 20+** and **npm**
- A free **Neon** PostgreSQL database (https://neon.tech)

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Create a `.env` file in the project root (copy from `.env.example`):
```env
# Neon PostgreSQL pooled connection string
DATABASE_URL="postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/dbname?sslmode=require"

# Auth.js secret (generate with: npx auth secret)
AUTH_SECRET="your-long-random-string"

# Optional — only needed to use the real Gemini provider (free tier)
GEMINI_API_KEY=""
AI_PROVIDER="mock"     # mock | gemini
EVALUATOR="mock"       # mock | gemini
```
> **Get a Neon URL:** sign up → create project → copy the **pooled** connection string.
> **Get an AUTH_SECRET:** run `npx auth secret` (writes it to `.env`).
> **Get a Gemini key (optional):** https://aistudio.google.com/app/apikey → *Create API key*.

### 3. Set up the database
```bash
npx prisma migrate dev    # create tables
npm run db:seed           # seed roles, users, providers, sample HR assistant
```

### 4. Run the app
```bash
npm run dev               # http://localhost:3000
```

> ℹ️ **Single app, single port.** ConvoInsight AI is one **Next.js** application — the frontend (App Router pages) and the backend (`/api/v1` route handlers) run **together on the same port** (`http://localhost:3000`). There is **no separate backend server** to start; `npm run dev` runs both.

### Demo accounts (password: `Passw0rd!`)
| Email | Role | Access |
|---|---|---|
| `admin@convoinsight.ai` | **Admin** | Everything |
| `reviewer@convoinsight.ai` | **Reviewer** | Playground, Prompt Studio, evaluations, feedback |
| `analyst@convoinsight.ai` | **Analyst** | Read-only dashboards & analytics |

### Useful scripts
```bash
npm run dev          # start dev server
npm run build        # production build
npm run db:studio    # visual database browser
npm run db:seed      # re-seed demo data
```

---

## 🧭 How to Use (quick tour)

1. **Log in** as `admin@convoinsight.ai` / `Passw0rd!`.
2. **Assistants** → create an assistant (or use the seeded **HR Helpdesk**).
3. **Knowledge** → add a versioned knowledge base for the assistant.
4. **Playground** → ask *"How many vacation days do I get?"* → see a grounded answer + live evaluation + **PASS**. Ask something off-topic → watch it get **BLOCKED**.
5. **Prompt Studio** → compare two system prompts and pick a winner.
6. **Governance** → add rules (e.g. banned words) applied to every response.
7. **Dashboard / Analytics / Evaluations / Feedback / Notifications / Audit Logs** → monitor everything.

---

## 📡 API Documentation

Base URL: `/api/v1` · Auth: session cookie (NextAuth) · Responses: `{ data }` / `{ data, meta }` / `{ error: { code, message } }`

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/dashboard/stats` | dashboard:view | Aggregate KPIs for the dashboard |
| `GET` | `/assistants` | dashboard:view | List assistants (`?q=&domain=&isActive=&page=&pageSize=`) |
| `POST` | `/assistants` | assistant:manage | Create an assistant |
| `GET` | `/assistants/:id` | dashboard:view | Assistant detail |
| `PATCH` | `/assistants/:id` | assistant:manage | Update an assistant |
| `DELETE` | `/assistants/:id` | assistant:manage | Delete an assistant |
| `GET` | `/providers` | dashboard:view | List AI providers |
| `PATCH` | `/providers/:id` | provider:manage | Activate / update a provider |
| `POST` | `/playground` | playground:use | Send a prompt → generate + evaluate + govern + persist |
| `GET` | `/conversations` | dashboard:view | List conversations |
| `GET` | `/conversations/:id` | dashboard:view | Conversation transcript + evaluations |
| `GET` | `/knowledge?assistantId=` | dashboard:view | List knowledge versions |
| `POST` | `/knowledge` | knowledge:manage | Create a knowledge version |
| `GET` | `/knowledge/:id` | dashboard:view | Version detail (documents) |
| `POST` | `/knowledge/:id/activate` | knowledge:manage | Activate a version |
| `POST` | `/prompt-tests` | prompt:test | Run a Prompt A/B comparison |
| `GET` | `/evaluations` | dashboard:view | Browse response evaluations |
| `GET` | `/governance` | governance:manage | List governance rules |
| `POST` | `/governance` | governance:manage | Create a rule |
| `PATCH` | `/governance/:id` | governance:manage | Update a rule |
| `DELETE` | `/governance/:id` | governance:manage | Delete a rule |
| `GET` | `/analytics` | analytics:view | Trends + breakdowns |
| `GET` | `/feedback` | dashboard:view | List feedback |
| `POST` | `/feedback` | feedback:create | Submit 👍/👎 + comment |
| `GET` | `/notifications` | dashboard:view | Inbox + unread count |
| `PATCH` | `/notifications/:id` | dashboard:view | Mark one read |
| `POST` | `/notifications/read-all` | dashboard:view | Mark all read |
| `GET` | `/audit-logs` | audit:view | Immutable action log |

**Example — send a Playground message:**
```bash
curl -X POST http://localhost:3000/api/v1/playground \
  -H "Content-Type: application/json" \
  -d '{ "assistantId": "seed-hr-assistant", "prompt": "How many vacation days do I get?" }'
```

---

## 🗂 Project Structure

```
src/
├── app/                # Next.js pages + /api/v1 route handlers
│   ├── (auth)/login    # login page
│   └── (dashboard)/    # dashboard, playground, assistants, knowledge, ...
├── components/         # ui/ (shadcn), shared/ (kit), layout/, features/
├── server/             # repositories/ + services/ (business logic)
├── lib/                # ai/ (adapters), evaluation/, auth/, api/, config/
├── types/              # shared TypeScript types
└── data/knowledge.json # bundled Mock AI knowledge base
prisma/                 # schema.prisma + seed.ts
docs/                   # phase-by-phase design & implementation docs
```

---

## 🔐 Security
Authentication (NextAuth) · **RBAC** (Admin / Reviewer / Analyst) · Zod input validation · centralized error handling · full audit trail.

---

## 🏗️ Architecture Highlights
- **Adapter Pattern** for AI providers — swap provider in **one config file**.
- **Clean/layered architecture** — Route handler → Service → Repository → Prisma.
- **Deterministic Mock AI + evaluator** — reliable, cost-free demos; swappable to real Gemini.
- **API versioning** (`/api/v1`), centralized errors, structured logging.
```
