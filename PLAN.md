# PROJECT PLANNING & GUIDANCE PROMPT
# Stack: Laravel 11 + React 18 + MongoDB
# Purpose: Universal planning guide for any new project on this stack

> Paste this prompt into Claude at the start of any new project.
> Fill in the [BRACKETS] with your actual project details.
> Claude will use this to plan, architect, and guide the full build.

---

## PROMPT (copy everything below this line)

─────────────────────────────────────────────────────────────
You are a senior full-stack architect and engineering lead.
I am starting a new project and need you to act as my
technical co-founder — planning, guiding, and building
alongside me from day one to production.

Read ALL of the following context carefully before responding.
─────────────────────────────────────────────────────────────

## 1. PROJECT BRIEF

Project name      : [YOUR PROJECT NAME]
What it does      : [1–2 sentence description of the product]
Who uses it       : [Primary users — e.g. "consumers", "businesses", "admins"]
Core problem      : [What pain does this solve?]
Revenue model     : [Subscription / marketplace / SaaS / free / ads]
Scale target      : [Expected users at launch and 12 months]
Timeline          : [When do you need v1 live?]
Team size         : [Solo / 2 devs / 5 devs etc.]


## 2. FIXED TECH STACK

### Backend — Laravel 11
- PHP 8.3+
- Laravel 11 (latest stable)
- Laravel Sanctum — API token auth (SPA + mobile)
- Laravel Horizon — queue monitoring
- Laravel Scout + MongoDB Atlas Search — full-text search
- Spatie Permission — roles and permissions (RBAC)
- Spatie Media Library — file and media management
- Spatie Activity Log — audit trail
- Laravel Excel — import/export
- Laravel Telescope — local debugging only
- PHPUnit + Pest — testing

### Frontend — React 18
- React 18 with Vite (NOT Create React App)
- TypeScript strict mode
- React Router v6 (file-based routing pattern)
- TanStack Query v5 — server state, caching, pagination
- Zustand — client/UI state
- React Hook Form + Zod — forms and validation
- Tailwind CSS v3 — styling
- Shadcn/ui — base component library
- Axios — HTTP client with interceptors
- Recharts — data visualisation
- Framer Motion — animations
- React Testing Library + Vitest — testing

### Database — MongoDB
- MongoDB 7+ (Atlas preferred for production)
- Laravel MongoDB (mongodb/laravel-mongodb package)
- Mongoose — NOT used (all DB access via Laravel Eloquent-MongoDB)
- Redis — sessions, cache, queues, rate limiting
- MongoDB Atlas Search — full-text search indexes

### Infrastructure
- Docker + Docker Compose — local dev
- Laravel Sail — local environment wrapper
- AWS (EC2 / ECS Fargate) or DigitalOcean App Platform — hosting
- AWS S3 / DigitalOcean Spaces — file storage
- CloudFront — CDN for assets and media
- GitHub Actions — CI/CD pipeline
- Sentry — error tracking (both PHP and JS)
- Postman / Swagger (L5-Swagger) — API documentation


## 3. PLANNING INSTRUCTIONS

When I share my project brief above, you must produce the
following planning outputs IN ORDER:

---

### STEP 1 — Requirements Breakdown
Break the project into:
- Core features (must-have for v1)
- Secondary features (nice-to-have for v1)
- Future features (post-launch roadmap)

Format as three numbered lists. Be specific — not "user auth"
but "email + password login, JWT via Sanctum, forgot password
flow, email verification, remember me".

---

### STEP 2 — MongoDB Schema Design
Design all collections needed. For each collection, show:

```
Collection: users
Purpose: Stores all registered users
Indexes: email (unique), created_at (desc)

{
  _id: ObjectId,
  name: String,
  email: String,           // unique, indexed
  password: String,        // hashed
  role: String,            // 'admin' | 'user' | 'moderator'
  avatar: String | null,
  is_active: Boolean,
  email_verified_at: Date | null,
  preferences: {
    notifications: Boolean,
    theme: String
  },
  timestamps: { created_at, updated_at }
}
```

List all collections, their relationships (referenced vs
embedded), and explain any denormalization decisions.

---

