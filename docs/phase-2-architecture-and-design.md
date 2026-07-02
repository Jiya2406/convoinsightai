# ConvoInsight AI — Phase 2: Architecture & Design

> **Status:** Phase 2 of 9 — HLD, LLD, Architecture/Component/Sequence/ER Diagrams, DB Design, Folder Structure
> **Depends on:** Phase 1 (PRD + locked decisions: Mock default + Gemini adapter; hybrid evaluator)
> **Date:** 2026-07-02
> *(All diagrams are Mermaid — they render in VS Code with a Mermaid preview extension and on GitHub.)*

---

## 1. High-Level Design (HLD)

### 1.1 Architectural Style
**Layered Clean Architecture** inside a single Next.js 15 App-Router deployment (frontend + API routes co-located, deployable to Vercel as one unit). Dependencies point **inward**: UI → API (controllers) → Services (business logic) → Repositories (data) → Prisma → PostgreSQL. AI/Eval concerns are isolated behind **adapter interfaces** so providers are swappable via config.

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION (Next.js UI)                 │
│  App Router pages · shadcn/ui components · React Query hooks  │
└───────────────▲───────────────────────────────┬──────────────┘
                │ HTTP (typed fetch)             │
┌───────────────┴───────────────────────────────▼──────────────┐
│                  API LAYER  (/api/v1/* route handlers)         │
│  Zod validation · Auth/RBAC guard · error handler · logging   │
└───────────────▲───────────────────────────────┬──────────────┘
                │ calls                          │ returns DTO
┌───────────────┴───────────────────────────────▼──────────────┐
│                    SERVICE LAYER (business logic)              │
│  AssistantService · ConversationService · EvaluationService   │
│  PromptTestService · GovernanceService · AnalyticsService     │
└──────▲───────────────▲───────────────────▲──────────┬─────────┘
       │               │                   │          │
┌──────┴──────┐ ┌──────┴───────┐  ┌────────┴──────┐ ┌─▼──────────┐
│ REPOSITORY  │ │  AI ADAPTER  │  │  EVALUATOR    │ │  AUDIT/LOG │
│  (Prisma)   │ │  (provider)  │  │  (scoring)    │ │            │
└──────┬──────┘ └──────┬───────┘  └───────┬───────┘ └────────────┘
       │               │                  │
┌──────▼──────┐ ┌──────▼───────┐  ┌───────▼───────────────────────┐
│ PostgreSQL  │ │ Mock / Gemini│  │ Mock evaluator / Gemini judge │
│  (Neon)     │ │ (+ scaffolds)│  │                               │
└─────────────┘ └──────────────┘  └───────────────────────────────┘
```

### 1.2 Key Design Principles applied
| Principle | Where |
|---|---|
| **SOLID / DIP** | Services depend on `AIAdapter` / `Evaluator` / repository **interfaces**, not concretions |
| **Repository Pattern** | All DB access via repositories; services never touch Prisma directly |
| **Service Layer** | Business rules live in services; API routes are thin controllers |
| **Adapter Pattern** | `AIAdapter` + `Evaluator` isolate external AI |
| **Config-based** | `lib/config/ai.config.ts` chooses the active provider — swap = 1 file |
| **Centralized errors** | `ApiError` classes + one error handler wrapper for all routes |
| **API Versioning** | Everything under `/api/v1` |

### 1.3 Provider-Swap Guarantee (the differentiator)
```
AIAdapterFactory.create(config.provider)  →  returns AIAdapter
   'mock'   → MockAIAdapter        (default)
   'gemini' → GeminiAdapter        (real, free tier)
   'openai' | 'claude' | ...       → scaffolded (throws NotImplemented until wired)
```
Business logic calls `adapter.generate(request)` — it never knows which provider answered.

---

## 2. Architecture Diagram (Mermaid)

```mermaid
flowchart TB
  subgraph Client["Browser (Enterprise SaaS UI)"]
    UI["Next.js App Router Pages<br/>shadcn/ui + Tailwind + Recharts"]
    RQ["React Query hooks<br/>(typed API client)"]
    UI --> RQ
  end

  subgraph Server["Next.js Server (Vercel)"]
    subgraph API["API Layer /api/v1"]
      MW["Middleware: Auth (NextAuth) · RBAC · Zod · ErrorHandler · Logger"]
      RH["Route Handlers (thin controllers)"]
      MW --> RH
    end
    subgraph SVC["Service Layer"]
      S1["AssistantService"]
      S2["ConversationService"]
      S3["EvaluationService"]
      S4["PromptTestService"]
      S5["GovernanceService"]
      S6["AnalyticsService"]
      S7["KnowledgeService"]
      S8["AuditService"]
    end
    subgraph ADPT["Adapters"]
      AIF["AIAdapterFactory"]
      EVF["EvaluatorFactory"]
    end
    subgraph REPO["Repositories (Prisma)"]
      R["Assistant/Conversation/Message/<br/>Evaluation/Feedback/Governance/Audit repos"]
    end
    RH --> SVC
    SVC --> REPO
    S2 --> AIF
    S3 --> EVF
    S5 --> EVF
  end

  subgraph Ext["External"]
    DB[("PostgreSQL / Neon")]
    MOCK["MockAIAdapter + knowledge.json"]
    GEM["GeminiAdapter (free tier)"]
    STUB["OpenAI/Claude/DeepSeek/Llama/Azure (scaffold)"]
  end

  RQ -->|HTTPS JSON| MW
  REPO --> DB
  AIF --> MOCK
  AIF --> GEM
  AIF --> STUB
  EVF --> MOCK
  EVF --> GEM
```

---

## 3. Component Diagram (Mermaid)

```mermaid
flowchart LR
  subgraph Frontend
    Shell["AppShell<br/>(Sidebar+Topbar+Breadcrumbs)"]
    Pages["Feature Pages<br/>Dashboard/Playground/Assistants/..."]
    UIKit["Reusable UI Kit<br/>Card/Table/Chart/Filter/EmptyState/Skeleton/Toast"]
    Hooks["React Query hooks + API client"]
    Shell --> Pages --> UIKit
    Pages --> Hooks
  end

  subgraph Backend
    Ctrl["Route Handlers"]
    Svc["Services"]
    Repo["Repositories"]
    subgraph Core["Core / lib"]
      Adapter["AIAdapter interface + Factory"]
      Eval["Evaluator interface + Factory"]
      Cfg["ai.config.ts"]
      Err["ApiError + handler"]
      Log["logger"]
      Auth["auth + rbac guard"]
    end
    Ctrl --> Svc --> Repo
    Svc --> Adapter
    Svc --> Eval
    Adapter --> Cfg
    Eval --> Cfg
    Ctrl --> Err
    Ctrl --> Auth
    Svc --> Log
  end

  Hooks -->|/api/v1| Ctrl
```

---

## 4. Sequence Diagrams (Mermaid)

### 4.1 Playground: send prompt → generate → evaluate → govern → persist
```mermaid
sequenceDiagram
  actor U as User (Admin/Reviewer)
  participant UI as Playground UI
  participant API as POST /api/v1/playground
  participant CS as ConversationService
  participant AF as AIAdapterFactory
  participant AD as AIAdapter (Mock/Gemini)
  participant EF as EvaluatorFactory
  participant EV as Evaluator
  participant GS as GovernanceService
  participant DB as Repositories/Prisma

  U->>UI: type prompt, pick assistant
  UI->>API: {assistantId, prompt}  (Zod-validated)
  API->>API: auth + RBAC check
  API->>CS: sendMessage(assistantId, prompt)
  CS->>DB: load assistant + knowledge
  CS->>AF: create(assistant.provider)
  AF-->>CS: adapter
  CS->>AD: generate({prompt, systemPrompt, knowledge})
  AD-->>CS: {text, tokens, latency, sources}
  CS->>EF: create(config.evaluator)
  CS->>EV: evaluate(response, knowledge)
  EV-->>CS: {accuracy, hallucinationRisk, ...10 metrics}
  CS->>GS: apply(rules, response, evaluation)
  GS-->>CS: {status: pass|flag|block, reasons}
  CS->>DB: persist conversation, message, evaluation, audit
  CS-->>API: DTO(response + evaluation + governance)
  API-->>UI: 200 JSON
  UI-->>U: render answer + live evaluation card
```

### 4.2 Prompt Studio: A vs B comparison
```mermaid
sequenceDiagram
  actor U as Reviewer
  participant UI as Prompt Studio
  participant API as POST /api/v1/prompt-tests
  participant PS as PromptTestService
  participant AD as AIAdapter
  participant EV as Evaluator
  participant DB as Repos

  U->>UI: Prompt A, Prompt B, test input
  UI->>API: {assistantId, promptA, promptB, input}
  API->>PS: runComparison(...)
  par Variant A
    PS->>AD: generate(promptA+input)
    AD-->>PS: responseA
    PS->>EV: evaluate(responseA)
  and Variant B
    PS->>AD: generate(promptB+input)
    AD-->>PS: responseB
    PS->>EV: evaluate(responseB)
  end
  PS->>DB: save PromptTest + both evaluations
  PS-->>API: {A: metrics, B: metrics, winner}
  API-->>UI: side-by-side scorecard
```

---

## 5. Database Design

### 5.1 Design notes
- **Normalized (3NF)**; enums for constrained fields (Role, Provider, GovernanceStatus, FeedbackType).
- **Indexes** on all foreign keys + common filter columns (`createdAt`, `assistantId`, `provider`).
- **Constraints:** FKs with cascade where a child cannot exist without parent (Message→Conversation); `RESTRICT`/`SET NULL` where history must survive (AuditLog actor).
- **Immutability:** `AuditLog` and `Evaluation` are append-only by convention (no update endpoints).
- **Metrics stored numerically** (0–100 / ms / boolean) per Phase 1 definitions.

### 5.2 Entities (16 tables)
| Table | Purpose | Key relations |
|---|---|---|
| **User** | Platform users | belongsTo Role; has Feedback, AuditLogs |
| **Role** | RBAC role (Admin/Reviewer/Analyst) | has Users |
| **Provider** | AI provider config (mock/gemini/…) | has Assistants |
| **Assistant** | A managed AI assistant | belongsTo Provider; has Conversations, Knowledge, PromptTests |
| **Knowledge** | Knowledge base for an assistant | belongsTo Assistant; has Documents; versioned |
| **Document** | A source item (JSON/Text/PDF) | belongsTo Knowledge |
| **Conversation** | A session with an assistant | belongsTo Assistant, User; has Messages |
| **Message** | One turn (user/assistant) | belongsTo Conversation; has Evaluation, Feedback |
| **Evaluation** | 10-metric score of a message | belongsTo Message |
| **PromptTest** | A/B or test-set run | belongsTo Assistant; has PromptTestResults |
| **Feedback** | Thumbs + comment | belongsTo Message, User |
| **GovernanceRule** | A rule (banned word/PII/grounding/threshold) | applied by GovernanceService |
| **AnalyticsSnapshot** | Periodic aggregate metrics | (optional per-assistant) |
| **Setting** | Key/value app + provider settings | — |
| **AuditLog** | Immutable action record | belongsTo User (actor) |
| **Notification** | Threshold-breach alerts | belongsTo User (optional) |

*(PromptTestResult is a child of PromptTest; shown in ER below. Documents realize the PDF/JSON/Text requirement.)*

### 5.3 ER Diagram (Mermaid)

```mermaid
erDiagram
  ROLE ||--o{ USER : has
  USER ||--o{ CONVERSATION : starts
  USER ||--o{ FEEDBACK : gives
  USER ||--o{ AUDITLOG : performs
  USER ||--o{ NOTIFICATION : receives

  PROVIDER ||--o{ ASSISTANT : powers
  ASSISTANT ||--o{ CONVERSATION : handles
  ASSISTANT ||--o{ KNOWLEDGE : owns
  ASSISTANT ||--o{ PROMPTTEST : tested_by
  ASSISTANT ||--o{ GOVERNANCERULE : governed_by

  KNOWLEDGE ||--o{ DOCUMENT : contains
  CONVERSATION ||--o{ MESSAGE : contains
  MESSAGE ||--|| EVALUATION : scored_by
  MESSAGE ||--o{ FEEDBACK : receives

  PROMPTTEST ||--o{ PROMPTTESTRESULT : produces
  ASSISTANT ||--o{ ANALYTICSSNAPSHOT : summarized_by

  ROLE {
    string id PK
    string name "Admin|Reviewer|Analyst"
    json permissions
  }
  USER {
    string id PK
    string email UK
    string name
    string passwordHash
    string roleId FK
    datetime createdAt
  }
  PROVIDER {
    string id PK
    string key "mock|gemini|openai|..."
    string name
    boolean isActive
    boolean isScaffold
    json config
  }
  ASSISTANT {
    string id PK
    string name
    string domain "HR|Finance|Legal|..."
    string systemPrompt
    string providerId FK
    string model
    float temperature
    boolean isActive
    datetime createdAt
  }
  KNOWLEDGE {
    string id PK
    string assistantId FK
    int version
    boolean isActive
    datetime createdAt
  }
  DOCUMENT {
    string id PK
    string knowledgeId FK
    string type "JSON|TEXT|PDF"
    string title
    string content
    json metadata
  }
  CONVERSATION {
    string id PK
    string assistantId FK
    string userId FK
    string title
    datetime createdAt
  }
  MESSAGE {
    string id PK
    string conversationId FK
    string role "user|assistant"
    string content
    int tokens
    int latencyMs
    json sources
    datetime createdAt
  }
  EVALUATION {
    string id PK
    string messageId FK
    float accuracy
    float relevance
    float completeness
    float hallucinationRisk
    float confidence
    int latencyMs
    int responseLength
    boolean groundedSource
    json sourceReference
    float correctnessScore
    string evaluator "mock|gemini"
    datetime createdAt
  }
  PROMPTTEST {
    string id PK
    string assistantId FK
    string promptA
    string promptB
    string input
    string winner
    datetime createdAt
  }
  PROMPTTESTRESULT {
    string id PK
    string promptTestId FK
    string variant "A|B"
    string output
    json metrics
  }
  FEEDBACK {
    string id PK
    string messageId FK
    string userId FK
    string type "UP|DOWN"
    string comment
    datetime createdAt
  }
  GOVERNANCERULE {
    string id PK
    string assistantId FK
    string type "BANNED_WORD|PII|GROUNDING|THRESHOLD"
    json config
    string action "FLAG|BLOCK"
    boolean isActive
  }
  ANALYTICSSNAPSHOT {
    string id PK
    string assistantId FK
    date periodDate
    json metrics
  }
  SETTING {
    string id PK
    string key UK
    json value
  }
  AUDITLOG {
    string id PK
    string userId FK
    string action
    string entity
    string entityId
    json meta
    datetime createdAt
  }
  NOTIFICATION {
    string id PK
    string userId FK
    string type
    string message
    boolean isRead
    datetime createdAt
  }
```

---

## 6. Low-Level Design (LLD) — key contracts

### 6.1 AIAdapter interface (the swap point)
```
interface AIRequest  { prompt, systemPrompt, knowledge[], model?, temperature? }
interface AIResponse { text, tokens, latencyMs, sources[], provider }
interface AIAdapter  { generate(req: AIRequest): Promise<AIResponse>; healthCheck(): Promise<ProviderHealth> }

MockAIAdapter    implements AIAdapter   // matches prompt against knowledge.json
GeminiAdapter    implements AIAdapter   // calls Gemini free-tier REST API
OpenAIAdapter…   implements AIAdapter   // throws NotImplementedError until wired
AIAdapterFactory.create(providerKey): AIAdapter
```

### 6.2 Evaluator interface
```
interface Evaluator { evaluate(response: AIResponse, knowledge: Document[], question: string): Promise<EvaluationResult> }
MockEvaluator        // deterministic: keyword/grounding overlap → 10 metrics
GeminiJudgeEvaluator // optional: asks Gemini to score (free tier)
EvaluatorFactory.create(config.evaluator): Evaluator
```

### 6.3 Repository interface (generic)
```
interface Repository<T> { findById(id): Promise<T|null>; findMany(filter, page): Promise<Paginated<T>>; create(data): Promise<T>; update(id, data): Promise<T>; delete(id): Promise<void> }
```

### 6.4 Service pattern
```
class ConversationService {
  constructor(convRepo, msgRepo, evalRepo, auditRepo, aiFactory, evalFactory, governance) {}  // DI
  async sendMessage(assistantId, prompt, userId): Promise<PlaygroundResult> { ... }
}
```

### 6.5 API contract conventions
- Base: `/api/v1`
- Success: `{ data, meta? }` · Error: `{ error: { code, message, details? } }`
- Pagination: `?page=&pageSize=` → `meta: { page, pageSize, total }`
- All bodies validated with **Zod**; all mutations write an **AuditLog**.

### 6.6 RBAC matrix
| Action | Admin | Reviewer | Analyst |
|---|---|---|---|
| View dashboards/analytics | ✅ | ✅ | ✅ |
| Use Playground | ✅ | ✅ | ❌ |
| CRUD assistants/knowledge/providers | ✅ | ❌ | ❌ |
| Run prompt tests / evaluate / feedback | ✅ | ✅ | ❌ |
| Manage governance rules | ✅ | ❌ | ❌ |
| View audit logs | ✅ | ✅ (read) | ✅ (read) |
| Manage users/settings | ✅ | ❌ | ❌ |

---

## 7. Enterprise Folder Structure (target)

```
convoinsight-ai/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx             # AppShell (sidebar+topbar)
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── playground/page.tsx
│   │   │   ├── assistants/page.tsx
│   │   │   ├── knowledge/page.tsx
│   │   │   ├── prompt-studio/page.tsx
│   │   │   ├── conversations/page.tsx
│   │   │   ├── evaluations/page.tsx
│   │   │   ├── governance/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   ├── feedback/page.tsx
│   │   │   ├── audit-logs/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── api/v1/                    # thin route handlers
│   │   │   ├── assistants/route.ts
│   │   │   ├── playground/route.ts
│   │   │   ├── prompt-tests/route.ts
│   │   │   ├── conversations/route.ts
│   │   │   ├── evaluations/route.ts
│   │   │   ├── governance/route.ts
│   │   │   ├── analytics/route.ts
│   │   │   ├── feedback/route.ts
│   │   │   ├── knowledge/route.ts
│   │   │   ├── audit-logs/route.ts
│   │   │   └── auth/[...nextauth]/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                        # shadcn primitives
│   │   ├── shared/                    # DataTable, ChartCard, KpiCard,
│   │   │                              # FilterBar, EmptyState, Skeletons,
│   │   │                              # PageHeader, Breadcrumbs, ThemeToggle
│   │   └── features/                  # per-module composed components
│   ├── server/
│   │   ├── services/                  # business logic
│   │   ├── repositories/              # Prisma data access
│   │   └── dto/                       # response DTO mappers
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── adapters/              # mock, gemini, openai(stub)...
│   │   │   ├── ai-adapter.interface.ts
│   │   │   └── ai-adapter.factory.ts
│   │   ├── evaluation/
│   │   │   ├── evaluators/            # mock, gemini-judge
│   │   │   └── evaluator.factory.ts
│   │   ├── config/ai.config.ts        # ← single swap point
│   │   ├── auth/                      # nextauth + rbac guard
│   │   ├── errors/                    # ApiError + handler
│   │   ├── logger/
│   │   ├── validation/                # zod schemas
│   │   ├── db/prisma.ts               # Prisma client singleton
│   │   └── api-client/                # typed fetch + react-query hooks
│   ├── types/                         # shared TS types
│   └── data/knowledge.json            # Mock AI knowledge base
├── docs/                              # phase deliverables
├── .env.example
├── components.json                    # shadcn config
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## 8. Technology Justifications (Rule 9/10)
| Choice | Why (vs alternatives) |
|---|---|
| **Next.js 15 App Router** | One deploy for UI+API on Vercel; server components; fits 48h |
| **Prisma + PostgreSQL/Neon** | Type-safe queries, migrations, serverless Postgres free tier |
| **NextAuth** | First-class Next.js integration; Credentials provider for seeded demo users; no external auth account needed for MVP |
| **React Query** | Cache/loading/error states out-of-the-box → skeletons & toasts are trivial |
| **Zod** | Single schema for validation + inferred TS types (DRY) |
| **shadcn/ui** | Own the components (no lock-in), themeable dark mode, enterprise look |
| **Adapter + Factory** | Fulfills "swap provider = 1 config file"; testable via Mock |

---

## 9. Phase 2 Trade-offs & Assumptions
- **Monolith over microservices:** simpler, faster, fits Vercel + 48h. (Services are cleanly separated so extraction is possible later.)
- **Credentials auth over OAuth:** avoids Google Cloud setup for the demo; OAuth is a future enhancement.
- **PromptTestResult** added as a child table (not in the original 16) to keep A/B results normalized — noted as an intentional extension.
- **AnalyticsSnapshot** kept minimal (JSON metrics blob) to avoid over-engineering.

---

## 10. Next Phase Overview — Phase 3
**Prisma Schema + Database Setup + Authentication:** turn this ER design into `prisma/schema.prisma`, set up **Neon PostgreSQL** (full click-by-click account + connection-string guide), run migrations, seed roles/users/providers/assistants/knowledge, and wire **NextAuth** (Credentials) with RBAC guards. First real setup steps + API keys begin here.
