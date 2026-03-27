# CLAUDE.md — Universal Project Instructions

> This file defines how Claude should think, write, and behave across ALL projects.
> Claude must read and follow everything here before writing any code or content.

---

## 🧠 How Claude Should Think

- Read the full request before responding — never jump to code immediately
- Ask ONE clarifying question if something is truly ambiguous — never a list of questions
- Think in systems: how does this piece fit the whole?
- Prefer the simplest solution that solves the problem correctly
- If a better approach exists than what was asked, mention it briefly — then do what was asked
- Never truncate code output — always write the full, complete file
- Never leave `// TODO`, `// placeholder`, or stub logic unless explicitly asked

---

## ✍️ Code Quality Standards

### Universal Rules (all languages)
- Write code that reads like documentation — names should explain intent
- One responsibility per function, component, or module
- No magic numbers — use named constants
- No dead code — don't leave commented-out blocks
- Handle all error cases — no unhandled promise rejections, no bare `except:` blocks
- Validate all inputs at system boundaries (API routes, form handlers, CLI args)
- Never hardcode secrets, tokens, API keys, or environment-specific URLs
- Always use environment variables for config — with clear names like `DATABASE_URL`, `API_BASE_URL`

### Naming Conventions
| Thing | Convention | Example |
|---|---|---|
| Components | PascalCase | `UserProfileCard` |
| Functions / hooks | camelCase | `useAuthSession` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Files (non-component) | kebab-case | `format-duration.ts` |
| CSS classes | kebab-case | `hero-banner` |
| DB tables / columns | snake_case | `user_subscriptions` |
| Env variables | SCREAMING_SNAKE_CASE | `STRIPE_SECRET_KEY` |

### TypeScript / JavaScript
- Strict mode always — no `any`, no implicit `any`
- Prefer `const` over `let`, never `var`
- Prefer named exports over default exports (except framework pages)
- Avoid deeply nested callbacks — use `async/await`
- Use optional chaining `?.` and nullish coalescing `??` over manual null checks
- Types and interfaces go in dedicated `types.ts` files or co-located with the module

### Python
- Type hints on all function signatures
- Docstrings on all public functions and classes
- Use `dataclasses` or `pydantic` for structured data — no raw dicts passed around
- Use `pathlib.Path` over `os.path`
- Exception handling must be specific — no bare `except Exception`

### CSS / Styling
- Mobile-first — write base styles for small screens, add breakpoints upward
- Use CSS variables / design tokens — no raw hex or hardcoded pixel values in components
- No inline styles except for truly dynamic runtime values
- Class names must be semantic, not visual — `card--featured` not `card--red`

---

## 🏗️ Architecture Principles

- **Separation of concerns** — UI, business logic, and data access in separate layers
- **DRY but not over-abstracted** — abstract when a pattern appears 3+ times
- **Composition over inheritance** — prefer small composable units
- **Fail loudly in development, gracefully in production**
- **Stateless by default** — functions and components should have no hidden state
- **Single source of truth** — one place owns each piece of state or data

### Folder structure pattern (adapt per project)
```
src/
├── components/       # Reusable UI components
├── pages/ or app/    # Routes / screens
├── hooks/            # Custom hooks (React) or composables (Vue)
├── lib/              # Pure utility functions, helpers
├── services/         # API calls, external integrations
├── stores/           # Global state (Zustand, Pinia, Redux)
├── types/            # Shared TypeScript types
└── constants/        # App-wide constants
```

---

## 🎨 Design & UI Standards

### Dark mode first
- Default to dark UI — background `#0A0A0A` or `#111111`, surface `#1A1A1A`
- Use CSS variables so light mode can be added via a single theme swap
- Never hardcode white backgrounds inside components

### Typography rules
- Never use `Inter`, `Roboto`, or `Arial` as the primary font
- Always pair a display font (headings) with a readable body font
- Define a type scale with CSS variables — no random `font-size` values scattered in code

### Spacing
- Use a consistent spacing scale — multiples of `4px` or `8px`
- Never use magic pixel values like `13px`, `27px`, `53px`

### Motion
- All animations must respect `prefers-reduced-motion`
- Transitions: `150–300ms`, `ease-out` for entrances, `ease-in` for exits
- No animations that loop forever without user intent

### Accessibility (minimum bar — always)
- All images need `alt` text
- All interactive elements are keyboard accessible
- Never `outline: none` without a visible replacement focus style
- Color is never the only way to convey information
- Touch targets minimum `44×44px`

---

## 🔒 Security Defaults

- Never log passwords, tokens, PII, or payment data
- Sanitize all user input before rendering or storing
- Use parameterized queries — never string-concatenate SQL
- Set `httpOnly` and `Secure` flags on auth cookies
- Short-lived tokens for sensitive operations (file URLs, payment sessions)
- CORS: always whitelist origins explicitly — never `*` in production

---

## 🧪 Testing Mindset

- Write tests for logic, not implementation — test behaviour, not internals
- Every utility function needs a unit test
- Every API endpoint needs at least a happy-path + one error-path test
- Component tests: test what users see and do, not component internals
- Don't mock what you don't own — integration test real DB queries in CI

---

## 📦 Dependency Decisions

- Before adding a package, ask: can this be done in ~10 lines without a library?
- Prefer well-maintained packages with recent commits and >1M weekly downloads
- Avoid packages that pull in massive dependency trees for small features
- Lock versions in `package.json` / `requirements.txt` — no loose `^` on critical deps
- Audit dependencies before every release

---

## 🗣️ Communication Style

When Claude responds:
- Lead with the answer or the code — no preamble like "Sure! Great question!"
- Keep explanations concise — code explains itself; comments explain *why*, not *what*
- Use plain language — no jargon unless the codebase already uses it
- When something has a tradeoff, say so in one sentence — don't write an essay
- Format code blocks with the correct language tag always
- If a task is too vague to complete correctly, ask ONE specific question before proceeding

---

## 🚫 Claude Must Never Do

- Generate code with placeholder logic and call it done
- Use `any` type in TypeScript without a comment explaining why
- Skip error handling on async operations
- Write functions longer than ~50 lines without suggesting a refactor
- Produce UI without considering mobile viewports
- Add dependencies without mentioning it
- Output partial files — always output the full file
- Repeat back the user's request before answering
- Add excessive comments that just restate the code in English

---

## ✅ Definition of Done (for any task)

A task is complete when:
- [ ] Code runs without errors
- [ ] All edge cases are handled
- [ ] No TypeScript / linting errors
- [ ] Mobile responsive (if UI)
- [ ] Accessible (if UI)
- [ ] Secure (no exposed secrets, validated inputs)
- [ ] Readable — another developer can understand it without explanation
- [ ] No dead code, no commented-out blocks, no TODOs left behind

---

*Universal config — applies to all projects. Override per-project with a local CLAUDE.md.*