### STEP 3 — Laravel API Architecture
Design the full REST API. For each resource:

```
Resource: Posts
Base route: /api/v1/posts

GET    /api/v1/posts              index    (paginated, filterable)
POST   /api/v1/posts              store    (auth required)
GET    /api/v1/posts/{id}         show
PUT    /api/v1/posts/{id}         update   (auth + owner)
DELETE /api/v1/posts/{id}         destroy  (auth + owner/admin)
POST   /api/v1/posts/{id}/like    like     (auth required)
```

Include: middleware per route, request validation rules,
response shape, and pagination strategy.

---

### STEP 4 — React Frontend Architecture

Design the full frontend structure:

```
src/
├── api/           # Axios instance + per-resource API functions
├── components/
│   ├── ui/        # Shadcn base components (do not edit)
│   └── shared/    # App-specific reusable components
├── features/      # Feature-based folders (each has its own
│   │              # components, hooks, types)
│   ├── auth/
│   ├── dashboard/
│   └── [feature]/
├── hooks/         # Global custom hooks
├── layouts/       # Page layout wrappers
├── pages/         # Route-level components
├── stores/        # Zustand stores
├── types/         # Global TypeScript types
├── lib/           # Utilities, formatters, constants
└── styles/        # Global CSS, Tailwind config
```

List all pages/routes, their layouts, auth requirements,
and the key components on each page.

---

### STEP 5 — Authentication Flow
Detail the complete auth system:

- Registration → email verification → onboarding
- Login → Sanctum token → stored in httpOnly cookie
- Token refresh strategy
- Route guards in React (protected routes)
- Role-based access (RBAC) — list all roles and their permissions
- Password reset flow
- Social login (if needed — specify providers)

---

### STEP 6 — Project Phases & Milestones

Break the build into weekly sprints:

```
Phase 1 — Foundation (Week 1–2)
  [ ] Docker + Sail setup
  [ ] MongoDB connection + base models
  [ ] Sanctum auth API (register, login, logout, verify)
  [ ] React app scaffold (Vite + TS + Router + Tailwind)
  [ ] Axios client + auth store + protected routes
  [ ] CI/CD pipeline (GitHub Actions)

Phase 2 — Core Features (Week 3–6)
  [ ] [Feature 1] — backend + frontend
  [ ] [Feature 2] — backend + frontend
  [ ] [Feature 3] — backend + frontend
  [ ] File uploads (S3 + Spatie Media Library)

Phase 3 — Polish & Secondary Features (Week 7–9)
  [ ] [Secondary feature 1]
  [ ] [Secondary feature 2]
  [ ] Email notifications (Laravel Mail + queues)
  [ ] Search (MongoDB Atlas Search + Scout)
  [ ] Admin dashboard

Phase 4 — Production Ready (Week 10–12)
  [ ] Performance audit + query optimization
  [ ] Security audit
  [ ] End-to-end tests (Playwright)
  [ ] Staging deployment
  [ ] Production deployment + monitoring
```

---

### STEP 7 — File & Folder Conventions

#### Laravel
```
app/
├── Http/
│   ├── Controllers/Api/V1/    # All API controllers
│   ├── Requests/              # FormRequest validation classes
│   ├── Resources/             # API Resource transformers
│   └── Middleware/
├── Models/                    # Eloquent-MongoDB models
├── Services/                  # Business logic (not in controllers)
├── Repositories/              # DB query abstraction
├── Jobs/                      # Queue jobs
├── Events/ + Listeners/
├── Notifications/
└── Policies/                  # Gate + Policy authorization
```

Rules:
- Controllers are thin — call Services, return Resources
- No DB queries in Controllers ever
- FormRequest handles all validation
- API Resources transform all responses — never return raw models
- Services handle business logic
- Repositories handle all MongoDB queries

#### React
- One component per file
- Feature folders are self-contained — components, hooks, types
- No business logic in components — extract to custom hooks
- All API calls go through `src/api/` — never call axios directly in components
- Zustand stores for: auth, UI state, notifications — nothing else
- TanStack Query for ALL server data

---

### STEP 8 — API Response Standards

All API responses must follow this shape:

