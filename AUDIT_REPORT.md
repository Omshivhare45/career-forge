# CareerForge — Full Codebase Audit Report

> Read-only audit. No files modified. Findings reference current tree `file:line` locations. Items that could not be proven statically are flagged `UNVERIFIED — requires runtime verification.`

---

## 1. Executive Summary

CareerForge is a full-stack career-guidance + skill-tracking platform (React 19 + Vite + Tailwind v4; Express/Mongoose; MongoDB). It is not merely "YouTube resources": it ships roadmaps/phases, DSA + web-dev + academics modules, a Judge0 code runner, badges/certificates/XP/streaks, AI chat, an admin dashboard, PWA, and device/version analytics.

**Health: feature-rich but engineering-fragile.** Top issues, in order:

1. **Progress & certificates are forgeable by any student** — the "Dev: Pass" button (a demo cheat) is present in *production* code, and the server trusts client-sent `passed`, `status`, `score`, and arbitrary `topicId` values with no validation (`Assessments.jsx:52–70`, `progressController.js:360–397, 523–587, 176–356`).
2. **A public HTTP endpoint can force a destructive DB re-seed** (`server.js:85–103`), and seed branches are DELETE-then-INSERT (`seedAll.js`).
3. **The marquee "jobs aggregated from LinkedIn/Naukri" is a hardcoded mock** with fake links (`jobController.js`).
4. **Hardcoded admin/student credentials** compile into the client bundle and seed defaults (`Login.jsx:75,94`).
5. **Zero automated tests** anywhere in the repo.
6. **Two parallel progress systems** (embedded `User.domainsProgress` vs. `UserProgress` collection) plus 5 copies of the same `getProgressKey` helper.
7. **Committed dev/debug artifacts** (`clean_dash.js`, `yt_*.json`, `invalid_emails_report.txt`, debug screenshot).
8. **No server-side logout** — JWTs live in `localStorage`; "log out" only deletes the token.

The core demo loop works: authenticate → pick a domain → watch videos → solve problems → earn XP/badges → certificates. The 7-phase refactoring order is Section 13.

---

## 2. Architecture Map

```
client/  React 19 + Vite + Tailwind v4 + react-router v7
  src/
    main.jsx                GoogleOAuthProvider + app bootstrap
    App.jsx                 ALL routes eagerly imported (no React.lazy)
    context/AuthContext.jsx cf_token / cf_user in localStorage
    api/axios.js            baseURL: VITE_API_URL -> dev http://localhost:5001,
                            prod https://careerforge-nkf0.onrender.com; /api prefix;
                            Bearer cf_token; 401 -> redirect /login
    components/             Layout, Navbar, ProtectedRoute, GlobalAiChat,
                            InstallPrompt, CodeEditor, BadgeVisual
    pages/                  Dashboard, Roadmap, TopicDetail (191 KB),
                            ZeroToCoding, Assessments, Academics*, Jobs,
                            AiChat, Profile, AdminDashboard (103 KB) + admin/*
    utils/                  dsaContent (166 KB) + arrays/graph/trees/dp/
                            linkedList/stackQueue/recursion/greedy/dsaSheet/
                            striverA2Z/perSite/webDevContent + xpSystem
  vite.config.js            PWA autoUpdate (5 MB cache cap), dev proxy -> :5000

server/  Express 4 + Mongoose 8 (CommonJS)
  server.js                 22 route mounts + /api/health + seed trigger
  config/db.js              MONGODB_URI || MONGO_URI; MongoMemoryServer fallback
  middleware/               auth.js, authMiddleware.js (DUPLICATE), errorHandler, upload
  controllers/ 21            models/ 23        routes/ 22 files
  services/                 codeRunnerService (Judge0), progressService (UserProgress),
                            analyticsService
  seeds/                    seedAll.js, topicData, dsaLoveBabbar, webDevSeed, academicSeed
  scripts/                  reportInvalidEmails, testAnalyticsFlow, verifyAcademics
                            (9 more referenced by package.json are MISSING)
```

- Deployment: Render (`render.yaml`, `MONGO_URI`) is the live origin; stale `vercel.json` points at `api/index.ts`. Server defaults to port `5000`.
- **Dev proxy mismatch:** vite proxy targets `:5000` (vite.config.js:48) but axios dev baseURL is `:5001` → proxying is effectively dead; dev clients hit the API directly (CORS allows localhost).

---

## 3. Feature Map

