# ConvoInsight AI — Phase 4: Backend APIs, Repositories & Services

> **Status:** Phase 4 of 9 — `/api/v1` route handlers + Repository layer + Service layer + Zod + centralized errors + logging + audit
> **Date:** 2026-07-02

---

## 1. What was built

### Core infrastructure (`src/lib`)
| File | Responsibility |
|---|---|
| `errors/api-error.ts` | Typed error classes (`ApiError`, `NotFoundError`, `ForbiddenError`, `ValidationError`, …) — pure, no framework imports |
| `errors/handler.ts` | Maps thrown errors → `{ error: { code, message, details } }`; handles Zod + Prisma error codes |
| `logger/logger.ts` | Structured JSON logger (single sink to swap later) |
| `api/response.ts` | Success envelopes `ok()`/`created()`/`noContent()`/`paginated()` + `buildPageMeta()` |
| `api/handler.ts` | `route()` wrapper: **auth → RBAC → async params → error handling → request logging** |
| `validation/*.ts` | Zod schemas (`common`, `assistant`, `provider`) |

### Layers (`src/server`)
- **Repositories** (`repositories/`) — all Prisma access: `assistant`, `provider`, `conversation`, `audit`.
- **Services** (`services/`) — business logic with **constructor DI**: `assistant`, `provider`, `conversation`, `audit`. Every mutation writes an **AuditLog**.

### API architecture pattern
```
Route handler (thin)  →  Service (business logic + audit)  →  Repository (Prisma)  →  DB
      │
      └─ route() wrapper handles auth + RBAC + validation errors centrally
```
A route handler is now ~3 lines: parse → call service → return envelope. All cross-cutting concerns live in `route()`.

---

## 2. REST API reference (`/api/v1`)

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/api/v1/assistants` | `dashboard:view` | List assistants (paginated; `?q=&domain=&isActive=`) |
| POST | `/api/v1/assistants` | `assistant:manage` | Create assistant |
| GET | `/api/v1/assistants/:id` | `dashboard:view` | Assistant detail (+ active knowledge) |
| PATCH | `/api/v1/assistants/:id` | `assistant:manage` | Update assistant |
| DELETE | `/api/v1/assistants/:id` | `assistant:manage` | Delete assistant |
| GET | `/api/v1/providers` | `dashboard:view` | List providers (+ assistant counts) |
| GET | `/api/v1/providers/:id` | `dashboard:view` | Provider detail |
| PATCH | `/api/v1/providers/:id` | `provider:manage` | Toggle active / update config |
| GET | `/api/v1/conversations` | `dashboard:view` | List conversations (`?assistantId=&q=`) |
| GET | `/api/v1/conversations/:id` | `dashboard:view` | Conversation + messages + evals + feedback |
| GET | `/api/v1/audit-logs` | `audit:view` | Read audit trail (`?entity=&userId=`) |

### Response envelopes
```jsonc
// success (single)          // success (list)                     // error
{ "data": { ... } }          { "data": [...], "meta": {            { "error": {
                               "page": 1, "pageSize": 20,             "code": "VALIDATION_ERROR",
                               "total": 42, "totalPages": 3 } }       "message": "...",
                                                                      "details": { ... } } }
```

### Pagination
`?page=1&pageSize=20` (pageSize max 100). Defaults: page 1, size 20.

---

## 3. ✅ Verified behavior (tested against the running server)
| Test | Result |
|---|---|
| `GET /providers` as admin | `200` — 7 providers with `_count.assistants` |
| `GET /assistants` as admin | `200` — HR Helpdesk with provider relation |
| `POST /assistants` (valid) | `201` — Finance Bot created |
| `POST /assistants` (missing fields) | `400 VALIDATION_ERROR` with per-field messages |
| `POST /assistants` as **analyst** | `403 FORBIDDEN` (RBAC enforced) |
| `GET /audit-logs` | `200` — shows `assistant.create` by Ava Admin |
| `DELETE /assistants/:id` | `204`, then `404` on refetch |

*(All Phase-4 code also passes `tsc --noEmit` with zero errors. Test data was cleaned up — DB is back to seed state.)*

---

## 4. Key decisions
| Decision | Why |
|---|---|
| **`route()` HOF wrapper** | Keeps handlers thin; auth/RBAC/errors/logging in one place (DRY, SOLID) |
| **Singleton services with constructor-default DI** | Simple in prod (`assistantService`), still mockable in tests (`new AssistantService(mockRepo)`) |
| **Audit failures never break the action** | `AuditService.record` swallows+logs errors — observability shouldn't cause outages |
| **`export const runtime = "nodejs"`** on routes | Guarantees Prisma runs on Node, never edge |
| **Conversation write-path deferred** | `sendMessage` needs the AI adapter → built in Phase 6 |

---

## 5. 🔧 Manual setup steps
- **None.** No new dependencies or accounts. Everything runs on the existing setup.

## 6. ✔️ Verification checklist (optional — run yourself)
1. `npm run dev`, then log in as admin to get a session cookie in the browser.
2. Visit `http://localhost:3000/api/v1/providers` → JSON list of 7 providers.
3. Visit `http://localhost:3000/api/v1/assistants` → HR Helpdesk.
4. Log in as `analyst@convoinsight.ai` → a `POST` to `/api/v1/assistants` returns `403`.
5. `npx prisma studio` → `AuditLog` table records actions you performed.

## 7. ⚠️ Common errors
| Symptom | Cause | Fix |
|---|---|---|
| `401 UNAUTHORIZED` on API | Not logged in / no session cookie | Sign in first; APIs require a session |
| `403 FORBIDDEN` | Role lacks the permission | Use an account with the right role (see RBAC matrix) |
| `400 VALIDATION_ERROR` | Body failed Zod schema | Check the `details.fieldErrors` in the response |
| `500 INTERNAL_ERROR` | Unexpected (e.g. DB down) | Check server logs; verify `DATABASE_URL` |

---

## 8. Files created this phase
```
src/lib/
├── api/{response.ts, handler.ts}
├── errors/{api-error.ts, handler.ts}
├── logger/logger.ts
└── validation/{common.ts, assistant.schema.ts, provider.schema.ts}
src/server/
├── repositories/{assistant, provider, conversation, audit}.repository.ts
└── services/{assistant, provider, conversation, audit}.service.ts
src/app/api/v1/
├── assistants/route.ts
├── assistants/[id]/route.ts
├── providers/route.ts
├── providers/[id]/route.ts
├── conversations/route.ts
├── conversations/[id]/route.ts
└── audit-logs/route.ts
```
*(also updated `src/lib/auth/rbac.ts` to share `ForbiddenError`.)*

---

## 9. Next phase — Phase 5
**Frontend UI + Dashboard + Components:** the shadcn/ui component library, the AppShell (sidebar + topbar + breadcrumbs + dark mode), the typed API client + React Query hooks, reusable UI kit (KpiCard, DataTable, ChartCard, FilterBar, EmptyState, Skeletons, Toasts), and the real **Dashboard** + **Assistants** pages wired to these Phase-4 APIs.
