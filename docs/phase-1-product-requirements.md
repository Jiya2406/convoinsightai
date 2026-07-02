# ConvoInsight AI — Phase 1: Business Analysis & Product Requirements

> **Status:** Phase 1 of 9 — Business Analysis, PRD, MVP Scope, Feature Prioritization
> **Team:** 2 people · **Timebox:** 48-hour hackathon
> **Date:** 2026-07-02

---

## 1. Business Analysis

### 1.1 Problem Statement
Enterprises increasingly deploy **multiple AI assistants** (HR, Finance, Legal, Travel, Customer Support, Sales). Once these assistants are live, teams have **no unified way to answer critical operational questions**:

- Is the HR assistant hallucinating policy answers?
- Which assistant has the worst accuracy this week?
- Did the new prompt actually improve responses, or make them worse?
- Are answers grounded in approved knowledge, or invented?
- Which AI provider (OpenAI vs Gemini vs Claude) is cheapest/fastest/most accurate for our use case?
- Are we compliant — is there an audit trail of who changed what?

Today this is done with spreadsheets, ad-hoc scripts, and vibes. There is **no admin control plane** for AI assistant operations.

### 1.2 Solution
**ConvoInsight AI** is an **enterprise AI Conversation Studio** — an *admin platform* (not a chatbot) to **monitor, evaluate, test, govern, and optimize** a fleet of AI assistants across any AI provider.

Mental model: **LangSmith + Promptfoo + OpenAI Playground + Admin Dashboard + Analytics** unified into one governed product.

### 1.3 Target Users & Personas
| Persona | Role | Primary Jobs-to-be-Done |
|---|---|---|
| **AI Platform Admin** | Owns the fleet | Configure assistants, manage providers, set governance, manage users |
| **Prompt Engineer / Reviewer** | Improves quality | Run A/B prompt tests, evaluate responses, curate knowledge |
| **Analyst / Compliance** | Reports & governs | Read dashboards, export analytics, review audit logs, monitor hallucination risk |

### 1.4 Business Value
- **Reduce risk** — catch hallucinations and ungrounded answers before customers do.
- **Improve quality** — data-driven prompt optimization (A/B), not guesswork.
- **Control cost & vendor lock-in** — provider-agnostic; swap OpenAI ↔ Gemini ↔ Claude via one config.
- **Ensure compliance** — RBAC + full audit trail + governance rules.
- **Prove ROI** — analytics on confidence, success rate, latency, and feedback.

### 1.5 Competitive Landscape & Differentiation
| Product | Strength | Gap ConvoInsight fills |
|---|---|---|
| LangSmith | Tracing/eval | Not an *admin* product; dev-centric |
| Promptfoo | Prompt testing | CLI-only, no governance/dashboard |
| OpenAI Playground | Manual testing | Single-provider, no fleet monitoring |
| **ConvoInsight AI** | — | **Unified fleet admin + eval + A/B + governance + provider-agnostic** |

---

## 2. Product Requirements (PRD)

### 2.1 Goals
1. Provide a single pane of glass to monitor a fleet of AI assistants.
2. Evaluate every response on 10 quality metrics.
3. Enable data-driven prompt optimization via A/B testing.
4. Be **100% provider-agnostic** via the Adapter Pattern (start with Mock AI).
5. Enforce enterprise-grade security (RBAC, audit, validation).

### 2.2 Non-Goals (explicitly out of scope)
- Building/serving the end-customer chatbot UI itself (we *manage & evaluate* assistants, we are not the assistant).
- Real-time streaming token UI (nice-to-have, not core).
- Fine-tuning / training models.
- Multi-tenant billing / marketplace.

### 2.3 Key Functional Requirements (by module)
| # | Module | Core Requirement |
|---|---|---|
| FR-1 | **Dashboard** | KPI cards + charts (conversations, confidence, hallucination rate, success/failure, latency, provider health, best/worst assistant, recent activity) |
| FR-2 | **AI Playground** | Send a prompt to a selected assistant/provider, view response + live evaluation |
| FR-3 | **Assistant Management** | CRUD assistants (name, domain, system prompt, provider, model, temperature) |
| FR-4 | **Knowledge Management** | Upload PDF/JSON/Text → extract → version; attach to assistant |
| FR-5 | **Prompt Studio** | Compare Prompt A vs Prompt B side-by-side with metrics |
| FR-6 | **Prompt Testing** | Run prompt against a test set of inputs; scorecard |
| FR-7 | **Conversation History** | Browse/filter/search conversations & messages |
| FR-8 | **Response Evaluation** | Auto + manual scoring on 10 metrics |
| FR-9 | **Governance Engine** | Rules (banned words, PII, grounding required, max hallucination risk) → pass/flag/block |
| FR-10 | **Analytics** | Trends over time, per-assistant/provider breakdowns, snapshots |
| FR-11 | **Feedback** | Thumbs up/down + comments on responses |
| FR-12 | **Audit Logs** | Immutable log of all mutating actions + actor |
| FR-13 | **Notifications** | Alerts for threshold breaches (e.g., hallucination spike) |
| FR-14 | **Settings** | Providers, API keys, thresholds, appearance |

