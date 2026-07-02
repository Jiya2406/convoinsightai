# ConvoInsight AI — Phase 5: Frontend UI, Dashboard & Components

> **Status:** Phase 5 of 9 — shadcn/ui kit, AppShell, typed API client + React Query, Dashboard, Assistants, Providers, Conversations, Audit Logs
> **Date:** 2026-07-02

---

## 1. What was built

### UI primitives (`src/components/ui`) — hand-authored shadcn/ui
button, card, input, textarea, label, badge, table, skeleton, separator, avatar, dropdown-menu, dialog, select, sonner (toaster). All themeable via CSS variables (light/dark).

### Reusable shared kit (`src/components/shared`)
| Component | Purpose |
|---|---|
| `PageHeader` | Title + description + actions |
| `KpiCard` | Metric card with icon, accent, loading skeleton |
| `ChartCard` | Card wrapper for charts |
| `DataTable<T>` | Generic table: columns config, skeleton loading, empty state, pagination |
| `EmptyState` / `ErrorState` | Consistent empty/error placeholders |
| `ThemeToggle` | Light/dark switch (SSR-safe) |

### App shell (`src/components/layout`)
- **`AppShell`** — fixed sidebar (desktop) + slide-in sidebar (mobile) + sticky topbar + scrollable main.
- **`SidebarNav`** — grouped nav, filtered by RBAC permissions; unbuilt modules show a **"Soon"** badge (no dead links).
- **`Breadcrumbs`**, **`UserMenu`** (avatar + role + sign out).

### Data layer (`src/lib/api-client`)
- **`client.ts`** — typed fetch wrapper understanding `{data}`/`{data,meta}`/`{error}`; throws `ApiClientError`.
- **`hooks.ts`** — React Query hooks: `useDashboardStats`, `useAssistants`, `useAssistant`, `useCreateAssistant`, `useUpdateAssistant`, `useDeleteAssistant`, `useProviders`, `useUpdateProvider`, `useConversations`, `useAuditLogs`.

### Pages (`src/app/(dashboard)`)
| Route | Highlights |
|---|---|
| `/dashboard` | 8 KPI cards, "Assistants by Domain" bar chart (Recharts), Provider Health, Most-Used/Needs-Attention, Recent Activity — all from `/api/v1/dashboard/stats` |
| `/assistants` | DataTable + search (debounced) + domain filter + create/edit dialog (react-hook-form + Zod) + delete confirm; manage actions gated by RBAC |
| `/providers` | Provider cards with status badges; admins can activate/deactivate wired providers |
| `/conversations` | DataTable + search (empty until Playground in Phase 6) |
| `/audit-logs` | DataTable of the immutable audit trail |

### New backend endpoint
`GET /api/v1/dashboard/stats` — live aggregate KPIs (repository + service added).

### Infra wiring
Root `Providers` (React Query + SessionProvider + next-themes + Toaster); `(dashboard)/layout.tsx` guards on the server and renders the AppShell; polished login page.

---

## 2. ✅ Verified (against running server, logged in as admin)
| Check | Result |
|---|---|
| `/dashboard`, `/assistants`, `/providers`, `/conversations`, `/audit-logs` | all `200` |
| `GET /api/v1/dashboard/stats` | `200` — real data (1 assistant, 7 providers, 2 active, HR domain) |
| `tsc --noEmit` | **0 errors** |

---

## 3. Key decisions
| Decision | Why |
|---|---|
| **Hand-authored shadcn components** | No interactive CLI needed; full control; no lock-in |
| **React Query** | Cache + loading/error states → skeletons & toasts fall out naturally |
| **RBAC in the UI + API** | UI hides actions the role can't do; API still enforces (defense in depth) |
| **"Soon" badges for unbuilt modules** | Full product surface visible without dead links |
| **Dashboard computes live** | Real numbers now; graceful empty states where no data yet |
| **Server-side layout guard** | Prisma/bcrypt stay off the edge |

---

## 4. 🔧 Manual setup steps
- **None** beyond the deps already installed (Radix UI, react-hook-form, tailwindcss-animate).

## 5. ✔️ Verification checklist (run yourself)
1. `npm run dev` → log in as **admin@convoinsight.ai / Passw0rd!**.
2. **Dashboard** shows KPI cards, the domain bar chart (HR = 1), and Provider Health.
3. **Assistants** → click **New assistant**, fill the form, save → toast + row appears.
4. Edit and delete an assistant → toasts; audit entries appear on the Dashboard.
5. Toggle **dark mode** (top-right) — everything restyles.
6. Resize to mobile width → sidebar collapses into the ☰ menu.
7. Log in as **analyst@convoinsight.ai** → the "New assistant" button and row actions are **hidden** (RBAC).

## 6. ⚠️ Common errors
| Symptom | Cause | Fix |
|---|---|---|
| Charts/blank on first paint | Data still loading | Skeletons show; resolves on fetch |
| Hydration warning on inputs | Browser form-filler extension | Benign; test in incognito |
| `401` in network tab then redirect | Session expired | Sign in again |
| "New assistant" missing | Logged in as Reviewer/Analyst | Expected — RBAC; use Admin |

---

## 7. Files created this phase (high level)
```
src/app/providers.tsx
src/app/(auth)/login/page.tsx                      (polished)
src/app/(dashboard)/layout.tsx                      (AppShell)
src/app/(dashboard)/{dashboard,assistants,providers,conversations,audit-logs}/page.tsx
src/app/api/v1/dashboard/stats/route.ts
src/components/ui/*                                  (14 primitives)
src/components/shared/*                              (7 kit components)
src/components/layout/*                              (app-shell, sidebar-nav, nav-config, breadcrumbs, user-menu)
src/components/features/assistants/*                 (form + delete dialogs)
src/lib/api-client/{client,hooks}.ts
src/lib/format.ts
src/lib/auth/use-permissions.ts
src/server/repositories/dashboard.repository.ts
src/server/services/dashboard.service.ts
src/types/api.ts
```

---

## 8. Next phase — Phase 6
**AI Adapter + Mock AI + knowledge.json + Playground:** the `AIAdapter` interface + factory, `MockAIAdapter` (grounded on `knowledge.json`) as default, `GeminiAdapter` (free tier), the deterministic `Evaluator` (10 metrics), the `ConversationService` write path (send → generate → evaluate → govern → persist), and the **Playground** UI. This makes the Dashboard/Conversations pages fill with real data.