| Feature | Location | Status |
|---|---|---|
| Auth (email/password + Google) | `routes/auth.js`, `authController.js` | Works; **no logout/session revocation** |
| Roles (admin/student/mentor) | `User.js`, auth middlewares | Partially enforced; mentor flows broken |
| Domain selection + progress | `progressController.selectDomain/completeTopic` | Works; integrity flaws (§4) |
| Roadmap: 3 views | `Roadmap.jsx` (1,121 ln) | Journey = server-backed; Company/Striver sheets = hardcoded client data + localStorage |
| TopicDetail learning steps | `TopicDetail.jsx` (3,742 ln) | Video + assessment steps + checkpoints |
| Code runner (Judge0) | `codeRunnerService.js`, `codeController.js` | Works only if `JUDGE0_API_URL` + RapidAPI keys configured |
| Badges / Certificates / XP / Streaks | `progressController` | Server-rewarded; forgeable (§4) |
| Academics (semesters/branches/subjects/videos) | `academicController`, `ManageAcademics.jsx`, `Academics*` | Present; video pipeline fragile |
| Jobs board | `jobController.js` | **MOCK — hardcoded fake jobs** |
| AI chat | `aiController.js`, `GlobalAiChat.jsx` | Mock unless real API key; mock emits odd `file:///roadmap` link |
| Feedback | `feedbackController.js`, `Feedback.js` | Works; 24h anti-spam |
| Admin dashboard | `AdminDashboard.jsx` (1,770 ln) | Extensive CRUD + analytics; several bugs |
| Analytics (device/version/platform) | `adminAnalyticsRoutes`, `deviceAnalyticsRoutes`, `PlatformAnalytics.jsx` | Present |
| PWA | `InstallPrompt.jsx` + `vite-plugin-pwa` | Installable, but no offline routing, manifest lacks scope/id |
| Cloud credits / resources | `cloudCredits.js`, `resources.js` | Static seeded content |

---

## 4. Critical Bugs (required per-bug format)

### P0-1 — "Dev: Pass" assessment button ships in production
- **Severity:** P0 (integrity / certification forgery)
- **Location:** `client/src/pages/Assessments.jsx:52–70` and `:155–162`
- **Function:** `handleSimulatePass`
- **Problem:** A button `Dev: Pass` (title "For MVP demo: Simulate passing score") posts `{passed:true, score:random}` to `/api/progress/submit-assessment`. Unlike the dev quick-login, it is **not** gated by `import.meta.env.DEV`.
- **Why bug:** Every production student can "pass" every test without taking it; `testResults`, XP, activityLog, phase-advance and related certificates are permanently falsified.
- **Repro:** Student login (prod) → Assessments → unlocked test → click "Dev: Pass".
- **Expected:** No such control in prod (or server rejects fake submissions).
- **Actual:** Random passing score recorded; UI shows "Verified Mastery".
- **Fix:** Gate behind `import.meta.env.DEV`; remove on prod; treat assessment completion as real or stub server-side.

### P0-2 — `submitAssessment` has zero server-side validation
- **Severity:** P0
- **Location:** `server/controllers/progressController.js:360–397`
- **Function:** `exports.submitAssessment`
- **Problem:** Accepts `{assessmentId, score, passed}` with no check that the assessment exists, belongs to the user's domain, is unlocked, or that `score >= passingScore`. `passed` is trusted verbatim.
- **Why bug:** Even without P0-1, `curl` can forge passing results and bypass all level-gating.
- **Repro:** `POST /api/progress/submit-assessment` with any `assessmentId`, `passed:true`, `score:100`.
- **Expected:** Server verifies assessment existence/ownership/threshold; enforces attempt rules.
- **Actual:** Result pushed into `domainsProgress[key].testResults` and saved unconditionally.
- **Fix:** Real assessor flow; validate against `Assessment` (passingScore, domainId); idempotency.

### P0-3 — Unauthenticated HTTP endpoint forces destructive re-seed
- **Severity:** P0 (data loss)
- **Location:** `server/server.js:85–103`
- **Function:** `GET /api/health/seed-db-migration`
- **Problem:** Public GET runs `seedDB(force)` when `?secret === JWT_SECRET`. With `force=true` the seed safety abort is bypassed; webdev + academics branches **DELETE all Phases/Topics/Badges** then re-insert.
- **Why bug:** The JWT signing secret gates destructive DB ops and travels in a URL (log leakage). Knowledge of the secret = DB content wipe/re-seed.
- **Repro:** `GET /api/health/seed-db-migration?force=true&secret=<JWT_SECRET>`.
- **Expected:** Seeding CLI-only with a dedicated secret and idempotent upserts.
- **Actual:** Content clobbered/re-created with new IDs; deep links go stale.
- **Fix:** Remove route; make seed branches upsert-by-slug; keep migration CLI-only.

