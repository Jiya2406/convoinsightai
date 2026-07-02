# ConvoInsight AI — Phase 7: Knowledge, Prompt Studio, Evaluations & Governance

> **Status:** Phase 7 of 9 — four modules built on the Phase 6 engines
> **Date:** 2026-07-02

---

## 1. What was built

### Knowledge Management (versioned)
- **Backend:** `knowledge.repository.ts` + `knowledge.service.ts` — list versions, create a new version with documents (auto-increments version, deactivates others when activating), activate a version.
- **API:** `GET/POST /api/v1/knowledge`, `GET /api/v1/knowledge/:id`, `POST /api/v1/knowledge/:id/activate`.
- **UI:** `/knowledge` — assistant picker, versions list (active badge + doc counts), documents viewer, **New version** dialog (multi-document), activate button.
- Supports **JSON + Text** documents. (PDF extraction remains a COULD-HAVE per Phase 1.)

### Prompt Studio (A/B)
- **Backend:** `prompt-test.repository.ts` + `prompt-test.service.ts` — `runComparison()` generates + evaluates both prompts on the same input/knowledge, picks a winner by correctness, persists `PromptTest` + 2 `PromptTestResult`s.
- **API:** `POST /api/v1/prompt-tests`.
- **UI:** `/prompt-studio` — assistant picker, Prompt A/B textareas, test input, **Run comparison** → side-by-side outputs + `EvaluationCard`s + **Winner** badge.

### Evaluations browser
- **Backend:** `evaluation.repository.ts` — paginated list with message + assistant context.
- **API:** `GET /api/v1/evaluations`.
- **UI:** `/evaluations` — table with color-coded correctness/hallucination/confidence, grounded, evaluator; rows link to the conversation.

### Governance management UI
- **Backend:** extended `governance.repository.ts` + `governance.service.ts` with create/update/delete (the enforcement engine already existed in Phase 6).
- **API:** `GET/POST /api/v1/governance`, `PATCH/DELETE /api/v1/governance/:id`.
- **UI:** `/governance` — rules table, **New rule** dialog (type-specific config: grounding / threshold / banned words / PII; FLAG or BLOCK; global or per-assistant scope), enable/disable + delete.

### Shared
- New reusable `AssistantPicker` (used by Playground, Knowledge, Prompt Studio, Governance).
- Enabled nav: Knowledge, Prompt Studio, Evaluations, Governance (all "Soon" badges removed).

---

## 2. ✅ Verified end-to-end (live server, real DB)
| Module | Result |
|---|---|
| Knowledge | Create v2 → active; list shows v2 (active) + v1 (inactive) with doc counts |
| Prompt Studio | A/B run → winner + both correctness scores returned |
| Evaluations | List returns scored responses with assistant context |
| Governance | Lists 2 seeded rules; create → delete (204) works |
| RBAC | Analyst `POST /governance` → **403 FORBIDDEN** |
| `tsc --noEmit` | **0 errors** |

*(All test data cleaned up — DB restored to clean seed state.)*

> Note: with the **Mock** provider, Prompt A and Prompt B produce the same grounded answer (mock ignores the system prompt and grounds on knowledge), so scores tie and A wins. The A/B difference becomes meaningful with the **Gemini** provider, where the system prompt shapes the output.

---

## 3. Key decisions
| Decision | Why |
|---|---|
| **Immutable knowledge versions** | New version instead of editing → clean history + easy rollback via activate |
| **Prompt test reuses the AI + eval engines** | Same generate→evaluate path as Playground; no duplicate logic |
| **Governance rules global or per-assistant** | `assistantId = null` = applies to all; per-assistant overrides |
| **Evaluations read-only browser** | Evaluations are produced by the pipeline (Playground); this is a monitoring view |
| **Type-specific rule config UI** | Only shows the fields relevant to the selected rule type |

---

## 4. 🔧 Manual setup steps
- **None.** No new dependencies or accounts.

## 5. ✔️ Verification checklist (run yourself)
1. `npm run dev` → log in as **admin**.
2. **Knowledge** → pick HR Helpdesk → **New version** → add a document → it becomes active; switch versions and **Activate** an older one.
3. **Prompt Studio** → pick an assistant → tweak Prompt A/B → **Run comparison** → side-by-side scores + winner.
4. **Playground** → ask a question → then **Evaluations** shows the scored response.
5. **Governance** → **New rule** (e.g. Banned words: "secret") → appears in the table → toggle/delete.
6. Log in as **reviewer** → Governance is hidden (no `governance:manage`); Prompt Studio + Evaluations visible.

## 6. ⚠️ Common errors
| Symptom | Cause | Fix |
|---|---|---|
| "Add at least one document" | All doc rows empty | Fill a title + content |
| Prompt A/B scores identical | Using Mock provider | Expected; use a Gemini-backed assistant to see prompt-driven differences |
| Governance page hidden | Not an Admin | `governance:manage` is Admin-only (RBAC) |
| New knowledge not used in answers | Version not active | Activate it (or create with activate = true) |

---

## 7. Files created/changed this phase (high level)
```
src/server/repositories/{knowledge,prompt-test,evaluation}.repository.ts
src/server/repositories/governance.repository.ts        (create/update/delete added)
src/server/services/{knowledge,prompt-test}.service.ts
src/server/services/governance.service.ts               (CRUD added)
src/lib/validation/{knowledge,prompt-test,governance}.schema.ts
src/app/api/v1/knowledge/route.ts + [id]/route.ts + [id]/activate/route.ts
src/app/api/v1/prompt-tests/route.ts
src/app/api/v1/evaluations/route.ts
src/app/api/v1/governance/route.ts + [id]/route.ts
src/app/(dashboard)/{knowledge,prompt-studio,evaluations,governance}/page.tsx
src/components/features/knowledge/create-version-dialog.tsx
src/components/features/governance/rule-dialog.tsx
src/components/shared/assistant-picker.tsx
src/types/api.ts + src/lib/api-client/hooks.ts          (types + hooks)
src/components/layout/nav-config.ts                      (enabled 4 modules)
```

---

## 8. Next phase — Phase 8
**Analytics + Feedback + Audit Logs polish + Notifications:** the Analytics page (trends over time, per-assistant/provider breakdowns), message-level Feedback (thumbs + comment) wired into Conversations/Playground, and a Notifications center for threshold breaches.
