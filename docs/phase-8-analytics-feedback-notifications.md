# ConvoInsight AI — Phase 8: Analytics, Feedback & Notifications

> **Status:** Phase 8 of 9 — Analytics dashboard, message Feedback, and a Notifications center (Audit Logs shipped in Phase 4)
> **Date:** 2026-07-03

---

## 1. What was built

### Analytics
- **Backend:** `analytics.repository.ts` + `analytics.service.ts` — computes, live over a 30-day window: quality **trend by day**, **per-assistant** correctness/hallucination, **per-provider** usage, and **governance outcome** distribution.
- **API:** `GET /api/v1/analytics?windowDays=30` (permission `analytics:view`).
- **UI:** `/analytics` — KPI row, a **line chart** (correctness vs hallucination trend), a **horizontal bar** (correctness by assistant), and governance-outcome + provider-usage panels. Graceful empty states when there's no data.

### Feedback
- **Backend:** `feedback.repository.ts` + `feedback.service.ts` — one vote per user per message (upsert), plus a paginated list.
- **API:** `POST /api/v1/feedback` (permission `feedback:create`), `GET /api/v1/feedback` (list).
- **UI:** `FeedbackControl` (thumbs up / thumbs down with an optional comment dialog) embedded in the **Playground** and **Conversation detail**; a `/feedback` page listing all ratings.

### Notifications
- **Backend:** `notification.repository.ts` + `notification.service.ts` — emits an alert whenever a response is **FLAGGED or BLOCKED** by governance (wired into `ConversationService.sendMessage`); inbox list + unread count + mark-read/mark-all-read.
- **API:** `GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id`, `POST /api/v1/notifications/read-all`.
- **UI:** `/notifications` page + a **topbar bell** with a live unread-count badge (polls every 60s).

### Nav
Enabled: Analytics, Feedback, Notifications ("Soon" badges removed). **All 14 modules are now live.**

---

## 2. ✅ Verified end-to-end (live server, real DB)
| Feature | Result |
|---|---|
| Blocked response → notification | `GOVERNANCE_BLOCK` created; unread count = 1 |
| Submit feedback (DOWN + comment) | Saved; appears in feedback list |
| Feedback list | Returns rating + comment + assistant |
| Analytics | 3 evals · avg correctness 33.3 · avg hallucination 70.7 · governance PASS:1/BLOCK:2 · trend + per-assistant data |
| `tsc --noEmit` | **0 errors** |

*(Test data cleaned up — DB restored to clean seed state.)*

---

## 3. Key decisions
| Decision | Why |
|---|---|
| **Analytics computed live** | No warehouse needed for the MVP; accurate and simple |
| **Notifications emitted only on FLAG/BLOCK** | Signal, not noise — PASS responses don't alert |
| **Feedback = one vote per user/message (upsert)** | Changing your mind updates, not duplicates |
| **Bell polls every 60s** | Near-real-time without websockets |
| **Notification failures never break generation** | `notifyGovernance` swallows + logs errors |

---

## 4. 🔧 Manual setup steps
- **None.** No new dependencies or accounts.

## 5. ✔️ Verification checklist (run yourself)
1. `npm run dev` → log in as **admin**.
2. **Playground** → ask a grounded question → 👍/👎 on the response (👎 opens a comment box).
3. Ask an ungrounded question (e.g. "Who won the 2018 world cup?") → it's **BLOCKED** → the **bell** shows a red badge.
4. Click the **bell** → **Notifications** lists the governance alert → **Mark all read** clears the badge.
5. **Feedback** page lists your ratings.
6. **Analytics** shows the trend line, correctness-by-assistant bar, and governance outcomes.

## 6. ⚠️ Common errors
| Symptom | Cause | Fix |
|---|---|---|
| Feedback buttons missing | Logged in as Analyst | `feedback:create` is Admin/Reviewer only |
| Empty analytics/charts | No evaluations yet | Generate responses in the Playground |
| Bell badge not updating | 60s poll interval | It refreshes automatically, or reload |

---

## 7. Files created/changed this phase (high level)
```
src/server/repositories/{analytics,feedback,notification}.repository.ts
src/server/services/{analytics,feedback,notification}.service.ts
src/server/services/conversation.service.ts            (emits notifications)
src/lib/validation/feedback.schema.ts
src/app/api/v1/analytics/route.ts
src/app/api/v1/feedback/route.ts
src/app/api/v1/notifications/route.ts + [id]/route.ts + read-all/route.ts
src/app/(dashboard)/{analytics,feedback,notifications}/page.tsx
src/components/features/feedback/feedback-control.tsx
src/components/layout/notification-bell.tsx + app-shell.tsx
src/types/api.ts + src/lib/api-client/hooks.ts
src/components/layout/nav-config.ts                     (enabled 3 modules)
```

---

## 8. Next phase — Phase 9 (final)
**Testing + Deployment + README + Presentation:** a README + API docs + deployment guide (Vercel + Neon), a production build check, seed polish for the demo, the 5-minute demo script, 10-slide deck outline, and judge Q&A.