### P0-4 — `submitCode` trusts client-sent `status`
- **Severity:** P0 (progress/XP forgery)
- **Location:** `server/controllers/progressController.js:523–587`
- **Function:** `exports.submitCode`
- **Problem:** `status === 'Accepted'` in the request body auto-completes the topic (+100 XP, notes "Solved via LeetCode IDE playground!"); `runtime` is even mocked via `Math.random()` when absent (line 545).
- **Why bug:** Verdict asserted by client → anyone can mint XP/completions/certificates by POSTing any `topicId` with `status:'Accepted'`.
- **Repro:** `POST /api/progress/submit-code` with `{topicId:"<any>", status:"Accepted", code:""}`.
- **Expected:** Verdict derived server-side from the code runner; rewards only on actual acceptance.
- **Actual:** Any status string accepted; XP/topic completion granted unconditionally.
- **Fix:** Move judge result computation server-side; never accept `status` from client.

### P0-5 — `completeTopic` lets users complete ANY topic
- **Severity:** P0
- **Location:** `server/controllers/progressController.js:176–356`
- **Function:** `exports.completeTopic`
- **Problem:** Only checks an active domain exists; `topicId` is unvalidated (existence/domain/phase). Every completion pushes `completedTopics`, feeds phase auto-advance (+500 XP, badges, line 298), fast-track bonus (line 312), and certificate at overallProgress≥100 (line 318).
- **Why bug:** Students can mark every topic complete → full level/certificate bypass.
- **Repro:** For any unowned topicId: `POST /api/progress/complete-topic`.
- **Expected:** Verify topic→phase→domain chain and progression order.
- **Actual:** Everything accepted; progress spikes to 100%.
- **Fix:** Server-side verification of topic/phase/domain + ordering before awarding.

### P1-1 — Hardcoded admin credentials in client source
- **Severity:** P1
- **Location:** `client/src/pages/Login.jsx:66–126`
- **Function:** Dev quick-login bypass
- **Problem:** Literal creds `admin@careerforge.com` / `Admin@123` (line 75) and `student.test@careerforge.com` / `Student@123` (lines 94–95). Button is `import.meta.env.DEV`-gated, but the literals compile into the bundle/sourcemap.
- **Why bug:** If prod admin still uses seed defaults, an attacker extracting the bundle can sign in as admin.
- **Repro:** `grep "Admin@123" dist/`.
- **Expected:** No credential literals in client code.
- **Actual:** Credentials ship to prod artifacts.
- **Fix:** Remove literals; dev bypass via server-side dev flag; rotate any live creds.

### P1-2 — Mentor feedback always 500s (schema mismatch)
- **Severity:** P1 (broken feature)
- **Location:** `server/routes/admin.js:14` → `adminController.sendFeedback` vs `models/Feedback.js`
- **Function:** Mentor "send feedback" flow
- **Problem:** Inserts `{mentorId, studentId, message, type}` into `Feedback`, whose schema requires `userId`, `rating` (1–5), `feedbackText` (≤500). Extras stripped; required fields missing → Mongoose validation error.
- **Why bug:** Mentors can never send feedback.
- **Repro:** Mentor POST `/api/admin/mentor/feedback` → 500 `Feedback validation failed`.
- **Expected:** Feedback stored/delivered.
- **Actual:** 500 every time.
- **Fix:** Map into `Feedback` correctly (userId=student, feedbackText+rating) or add a dedicated `MentorFeedback` model.

### P1-3 — `getMyFeedback` unauthenticated-role, always empty
- **Severity:** P1
- **Location:** `server/routes/admin.js:15`, `adminController.getMyFeedback`
- **Function:** Feedback inbox for mentor
- **Problem:** Route has `protect` but no `authorize` → any authenticated user may call. Queries `studentId: req.user.id` — not a real field on `User` → Mongoose silently ignores → always `[]`.
- **Why bug:** Broken access control + permanently empty dataset.
- **Repro:** Any JWT → GET `/api/admin/feedback/my` → `[]` (200).
- **Expected:** Mentor/admin-only; returns actual rows.
- **Actual:** Empty for everyone.
- **Fix:** Add `authorize('mentor','admin')`; store/query by real fields.

### P1-4 — Jobs board is a hardcoded mock, sold as "aggregated"
- **Severity:** P1 (trust)
- **Location:** `server/controllers/jobController.js`; mounted `server.js:77`
- **Function:** `getJobs`
- **Problem:** "Aggregated from LinkedIn and Naukri" is a static `jobDatabase` with invented companies/roles and non-functional platform links.
- **Why bug:** False feature claim; users cannot apply; erodes product trust.
- **Repro:** Open Jobs page; inspect returned links/data.
- **Expected:** Real aggregation or clearly labeled sample data.
- **Actual:** Mock presented as live jobs.
- **Fix:** Real API/rss integration, or relabel "Demo data".