### 2.4 Non-Functional Requirements
- **Security:** Auth (NextAuth), RBAC (Admin/Reviewer/Analyst), Zod validation, XSS/CSRF protection.
- **Performance:** Dashboard loads < 2s on seeded data; paginated tables.
- **Architecture:** Clean Architecture, SOLID, Repository + Service layers, `/api/v1`, centralized errors + logging.
- **UX:** Enterprise SaaS UI (Linear/Vercel/GitHub feel), dark mode, responsive, skeletons, toasts, empty/error states.
- **Extensibility:** New AI provider = one adapter + one config change. No business-logic change.

### 2.5 Evaluation Metrics (definitions)
| Metric | Definition | Range |
|---|---|---|
| Accuracy | Factual correctness vs knowledge source | 0–100 |
| Relevance | Answer addresses the question | 0–100 |
| Completeness | Covers all parts of the question | 0–100 |
| Hallucination Risk | Likelihood of invented content | 0–100 (lower better) |
| Confidence | Model/eval certainty | 0–100 |
| Latency | Response time | ms |
| Response Length | Token/char count | count |
| Grounded Source | Answer traceable to knowledge | boolean |
| Source Reference | Cited source id(s) | list |
| Correctness Score | Weighted composite score | 0–100 |

---

## 2.6 Locked Decisions (confirmed with stakeholder)
- **AI Providers:** `MockAIAdapter` is the **default, fully built** provider. **`GeminiAdapter` (Google Gemini, free tier)** is the **one real adapter** wired end-to-end to prove swappability. `OpenAIAdapter`, `ClaudeAdapter`, `DeepSeekAdapter`, `LlamaAdapter`, `AzureOpenAIAdapter` are **scaffolded** against the same `AIAdapter` interface (config-swappable, not fully wired for the MVP).
- **Evaluation:** **Hybrid** — a **deterministic Mock evaluator** (scores grounded against `knowledge.json`) is the demo-safe default; an **optional Gemini-based LLM-judge** can be toggled on (free via Gemini free tier). Both sit behind an evaluator abstraction so the scoring engine is swappable.

## 3. MVP Scope (48-hour realistic)

**MVP goal:** A working, demo-able admin platform on **Mock AI** that proves the full loop:
**Configure assistant → Chat in Playground → Auto-evaluate → See on Dashboard → A/B a prompt → Governed & audited.**

### ✅ In MVP (must ship & demo)
1. Auth + RBAC (Admin/Reviewer/Analyst) — seeded users.
2. Assistant Management (CRUD).
3. **Mock AI Adapter** + `knowledge.json` + AIAdapter interface (config-swappable).
4. AI Playground (send → response → live evaluation).
5. Automatic Response Evaluation (10 metrics, computed by Mock evaluator).
6. Conversation History (list + detail + filter).
7. Dashboard (KPIs + 3–4 charts on seeded/real data).
8. Prompt Studio (A vs B side-by-side).
9. Governance Engine (basic rules: banned words, grounding required, hallucination threshold).
10. Feedback (thumbs + comment).
11. Audit Logs (auto-recorded on mutations).
12. Core enterprise UI shell (sidebar, breadcrumbs, dark mode, toasts, skeletons, empty states).

### 🟡 Partial / Simplified in MVP
- **Knowledge Management:** JSON + plain text upload & versioning fully; **PDF extraction** as a stretch (see risk note).
- **Analytics:** derived live from data + a snapshot job (no complex warehousing).
- **Notifications:** in-app toast/list on threshold breach (no email/Slack).
- **Real providers:** OpenAI/Gemini/Claude/etc. adapters **scaffolded** but Mock is default.

### ❌ Post-MVP (future)
Real-time streaming, PDF OCR at scale, email/Slack alerts, cost tracking per provider, fine-tuning, multi-tenant orgs.

