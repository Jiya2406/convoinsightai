# ConvoInsight AI — Phase 6: AI Adapter, Mock AI, Evaluator & Playground

> **Status:** Phase 6 of 9 — the AI core: adapter pattern, Mock + Gemini providers, deterministic evaluator, governance, and the Playground
> **Date:** 2026-07-02

---

## 1. What was built

### AI Adapter layer (`src/lib/ai`)
| File | Purpose |
|---|---|
| `ai-adapter.interface.ts` | `AIAdapter` contract + request/response/health types |
| `adapters/mock.adapter.ts` | **MockAIAdapter** — deterministic, grounds on knowledge, cites sources |
| `adapters/gemini.adapter.ts` | **GeminiAdapter** — calls Gemini REST API (free tier), injects knowledge |
| `adapters/scaffold.adapter.ts` | Placeholder for OpenAI/Claude/DeepSeek/Llama/Azure (throws clear 501) |
| `ai-adapter.factory.ts` | Maps `ProviderKey` → adapter (the one place providers are wired) |
| `retrieval.ts` | Keyword grounding: tokenize, overlap score, retrieve top-k, sources |
| `config/ai.config.ts` | **THE SINGLE SWAP POINT** — default provider + evaluator (env-driven) |

### Knowledge base
- `src/data/knowledge.json` — bundled multi-domain KB (HR, Finance, IT, Travel, Support, Sales, Legal). The mock adapter grounds on the assistant's own documents first, then augments with domain entries here.

### Evaluator layer (`src/lib/evaluation`)
| File | Purpose |
|---|---|
| `evaluator.interface.ts` | `Evaluator` contract + `EvaluationResult` (all 10 metrics) |
| `evaluators/mock.evaluator.ts` | **MockEvaluator** — deterministic scoring from overlap/grounding signals |
| `evaluators/gemini-judge.evaluator.ts` | Optional LLM judge; falls back to mock on any failure |
| `evaluator.factory.ts` | Returns active evaluator (`EVALUATOR=mock|gemini`) |

### Governance engine (`src/server`)
- `governance.repository.ts` + `governance.service.ts` — applies rules (BANNED_WORD, PII, GROUNDING, THRESHOLD) → **PASS / FLAG / BLOCK** with reasons. BLOCK wins over FLAG.

### The write path (the whole product loop)
`ConversationService.sendMessage()`:
**load assistant + knowledge → generate (adapter) → evaluate (10 metrics) → govern → persist (conversation, user + assistant messages, evaluation, audit).**
- New endpoint: `POST /api/v1/playground` (permission `playground:use`).
- Two `Message` fields added + migrated: `governanceStatus`, `governanceReasons`.

### Frontend
- **Playground** page (`/playground`) — assistant selector, chat UI, live **EvaluationCard** (10 metrics + sources), **GovernanceBadge**, governance notes.
- **Conversation detail** page (`/conversations/[id]`) — full transcript with per-message evaluation + governance; rows in the list are now clickable.
- Playground nav item enabled.

---

## 2. ✅ Verified end-to-end (live server, real DB)
| Test | Result |
|---|---|
| Grounded Q ("vacation days") | Correct cited answer · correctness **92** · hallucination **12** · grounded **true** · governance **PASS** |
| Ungrounded Q ("capital of France") | Honest "I don't know" · correctness **4** · hallucination **100** · governance **BLOCK** (grounding + threshold) |
| Persistence | Conversations (2) + messages (4) + evaluations (2) saved; audit `playground.message` recorded |
| Dashboard | Live KPIs updated (avg confidence 65, hallucination 56, success 50) |
| `tsc --noEmit` | **0 errors** |

*(Test conversations were deleted afterward — DB is back to clean seed state.)*

---

## 3. Key decisions
| Decision | Why |
|---|---|
| **Adapter + factory + config** | Fulfills "swap provider = 1 file"; verified with Mock + Gemini + 5 scaffolds |
| **Deterministic mock adapter & evaluator** | Reliable in live demos; reproducible; no cost/latency |
| **Gemini judge falls back to mock** | Scoring never breaks the pipeline if the key/quota fails |
| **Governance persisted on the message** | Auditable; shown in Conversations + Playground |
| **Grounding computed locally even for Gemini** | Uniform pipeline; sources/eval work regardless of provider |
| **Relaxed id validation on playground** | Seeded ids are custom strings, not cuids |

---

## 4. 🔑 Manual setup — using real Gemini (OPTIONAL)
The platform works fully on **Mock** with no keys. To try the real Gemini provider:

1. Go to **https://aistudio.google.com/app/apikey** (Google AI Studio) → sign in with a Google account.
2. Click **Create API key** → **Create API key in new project** → copy the key.
3. Paste it into `.env`:
   ```env
   GEMINI_API_KEY="AIza...your key..."
   ```
4. To make Gemini the **default** provider platform-wide, also set:
   ```env
   AI_PROVIDER="gemini"      # optional; or create a Gemini-backed assistant
   EVALUATOR="gemini"        # optional; use the LLM judge
   ```
5. Restart `npm run dev`. Create an assistant with **Provider = Google Gemini** (and a `gemini-1.5-flash` model), or flip `AI_PROVIDER`.

> Free tier is rate-limited; if you hit a quota error you'll see a friendly "Gemini API error" toast and can switch back to Mock.

---

## 5. ✔️ Verification checklist (run yourself)
1. `npm run dev` → log in as **admin** (or **reviewer** — both have `playground:use`).
2. Open **Playground** → assistant **HR Helpdesk** is selected.
3. Ask **"How many vacation days do I get?"** → grounded answer, **PASS**, high correctness, sources listed.
4. Ask **"Who won the 2018 world cup?"** → "I don't know", **BLOCK/flagged**, high hallucination.
5. Open **Conversations** → your chats appear → click one → see the transcript + evaluations.
6. **Dashboard** → KPIs and Recent Activity now reflect the new data.
7. (Analyst account) → Playground is hidden (no `playground:use`).

## 6. ⚠️ Common errors
| Symptom | Cause | Fix |
|---|---|---|
| "Gemini is not configured" | No `GEMINI_API_KEY` | Add the key, or use a Mock-backed assistant |
| "Gemini API error (429)" | Free-tier rate limit | Wait a moment or switch to Mock |
| Playground hidden | Logged in as Analyst | Use Admin/Reviewer (RBAC) |
| "This assistant is inactive" | Assistant/provider toggled off | Reactivate on Assistants/Providers |

---

## 7. Files created/changed this phase (high level)
```
src/lib/ai/*                         (interface, factory, retrieval, config, 3 adapter files)
src/data/knowledge.json
src/lib/evaluation/*                  (interface, factory, 2 evaluators)
src/lib/validation/playground.schema.ts
src/server/repositories/governance.repository.ts
src/server/services/governance.service.ts
src/server/services/conversation.service.ts        (write path added)
src/server/repositories/{assistant,conversation}.repository.ts   (generation + write methods)
src/app/api/v1/playground/route.ts
src/app/(dashboard)/playground/page.tsx
src/app/(dashboard)/conversations/[id]/page.tsx
src/components/features/evaluation/{evaluation-card,governance-badge}.tsx
prisma/schema.prisma                  (Message.governanceStatus + governanceReasons)
+ migration: add_message_governance
```

---

## 8. Next phase — Phase 7
**Knowledge Management + Prompt Studio + Evaluation views + Governance UI:** upload/version knowledge (JSON/Text, PDF as stretch), the Prompt A/B studio wired to `PromptTest`, an Evaluations browsing page, and the Governance rules management UI — building on the engines created here.