### P1-5 — XSS via `innerHTML` in global error handler
- **Severity:** P1
- **Location:** `client/index.html:16–17`
- **Function:** Global `error` listener
- **Problem:** `innerHTML +=` injects `e.message` / `e.filename` — attacker-controllable strings render as HTML in the page (dangerous alongside localStorage JWTs).
- **Why bug:** Self-XSS / hash-payload XSS in page context.
- **Repro:** `throw new Error('<img src=x onerror=alert(1)>')`; observe injected DOM.
- **Expected:** Text-only rendering.
- **Actual:** Raw HTML appended.
- **Fix:** Use `textContent`, or JSON.stringify message before insertion.

### P1-6 — No logout endpoint / session revocation
- **Severity:** P1
- **Location:** `server/routes/auth.js` (register/login/google/me/profile only)
- **Function:** Auth lifecycle
- **Problem:** No `POST /logout`. Tokens in `localStorage`; logout clears client token only.
- **Why bug:** Stolen tokens stay valid; no device/session management despite a `DeviceSession` model existing.
- **Repro:** Sign in → capture JWT → "log out" → replay JWT: still valid.
- **Expected:** Server-side revocation.
- **Actual:** Token valid until expiry.
- **Fix:** Logout endpoint + short-access/long-refresh or session collection (reuse `DeviceSession`).

### P1-7 — Non-idempotent, destructive seed branches
- **Severity:** P1 (ops)
- **Location:** `server/seeds/seedAll.js` (webdev: deleteMany Phases/Topics/Badges; academics: delete-all-then-insert)
- **Problem:** Re-running the seed re-creates content with new IDs.
- **Why bug:** Invalidates deep links, `TopicDetail` URLs, user `contextData`, checkpoint references.
- **Repro:** Seed twice; watch IDs/URLs change.
- **Expected:** Idempotent upserts keyed on slugs.
- **Actual:** DELETE + INSERT; ID churn.
- **Fix:** Upsert-by-slug; remove delete-many.

---

## 5. Security

- **Client-trusted integrity (P0-1..P0-5, P1-6):** the server consistently trusts client-declared outcomes ("passed", "Accepted", scores, completed topicIds) instead of computing/verifying them.
- **JWT:** symmetric JWT in `localStorage` (`cf_token`/`cf_user`); axios 401 → hard redirect `/login`. No refresh rotation. XSS-exposable.
- **CORS:** `server.js:27–41` allows any `localhost`, any `*.vercel.app`, any `*.netlify.app` — broad trust incl. third-party subdomains.
- **Rate limit:** global `/api/` limiter 200 req/15 min (prod), 10k dev; no per-route tuning.
- **Registration escalation:** mitigated — `authController.register` coerces client `role:'admin'` → `'student'` unless email matches hardcoded `omshivhare666@gmail.com`; stray roles sanitized (`3d8edf5`). `PUT /api/auth/profile` role edits UNVERIFIED.
- **Helmet:** defaults; CSP disabled in development (`server.js:21`); COOP relaxed.
- **Secrets in repo:** no `.env` tracked (root gitignore `/.env` — but the bare `.env` pattern matches nested too, confirmed not tracked). **Hardcoded creds exist** in seed defaults + client bundle + suggestionController recipient emails.
- **Email HTML injection:** `suggestionController.js` interpolates user `content` into an HTML email unsanitized (dead code today, but a phishing vector if mounted).
- **Uploads (multer):** existence verified; endpoint usage/size limits UNVERIFIED.
- **`invalid_emails_report.txt`** (committed) contains scraped user emails — privacy concern.

---

## 6. Performance

- **N+1 queries:** `getDashboard` (`progressController.js:426–433`) does per-topic `Topic.findById` in a loop; `getAssessmentsByDomain` (`assessmentController.js:31–49`) does a `Topic.find` per assessment.
- **No pagination:** `/api/admin/users` and `/api/submissions` load everything.
- **Embedded growth:** `User.domainsProgress[].completedTopics/codeSubmissions/testResults` grow unbounded → 16 MB Mongo doc ceiling risk; no sliding window.
- **Client bundle:** single eager chunk; no `React.lazy`, no vendor splitting; 191 KB `TopicDetail.jsx`, 166 KB `dsaContent.js`, + eight 43–140 KB content utils, 103 KB `AdminDashboard.jsx`.
- **PWA workbox:** `maximumFileSizeToCacheInBytes: 5MB`, no runtimeCaching/offline fallback.
- **`submitCode` `runtime` mocked** with `Math.random()` (misleading metrics).
- **No data-fetch lib / caching** (no react-query); per-page refetch.

