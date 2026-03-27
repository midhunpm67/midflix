# MidFlix — Design Specification
**Date:** 2026-03-27
**Stack:** Laravel 11 + React 18 + MongoDB
**Approach:** Vertical slices — each phase ships end-to-end

---

## 1. Project Brief

| Field | Value |
|---|---|
| Project name | MidFlix |
| What it does | Premium streaming platform for movies and TV series (Netflix/JioCinema-style) |
| Who uses it | Subscribers (viewers) + Admin (content management) |
| Revenue model | Subscription — 3 tiers (Basic, Standard, Premium). Free trial. No payment gateway at launch — manual activation. |
| Video delivery | Upload to AWS S3, FFmpeg HLS transcoding, CloudFront CDN |
| Database | Local MongoDB → Atlas later (zero code changes) |
| Team | Small team |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    React 18 SPA                      │
│  Vite + TypeScript + TanStack Query + Zustand        │
│  Tailwind + Shadcn/ui + Framer Motion + HLS.js       │
└───────────────────┬─────────────────────────────────┘
                    │ HTTPS / Axios
┌───────────────────▼─────────────────────────────────┐
│              Laravel 11 REST API                     │
│  /api/v1/*  ·  Sanctum Auth  ·  Spatie RBAC         │
│  FormRequests → Services → Repositories → Resources │
└───┬───────────────┬────────────────┬────────────────┘
    │               │                │
┌───▼───┐    ┌──────▼──────┐  ┌─────▼──────┐
│MongoDB│    │   Redis      │  │  Laravel   │
│(local)│    │cache/queue/  │  │  Horizon   │
│       │    │  sessions    │  │  (queues)  │
└───────┘    └─────────────┘  └─────┬──────┘
                                     │ FFmpeg Job
                              ┌──────▼──────┐
                              │  AWS S3     │
                              │  raw upload │
                              │  + HLS out  │
                              └──────┬──────┘
                                     │
                              ┌──────▼──────┐
                              │  CloudFront │
                              │  CDN (HLS   │
                              │  delivery)  │
                              └─────────────┘
```

**Key decisions:**
- Admin uploads raw video → S3 via presigned URL (direct from browser, bypasses Laravel)
- Laravel queues an FFmpeg Job → outputs HLS `.m3u8` + `.ts` chunks back to S3
- CloudFront serves HLS stream to the player via HLS.js
- No Mongoose — all DB via Laravel Eloquent-MongoDB
- Redis handles sessions, cache, and job queue (Horizon monitors)
- Two roles: `admin` and `subscriber` (Spatie Permission)

---

## 3. MongoDB Schema

### `users`
```json
{
  "_id": "ObjectId",
  "name": "String",
  "email": "String (unique, indexed)",
  "password": "String (hashed)",
  "role": "admin | subscriber",
  "avatar": "String | null",
  "is_active": "Boolean",
  "email_verified_at": "Date | null",
  "subscription": {
    "plan": "free | basic | standard | premium",
    "status": "trial | active | expired | cancelled",
    "trial_ends_at": "Date | null",
    "expires_at": "Date | null"
  },
  "timestamps": "created_at, updated_at"
}
```
*Subscription embedded — always read with user, no independent lifecycle.*

### `content`
```json
{
  "_id": "ObjectId",
  "title": "String (indexed)",
  "slug": "String (unique, indexed)",
  "type": "movie | series",
  "synopsis": "String",
  "poster_url": "String",
  "backdrop_url": "String",
  "trailer_url": "String | null",
  "genres": ["String"],
  "language": "String",
  "release_year": "Number (indexed)",
  "rating": "String (PG | PG-13 | R | etc)",
  "imdb_rating": "Number | null",
  "duration_minutes": "Number | null (movies only)",
  "is_published": "Boolean (indexed)",
  "required_plan": "free | basic | standard | premium",
  "video": {
    "hls_url": "String | null",
    "status": "pending | processing | ready | failed"
  },
  "timestamps": "created_at, updated_at"
}
```
*`video` embedded on movies only — series videos live on episodes.*

### `seasons`
```json
{
  "_id": "ObjectId",
  "content_id": "ObjectId (indexed)",
  "number": "Number",
  "title": "String",
  "synopsis": "String | null",
  "timestamps": "created_at, updated_at"
}
```

### `episodes`
```json
{
  "_id": "ObjectId",
  "season_id": "ObjectId (indexed)",
  "content_id": "ObjectId (indexed)",
  "number": "Number",
  "title": "String",
  "synopsis": "String | null",
  "duration_minutes": "Number",
  "thumbnail_url": "String | null",
  "video": {
    "hls_url": "String | null",
    "status": "pending | processing | ready | failed"
  },
  "timestamps": "created_at, updated_at"
}
```
*`content_id` on episodes avoids double-join when loading the player.*

### `watch_history`
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (indexed)",
  "content_id": "ObjectId (indexed)",
  "episode_id": "ObjectId | null",
  "progress_seconds": "Number",
  "duration_seconds": "Number",
  "completed": "Boolean",
  "watched_at": "Date",
  "timestamps": "created_at, updated_at"
}
```
*Compound index on `[user_id, content_id]` for Continue Watching queries.*

### `genres`
```json
{
  "_id": "ObjectId",
  "name": "String (unique)",
  "slug": "String (unique)"
}
```

### `video_jobs`
```json
{
  "_id": "ObjectId",
  "content_id": "ObjectId | null",
  "episode_id": "ObjectId | null",
  "s3_raw_key": "String",
  "s3_hls_prefix": "String | null",
  "status": "queued | processing | done | failed",
  "error": "String | null",
  "timestamps": "created_at, updated_at"
}
```

**Denormalization decisions:**
- `genres` stored as string array on `content` (fast filtering) + `genres` collection (filter UI)
- `content_id` duplicated on `episodes` to avoid double lookups in player
- Subscription embedded in `user` — one read checks all access

---

## 4. Laravel API Architecture

**Base:** `/api/v1/` — all responses follow standard envelope shape.

### Auth
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout          # auth:sanctum
GET    /api/v1/auth/me              # auth:sanctum
POST   /api/v1/auth/verify-email
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
```

### Content
```
GET    /api/v1/content              # paginated, filter: type/genre/year/language
GET    /api/v1/content/trending     # top by watch_history count (last 7 days)
GET    /api/v1/content/new-releases
GET    /api/v1/content/{slug}       # subscriber middleware
GET    /api/v1/content/search       # ?q= + filters

POST   /api/v1/admin/content        # role:admin
PUT    /api/v1/admin/content/{id}
DELETE /api/v1/admin/content/{id}
PATCH  /api/v1/admin/content/{id}/publish
```

### Seasons & Episodes
```
GET    /api/v1/content/{slug}/seasons
GET    /api/v1/content/{slug}/seasons/{seasonId}/episodes

POST   /api/v1/admin/content/{id}/seasons   # role:admin
PUT    /api/v1/admin/seasons/{id}
DELETE /api/v1/admin/seasons/{id}
POST   /api/v1/admin/seasons/{id}/episodes
PUT    /api/v1/admin/episodes/{id}
DELETE /api/v1/admin/episodes/{id}
```

### Video Pipeline
```
POST   /api/v1/admin/video/presign          # returns S3 presigned PUT URL
POST   /api/v1/admin/video/process          # triggers FFmpeg Job
GET    /api/v1/admin/video/jobs/{id}        # poll transcoding status
POST   /api/v1/webhooks/video-complete      # internal: job → updates content/episode
```

### Watch History
```
GET    /api/v1/me/continue-watching         # auth + subscriber
POST   /api/v1/me/watch-history             # upsert progress
GET    /api/v1/me/watch-history/{contentId}
```

### Subscriptions
```
GET    /api/v1/subscriptions/plans          # public
POST   /api/v1/subscriptions/trial          # auth — activate free trial
GET    /api/v1/me/subscription              # auth
```

### Admin
```
GET    /api/v1/admin/stats
GET    /api/v1/admin/users                  # paginated
PATCH  /api/v1/admin/users/{id}/subscription
GET    /api/v1/admin/video/jobs
```

**Middleware layers:**
- `auth:sanctum` — all authenticated routes
- `role:admin` (Spatie) — all `/admin/*` routes
- `subscriber` (custom) — content detail + player: checks `subscription.status` in `[trial, active]`
- `throttle:60,1` — auth routes

**Response envelope:**
```json
// Success
{ "success": true, "data": {}, "message": "..." }

// Paginated
{ "success": true, "data": [], "meta": { "current_page": 1, "per_page": 20, "total": 150, "last_page": 8 } }

// Error
{ "success": false, "message": "...", "errors": {}, "error_code": "VALIDATION_ERROR" }
```

---

## 5. React Frontend Architecture

### Folder Structure
```
src/
├── api/
│   ├── axios.ts              # Axios instance + interceptors
│   ├── auth.ts
│   ├── content.ts
│   ├── video.ts
│   ├── watchHistory.ts
│   └── subscriptions.ts
├── components/
│   ├── ui/                   # Shadcn base (do not edit)
│   └── shared/
│       ├── ContentCard.tsx   # landscape + portrait variants
│       ├── CarouselRow.tsx
│       ├── HeroBanner.tsx
│       ├── GenreTag.tsx
│       ├── RatingBadge.tsx
│       ├── ProgressBar.tsx
│       ├── SkeletonCard.tsx
│       └── PageTransition.tsx
├── features/
│   ├── auth/
│   ├── player/               # HLS.js wrapper + controls
│   ├── content/
│   ├── search/
│   ├── subscription/
│   └── admin/
├── hooks/
│   ├── useDebounce.ts
│   └── useIntersectionObserver.ts
├── layouts/
│   ├── MainLayout.tsx        # glassmorphism nav + outlet
│   ├── AuthLayout.tsx        # centered, no nav
│   └── AdminLayout.tsx       # sidebar nav
├── pages/
│   ├── HomePage.tsx
│   ├── BrowsePage.tsx
│   ├── ContentDetailPage.tsx
│   ├── WatchPage.tsx
│   ├── SubscriptionPage.tsx
│   ├── auth/
│   └── admin/
├── stores/
│   ├── authStore.ts          # user, token, role
│   └── uiStore.ts            # toasts, modals
├── types/
│   ├── content.ts
│   ├── user.ts
│   ├── subscription.ts
│   └── video.ts
└── lib/
    ├── constants.ts
    ├── format-duration.ts
    └── cn.ts
```

### Routes

| Route | Page | Layout | Auth |
|---|---|---|---|
| `/` | HomePage | MainLayout | subscriber |
| `/browse` | BrowsePage | MainLayout | subscriber |
| `/movie/:slug` | ContentDetailPage | MainLayout | subscriber |
| `/series/:slug` | ContentDetailPage | MainLayout | subscriber |
| `/watch/:slug` | WatchPage | none (fullscreen) | subscriber |
| `/watch/:slug/episode/:id` | WatchPage | none | subscriber |
| `/subscription` | SubscriptionPage | AuthLayout | auth |
| `/login` | LoginPage | AuthLayout | guest only |
| `/register` | RegisterPage | AuthLayout | guest only |
| `/admin` | DashboardPage | AdminLayout | admin |
| `/admin/content` | ContentListPage | AdminLayout | admin |
| `/admin/content/new` | ContentEditPage | AdminLayout | admin |
| `/admin/content/:id/edit` | ContentEditPage | AdminLayout | admin |
| `/admin/users` | UsersPage | AdminLayout | admin |

### State Ownership
- **Zustand:** auth token + user object, UI state (toasts, modals)
- **TanStack Query:** all server data — content, search, watch history, admin stats
- **Local state:** player controls, form state (React Hook Form)

---

## 6. Authentication & Authorization

### Registration Flow
```
POST /auth/register → user created (plan: free, status: expired)
→ email verification sent (queued job)
→ redirect to /subscription
→ POST /subscriptions/trial → status: trial, trial_ends_at: now + 14 days
→ redirect to /
```

### Login Flow
```
POST /auth/login → Sanctum token
→ stored in Zustand (memory) + localStorage (persistence)
→ Axios interceptor attaches as Bearer on every request
→ 401 response → clear store → redirect /login
```

### Route Guards
```
<ProtectedRoute role="subscriber">  checks token + subscription.status in [trial, active]
<ProtectedRoute role="admin">       checks token + role === "admin"
<GuestRoute>                        redirects to / if logged in
```
*Expired/cancelled subscription → redirect to `/subscription`, not `/login`.*

### Roles & Permissions

| Action | subscriber | admin |
|---|---|---|
| Browse content | ✓ | ✓ |
| Watch video (plan check) | ✓ | ✓ |
| Track watch history | ✓ | ✗ |
| Upload content | ✗ | ✓ |
| Manage users | ✗ | ✓ |
| View admin stats | ✗ | ✓ |

### Plan-based Content Access
```
free      → no video access (trial expired)
basic     → SD (required_plan: free | basic)
standard  → HD (required_plan: free | basic | standard)
premium   → all content including 4K
```
*Enforced via `CheckSubscriptionAccess` middleware on player routes + frontend plan guard.*

---

## 7. Design System (from DESIGN.md)

| Token | Value |
|---|---|
| Background | `#0A0A0A` |
| Surface | `#141414` |
| Surface variant | `#353534` |
| Accent (primary) | `#05ace5` (Electric Cyan) |
| Secondary | `#547c93` |
| Tertiary | `#e38d22` (Warm Amber) |
| Display font | Bebas Neue |
| Body font | Plus Jakarta Sans |
| Card radius | 8px |
| Card hover | scale(1.08), 200ms ease-out |
| Nav style | Glassmorphism, pill-shaped, 60% opacity + 30px blur |
| Film grain | 3–5% noise overlay on all surfaces |

**Rules:** No borders (tonal shifts only). No light mode. No Inter/Roboto/Arial. No dividers.

---

## 8. Project Phases

| Phase | Focus | Target |
|---|---|---|
| 1 | Foundation — Docker, auth API, React scaffold | Week 1–2 |
| 2 | Content Admin — CRUD, seasons, episodes | Week 3–4 |
| 3 | Video Pipeline — S3 presign, FFmpeg HLS, CloudFront | Week 5–6 |
| 4 | Browse & Home — carousels, hero, content detail | Week 7–8 |
| 5 | Video Player — HLS.js, controls, watch history, mini-player | Week 9 |
| 6 | Search — full-text, filters, browse grid | Week 10 |
| 7 | Subscription — plan UI, trial activation, plan guards | Week 11 |
| 8 | Polish — Sentry, Swagger, tests, staging, production | Week 12 |

---

## 9. Security Checklist (pre-launch per phase)
- [ ] All routes have proper auth middleware
- [ ] All inputs validated via FormRequest
- [ ] Policies applied for resource ownership
- [ ] Rate limiting on auth routes
- [ ] MongoDB injection sanitized (Eloquent only, no raw queries)
- [ ] CORS whitelisted to frontend domain only
- [ ] Sensitive fields hidden in API Resources
- [ ] File uploads validated (mime type + size)
- [ ] Logs contain no PII or tokens
- [ ] HTTPS enforced in production
- [ ] Presigned S3 URLs are short-lived (15 min expiry)
- [ ] HLS URLs served via CloudFront signed URLs for paywalled content