---

## 4. Feature Prioritization — MoSCoW

### MUST HAVE (core loop, non-negotiable for demo)
- Auth + RBAC
- Assistant CRUD
- AIAdapter interface + **MockAIAdapter** + `knowledge.json`
- Playground
- Response Evaluation (10 metrics)
- Dashboard (KPIs + charts)
- Conversation History
- Audit Logs
- Enterprise UI shell (sidebar, dark mode, toasts, skeletons)

### SHOULD HAVE (strong differentiators, high demo value)
- Prompt Studio (A/B)
- Governance Engine (rules → pass/flag/block)
- Feedback
- Knowledge Management (JSON/Text + versioning)
- Analytics page

### COULD HAVE (if time permits)
- PDF text extraction
- Prompt Testing against test sets
- Notifications center
- Provider health polling
- Additional real adapters (OpenAI/Gemini/Claude wiring)

### WON'T HAVE (this hackathon)
- Streaming responses, email/Slack alerts, cost analytics, fine-tuning, multi-tenant billing, OCR.

---

## 5. Hackathon Reality Check (Rule 11 — flagged risks & recommended alternatives)

| Requested Feature | Risk in 48h | Recommendation |
|---|---|---|
| Full **PDF extraction + versioning** | PDF parsing (layout, OCR) is a time sink | Ship JSON/Text + versioning first; add `pdf-parse` for simple text PDFs as a COULD-HAVE |
| **7 real AI adapters** live | API keys, rate limits, cost, provider quirks | Ship **Adapter interface + Mock default + 1 real adapter (OpenAI) as proof**; others scaffolded |
| Real-time **provider health** | Needs live provider calls | Mock health status + one real ping if time allows |
| Complex **AnalyticsSnapshots** warehouse | Over-engineering | Compute analytics live + a simple periodic/manual snapshot row |
| **Live evaluation by an LLM judge** | Cost + latency + non-determinism in demo | Deterministic Mock evaluator (grounded scoring vs knowledge.json) — reliable for demo, adapter-swappable to LLM judge later |

**Core principle for the 48h:** *Depth on the loop that judges will click through (Assistant → Playground → Eval → Dashboard → A/B → Governance → Audit), breadth via scaffolding for the rest.*

---

## 6. Customer Journey (primary flow)

1. **Admin logs in** → lands on Dashboard (fleet health at a glance).
2. Creates an **HR Assistant** (system prompt, provider=Mock, attaches HR knowledge.json).
3. Opens **Playground**, asks "How many vacation days do I get?" → gets a grounded answer + **live evaluation card** (accuracy, hallucination risk, sources).
4. **Governance** flags a response that cites no source → shown as "flagged".
5. **Prompt Studio:** tries Prompt B ("be concise, always cite policy") → sees metrics improve side-by-side → promotes B.
6. Response gets **feedback** (👎 + comment) from a Reviewer.
7. **Dashboard/Analytics** update: confidence up, hallucination rate down.
8. **Audit Log** shows every change with actor + timestamp.

---

## 7. Assumptions
- Single organization/tenant for the hackathon.
- Seed data will be provided for a compelling demo (assistants, conversations, evaluations).
- Mock AI is the default provider; real keys optional.
- Neon (PostgreSQL) + Vercel are the deployment targets.
- Modern evergreen browser; desktop-first, responsive down to tablet/mobile.

---

## 8. Success Criteria for the Demo
- Judge can complete the full core loop in < 5 minutes without errors.
- Dashboard shows real, non-empty metrics driven by actual actions.
- Switching provider config from Mock demonstrably requires **one file** change.
- Governance visibly flags a bad response; audit log records the action.
- UI looks like a real enterprise SaaS (dark mode, polished, responsive).

---

## 9. Phase Map (for reference)
1. ✅ **Phase 1** — Business Analysis + PRD + MVP + Prioritization *(this document)*
2. Phase 2 — HLD + LLD + Folder Structure + DB Design
3. Phase 3 — Prisma Schema + DB Setup + Auth
4. Phase 4 — Backend APIs + Repository + Services
5. Phase 5 — Frontend UI + Dashboard + Components
6. Phase 6 — AI Adapter + Mock AI + knowledge.json + Playground
7. Phase 7 — Knowledge Mgmt + Prompt Studio + Evaluation + Governance
8. Phase 8 — Analytics + Feedback + Audit Logs + Notifications
9. Phase 9 — Testing + Deployment + README + Presentation + Demo + Judge Q&A