## 7. Code Quality

- **`getProgressKey` duplicated 5×:** `progressService.js`, `aiController.js`, `assessmentController.js:6–14`, `progressController.js:10–22`, `Assessments.jsx:13–21` — drift already proven (progressController has richer fallbacks).
- **Two auth middleware modules:** `middleware/auth.js` vs `middleware/authMiddleware.js`; routes import one or the other (`routes/feedback.js` uses `authMiddleware`; `routes/auth.js`, `admin.js` use `auth`). Divergence UNVERIFIED.
- **Two progress systems:** embedded `User.domainsProgress` (controllers) vs `UserProgress` collection (`progressService.js`); `recomputeAggregates` reads `user.completedTopics` (nonexistent top-level) → aggregates always zero.
- **File monoliths:** `TopicDetail.jsx` 3,742 ln, `AdminDashboard.jsx` 1,770 ln, `Roadmap.jsx` 1,121 ln, `ZeroToCoding.jsx` ~1,400 ln, `PlatformAnalytics.jsx` ~900 ln.
- **Comment hygiene:** `models/User.js` literally contains `// Solution Rejected!! Don't push this code`; `server.js:155` stale restart comment.
- **Validation inconsistency:** `createAssessment(req.body)` accepts full body; `updateAssessment` uses `runValidators:true`; `completeTopic` accepts any body shape. Inconsistent depth everywhere.

## 8. Architectural Problems

1. **Client-trusted integrity:** all game-logic facts (XP, completions, verdicts, scores) are client-declared; server pet-protects instead of enforcing.
2. **Embedded vs collection progress duality** — two sources of truth will diverge.
3. **Session/device models exist** (`DeviceSession`, `UserSession`) but are wired to analytics only, not auth.
4. **Bolt-on academics module** — parallel models + `/api/admin/academics`; progress isolated from the main XP system.
5. **Deploy duality:** Vercel config points at stale `api/index.ts`; live origin is Render; dev proxy never used.
6. **Academics video pipeline:** users embed Drive/YouTube links via `embedLink`; some YouTube watch-URLs fail in iframes `UNVERIFIED — requires runtime verification`.
7. **No queue/event layer.** AI, email, analytics all run inline in request paths.

## 9. Dead Code & Unused Features (evidence)

- **`server/routes/suggestions.js`** — file exists (22 route files) but is **not mounted** in `server.js` (mount list lines 57–77). `suggestionController.js` `require('nodemailer')` — nodemailer **absent** from `server/package.json` deps → would crash if mounted. Dead.
- **Missing script targets (9):** `backfillTopicVideos.js`, `createAdmin.js`, `databaseMaintenance.js`, `migrateUsers.js`, `checkUserProgress.js`, `verifyAllPhases.js`, `testPhaseProgression.js`, `checkXP.js` + `db:*` scripts referenced in `server/package.json` that don't exist in `server/scripts/`.
- **Fake Roadmap XP:** "XP Claimed" = `solvedCount * 100` computed locally, never persisted (`Roadmap.jsx`).
- **Hardcoded sheets bypassing server:** `dsaSheetContent`, `striverA2ZContent` + localStorage keys `dsa_cp_done_*`, `a2z_cp_done`.
- **Committed junk:** `clean_dash.js`, `scratch_debug.js`, `login_search.txt`, `yt_data.json`, `yt_page.html`, `yt_page.png`, `yt_videos.json`, `yt_videos_scraped.json`, `server/invalid_emails_report.txt`, `client/src/verify_dsa_flow_1778991305596.webp`. (`server.out.log`/`server.err.log` gitignored via `*.log`.)
- **`middleware/upload.js` (multer):** presence verified; usage by any route UNVERIFIED.
- **`api/` dir / `vercel.json`:** config references `api/index.ts` (TS server) that appears stale; existence UNVERIFIED.
- **Hardcoded emails:** `omshivhare666@gmail.com` (admin gate + suggestion recipient), `ridamg636@gmail.com` (suggestion recipient).

## 10. Technical Debt (top items)

1. Five copies of `getProgressKey`.
2. Two auth middleware files; inconsistent imports.
3. Two progress systems (embedded + `UserProgress`).
4. Research/scrape scripts mixed into production trees.
5. Seed ID churn / manual topic-ID mapping drift.
6. `phaseNumber` zero-index math scattered across seeds (per-domain shifts).
7. No migration tooling — schema change = destructive re-seed.
8. `package.json` scripts pointing at missing files.
9. Fully typed-string `process.env` config; no env validation.
10. Eager page imports with no code splitting.