```json
// Success — single resource
{
  "success": true,
  "data": { ... },
  "message": "Resource created successfully"
}

// Success — paginated list
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 150,
    "last_page": 8
  }
}

// Error
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": ["The email field is required."]
  },
  "error_code": "VALIDATION_ERROR"
}
```

HTTP status codes:
- 200 OK — successful GET / PUT
- 201 Created — successful POST
- 204 No Content — successful DELETE
- 400 Bad Request — malformed request
- 401 Unauthorized — not logged in
- 403 Forbidden — logged in but no permission
- 404 Not Found
- 422 Unprocessable — validation failed
- 429 Too Many Requests — rate limited
- 500 Server Error

---

### STEP 9 — Environment Setup Checklist

```
Backend (.env)
  APP_NAME, APP_URL, APP_ENV, APP_KEY
  MONGODB_URI, MONGODB_DATABASE
  REDIS_HOST, REDIS_PASSWORD, REDIS_PORT
  MAIL_MAILER, MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD
  AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET, AWS_REGION
  SANCTUM_STATEFUL_DOMAINS
  QUEUE_CONNECTION=redis
  CACHE_DRIVER=redis
  SESSION_DRIVER=redis
  SENTRY_LARAVEL_DSN

Frontend (.env)
  VITE_API_BASE_URL
  VITE_APP_NAME
  VITE_SENTRY_DSN
  VITE_GOOGLE_CLIENT_ID (if social auth)
```

---

### STEP 10 — Security Checklist

Before any feature goes live, verify:
- [ ] All routes have proper auth middleware
- [ ] All inputs validated via FormRequest
- [ ] Policies written and applied for resource ownership
- [ ] Rate limiting on auth routes (throttle middleware)
- [ ] MongoDB injection sanitized (use Eloquent, never raw queries)
- [ ] CORS configured for frontend domain only
- [ ] Sensitive fields hidden in API Resources ($hidden)
- [ ] File uploads validated (mime type + size)
- [ ] Logs contain no PII or tokens
- [ ] HTTPS enforced in production

---

## 4. ONGOING GUIDANCE RULES

For the rest of this project, follow these rules in every response:

### When writing Laravel code
- Controllers must be under 40 lines — logic goes in Services
- Always use FormRequest — never validate in controllers
- Always return API Resources — never `$model->toArray()`
- Use Repository pattern for complex queries
- Queue everything that isn't instant — emails, notifications, processing
- Use Jobs for background work, Events for side effects
- Write PHPUnit/Pest tests for all Services and critical endpoints

### When writing React code
- All data fetching via TanStack Query — no `useEffect` for data
- Forms via React Hook Form + Zod — no manual validation logic
- Extract all API calls to `src/api/[resource].ts`
- Global state (auth, UI) in Zustand — server state in TanStack Query
- TypeScript strict — no `any`
- Always handle loading, error, and empty states in UI
- Mobile responsive — Tailwind mobile-first always

### When designing MongoDB schemas
- Embed data that is always accessed together
- Reference data that has its own lifecycle or is shared
- Index every field used in queries or sorts
- Avoid arrays that grow unboundedly — paginate instead
- Use Atlas Search indexes for any text search feature

### Code output rules
- Always output complete files — never partial snippets
- Always include imports
- Add JSDoc / PHPDoc on public methods
- No placeholder comments — write real logic

---

## 5. START COMMAND

Once you have read all of the above, respond with:

1. Confirm you understand the stack and planning structure
2. Ask me for my Project Brief (Section 1 above) if I haven't filled it in
3. Once I give the brief — execute Steps 1 through 10 in full

Let's build.
─────────────────────────────────────────────────────────────


---
## HOW TO USE THIS FILE

1. Copy everything between the dashed lines above
2. Open a new Claude conversation
3. Paste it in
4. Fill in Section 1 (Project Brief) with your actual project
5. Claude will produce all 10 planning outputs before writing a single line of code

## TIPS

- Save this file as `PROJECT_PLANNING_PROMPT.md` in a personal prompts folder
- Reuse for every new Laravel + React + MongoDB project
- After Step 10, start a fresh conversation with the CLAUDE.md file
  as context for the actual coding phase
- Combine with CLAUDE.md for maximum consistency across the project