## 11. Missing Functionality

- No logout / session revocation / refresh rotation.
- No password reset or email verification (instant register).
- No pagination or search on users & submissions.
- No automated tests at all.
- No CI (no workflow config found).
- No real jobs integration (mock only).
- No offline PWA fallback; no manifest scope/id.
- No server-side judge-verdict persistence chain (verdict computed client-side in the playground flow).
- No mentor→student real feature path (broken by P1-2/P1-3).

## 12. Risk Matrix

| Risk | Likelihood | Impact | Priority |
|---|---|---|---|
| Certificate/progress forgery (P0-1..5) | High | High | Immediate |
| Force re-seed via HTTP secret (P0-3) | Med (secret leak) | Catastrophic | Immediate |
| Admin creds shipped in bundle (P1-1) | Med | High | High |
| Mock jobs presented as real (P1-4) | Certain | Med (trust) | High |
| DB doc growth past 16MB | Med | Med | Med |
| DX/proxy mismatch | Certain | Low | Low |

## 13. Recommended Refactoring Order (7 phases)

1. **Integrity lockdown (P0):** server-side validation for `submitAssessment`/`submitCode`/`completeTopic`; remove "Dev: Pass" from prod; remove/secure seed-trigger endpoint.
2. **Auth hardening (P1):** logout + revocation, credential literal removal, reset flow, CORS tightening, IPv6 of JWT storage (HTTP-only cookie or refresh pattern).
3. **Delete dead code (P1):** remove `suggestions` stack or wire it properly; delete committed debug/scratch files; fix npm script targets.
4. **Unify game state (P2):** collapse `UserProgress`→`domainsProgress` (or vice versa); DCE the duplicate `getProgressKey` into a shared util; dedupe auth middleware.
5. **Performance (P2):** fix N+1 (`$in`/aggregation), paginate admin/submissions endpoints, move heavy content out of bundle via lazy routes + code splitting.
6. **Seeds/migrations (P1/P2):** make all seed branches idempotent upserts; introduce a migration runner; stop deleting collections.
7. **Quality gates (P2/P3):** add tests (start with auth + progress integrity), CI on push, lint/typecheck scripts, then refactor monolith components.

## 14. Database Schema & Data Model

- **Models (23):** AcademicBranch, AcademicChapter, AcademicProgress, AcademicSemester, AcademicSubject, AcademicVideo, AppInstallation, Assessment, Badge, Certificate, ChatMessage, CloudCredit, DeviceSession, Domain, Feedback, Phase, PlatformAnalytics, Problem, Resource, Submission, Topic, User, UserProgress, WebDevProject, VersionAnalytics (enumeration is best-effort from `models/`).
- **`User`** embeds `domainsProgress` (`xp, currentPhase, overallProgress, completedTopics[], startedTopics[], testResults[], codeSubmissions[], videoProgress, lastOpenedTopic, currentCheckpoint, weakConcepts, aiContext, dsaStats`) plus `activityLog`, `earnedBadges`, `dailyStreak`, `totalXP`, `totalStudyMinutes`.
- **`Feedback.js`:** `userId` (req), `rating` (req, 1–5), `feedbackText` (req, ≤500), `isApproved` (default true). No `mentorId`/`studentId`/`message`/`type` — root cause of P1-2/P1-3.
- **`Topic.js`:** `phaseId`, `domainId` required; resource links `theoryLink, gfgLink, youtubeLink, documentationLink, practiceLink, notesLink`; isRequired, unlockAfterPreviousTopic, isCheckpointModule + `checkpoints[{id,label,description,youtubeLink}]`, index `{phaseId, order}`. **No `theoryCode`/`advancedCode` fields** — admin extras stripped silently.
- **`AcademicVideo.js`:** `videoType` enum `drive|youtube|s3|cloudinary` (default drive), `driveLink`, `embedLink`, `thumbnail`, `duration`, `isPublished`, `isActive`. **No `notesUrl` field** — `ManageAcademics` sends it; Mongoose strips it.
- **`AcademicProgress.js`:** `userId+subjectId` unique; `watchHistory[]` with `watchPercentage` 0–100, `timeSpent`, `completed`, `timestamps`.
- **Index summary:** Topic {phaseId, order}; AcademicProgress {userId, subjectId}; others partial — full index audit UNVERIFIED.
- **Schema oddity:** `Problem.judg0ProblemId` (typo for Judge0) seen in contentController paths.

## 15. API Surface & Route Map

Mounts (`server.js:57–77`); all under global rate limit:

```
POST   /api/auth/register|login|google      GET /api/auth/me      PUT /api/auth/profile
        (NO logout endpoint)
GET    /api/domains, /api/phases, /api/topics(/:id|/phase/:phaseId|/all|/:id/checkpoints)
POST   /api/progress/select-domain|start-topic|complete-topic|submit-assessment|
       study-time|submit-code|skip-phase|video-progress|webdev-project
GET    /api/progress/dashboard|heatmap|submissions/:topicId|webdev-project/:topicId
GET    /api/academics/semesters|branches|subjects          (academicController)
GET    /api/assessments/domain/:domainId  (protect) + admin CRUD (authorize admin)
GET    /api/badges, /api/resources, /api/cloud-credits, /api/certificates
POST   /api/ai/...        (chat/insights)  — mock unless AI_API_KEY
GET    /api/admin/stats|users|feedback|analytics/users/:userId
PUT    /api/admin/users/:id/role|progress              DELETE /api/admin/users/:id
GET    /api/admin/mentor/students   POST /api/admin/mentor/feedback
GET    /api/admin/feedback/my       (NO role gate — P1-3)
GET    /api/admin/academics/...      + /api/admin/analytics/route
POST   /api/device/...              (device analytics)
GET    /api/problems/...  POST /api/code/run  GET/POST /api/submissions/**
GET    /api/feedback (admin), POST /api/feedback (protect),
PATCH  /api/feedback/:id/toggle-approve (admin), DELETE /api/feedback/:id (admin)
GET    /api/jobs                     (mock)
GET    /api/health, GET /api/health/seed-db-migration?secret=JWT_SECRET  (P0-3)
NOT MOUNTED: routes/suggestions.js  →  dead
```

Client API usage confirmed: axios baseURL `VITE_API_URL` (dev `:5001`, prod Render), prefix `/api`, Bearer `cf_token`, 401 auto-redirect.

## 16. YouTube / Learning-Content Pipeline

- **Fully manual, DB-driven:** video links stored as plain strings — `Topic.youtubeLink`, `Topic.checkpoints[].youtubeLink`, `AcademicVideo.driveLink/embedLink`. No YouTube Data API in server deps (`google-auth-library` is for Google OAuth only).
- **No scraping in prod code.** Root `yt_videos.json`, `yt_data.json`, `yt_page.html`, `yt_videos_scraped.json` are committed research artifacts; the previous "aggregating free YouTube resources" premise is inaccurate — the platform is content-curated via seeds/admin.
- **TopicDetail client** (`getYouTubeEmbedUrl`, `appendYTParams`): regex-parses video URL → iframe embed with `enablejsapi=1`, `autoplay=1`, `origin`; drives progress via `POST /api/progress/video-progress` + start/complete topic.
- **Video sources seeded:** DSA via Love Babbar / Striver mixes (`dsaLoveBabbar.js`), webdev via Sheryians 13-video playlist (`webDevSeed.js`), academics per branch/subject.
- **Risks:** YouTube watch watch-URLs served inside iframes can be refused by YouTube unless Privacy-Enhanced (youtube-nocookie) — `UNVERIFIED — requires runtime verification`; Drive links require public sharing; redirects/timeouts unhandled in AcademicIframe `UNVERIFIED`.

## 17. User Journeys & UX Critical Issues

1. **Login → Dashboard:** ProtectedRoute: no user → `/login`; role mismatch → `/dashboard`; student without activeDomain → `/domains`; incomplete profile → `/setup-profile`.
2. **Learning loop:** pick domain → phases → TopicDetail (video → checkpoint quiz → code playground) → completion awards XP/badge; auto phase advance; certificate at 100%.
3. **Roadmap 'Company sheet'/'Striver' journeys are client-local** (localStorage) — progress disappears across devices and never affects certificates.
4. **Academics journey is a parallel track** — separate progress, no XP/badge integration.
5. **Jobs journey dead-ends** — links are fake; no apply flow.
6. **Assessments journey is gameable** (P0-1/2) and uses a placeholder HackerRank link (`ADMIN_WILL_ADD_HACKERRANK_ASSESSMENT_LINK` → generic skills page).
7. **Admin journey is large but fragile:** fine-grained CRUD exists; broken mentor feedback path; analytics embeds.

## 18. Testing

- **Zero tests.** Glob for `*.test.*`, `*.spec.*`, `__tests__` → no matches across the entire repo (client + server). No test scripts ready (package.json scripts reference missing util files).
- Testing frameworks available in deps: none for client; server has `mongodb-memory-server` (used at runtime, not for tests).
- Risk: the P0 integrity bugs shipped precisely because there is no contract/regression coverage.

## 19. Build & Deployment

- **Client:** `npm run build` → vite build + PWA. Manifest: no `scope`/`id`, 5 MB workbox cap, no offline fallback. `client/.env` keys: `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID` (public client id; note only).
- **Server:** `npm start` → node server.js; dev `npm run dev` (nodemon). In-memory Mongo fallback pre-seeds via seedAll when DB empty (non-prod). Prod with empty DB: warns and skips auto-seed.
- **Env mismatches:** `server/config/db.js` supports `MONGODB_URI || MONGO_URI`; `render.yaml` uses `MONGO_URI`. `vercel.json` references stale `api/index.ts`. Dev proxy `:5000` vs axios `:5001`.
- `NODE_ENV=development` disables CSP and raises rate limit to 10k; production caps at 200/15min.

## 20. Git / Repo Hygiene

- `.env` correctly **not tracked** (root gitignore bare `.env` matches nested; verified via `git ls-files`). `client/.env` and `server/.env` are ignored.
- **Committed junk to remove:** `clean_dash.js`, `scratch_debug.js`, `login_search.txt`, `yt_data.json`, `yt_page.html`, `yt_page.png`, `yt_videos.json`, `yt_videos_scraped.json`, `server/invalid_emails_report.txt`, `client/src/verify_dsa_flow_1778991305596.webp`. (`server.out.log`, `server.err.log` ignored via `*.log`.)
- Working tree has uncommitted changes: `client/package.json`, `client/package-lock.json`, `Navbar.jsx`, `TopicDetail.jsx`, `AdminDashboard.jsx`.
- Recent history is healthy branch/PR usage (academics PR #1–#3, analytics, quick-login).

## 21. Noteworthy Findings & Gotchas

- `import.meta.env.DEV` gating: used correctly for quick-login, **missing** for Dev:Pass — the single most important line-level discrepancy in the audit.
- `getProgressKey` returns `'dsa'` as the catch-all default (Assessments.jsx:14, system-wide), so unknown domains silently collapse into DSA progress.
- `submitCode` fake runtime + "Solved via LeetCode IDE playground!" note mix mock data into real history.
- Admin topic editor only exposes `youtubeLink` + `gfgLink` fields (video links), while `Topic` supports 6 resource links — admin can't manage theory/docs/practice/notes links.
- `academicController.getSubjects` computes per-subject progress inline; watch-history write patterns (`AcademicProgress`) separate from main XP.
- `mongodb-memory-server` in runtime deps means a misconfigured URI silently runs a local throwaway DB in non-prod — devs may think they're on Atlas.

---

## A. How to Verify (read-only checks, no installs)

- Start backend: `npm start` (port 5000 default). Start client: `npm run dev` (Vite 5173; axios hits 5001 — ensure backend runs there or set `VITE_API_URL`).
- With a student account, confirm: Dashboard XP after completing a topic, badges page, Assessments page "Dev: Pass" visibility.
- With a mentor account, attempt `/api/admin/mentor/feedback` → expect 500 (P1-2).
- `curl` the seed-trigger with `force=true` on a **throwaway** DB to confirm destructiveness (P0-3).

## B. Screenshot Evidence

- `client/src/verify_dsa_flow_1778991305596.webp` (committed debug screenshot) validates DSA flow visuals; not prod asset.

## C. Impact Scoring (how issues were scored)

P0 = data-integrity/cert forgery or destructive; P1 = broken feature / trust / access bug; P2 = quality/performance/debt; P3 = polish. `UNVERIFIED — requires runtime verification.` appended wherever static analysis could not conclude.

## D. High-Priority Fix Set (first sprint)

1. Remove Dev:Pass from prod + server-side validation of all `progress/*` POST bodies.
2. Delete/restrict the `seed-db-migration` endpoint.
3. Rotate/remove hardcoded credentials; add logout+revocation.
4. Fix mentor feedback schema mismatch + role gate.
5. Remove committed debug files; fix/npm-script dead targets.
6. Contract tests for auth + progress endpoints.

## E. Untracked In-Repo Work

Current dirty files (`git status`): `client/package.json`, `client/package-lock.json`, `client/src/components/Navbar.jsx`, `client/src/pages/TopicDetail.jsx`, `client/src/pages/admin/AdminDashboard.jsx` — recent feature edits not yet committed.

## F. Recommended Next Steps

- Decide: is this a demo/MVP or a production product? The fix set differs sharply (demo → gate & label mocks; product → integrity + tests + real integrations).
- Perform a runtime pass of the six `VERIFY` items in this report before the first production release.
- Split `TopicDetail.jsx`, `AdminDashboard.jsx`, `Roadmap.jsx` and the 100 KB+ content utils into modular units during phase 7.

---

*End of audit. Prepared without modifying the workspace.*