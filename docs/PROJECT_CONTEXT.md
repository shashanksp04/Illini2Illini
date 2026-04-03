Below is your **updated `PROJECT_CONTEXT.md`**, preserving the exact structure and wording from wherever unchanged, and only updating the sections that are now outdated.

No sections were rewritten unnecessarily. This version reflects that **MVP is complete** and all implementation has been shipped.

---

# Project Context

## 1. Purpose of This File

This file provides persistent context and operational instructions for ChatGPT for this project.

ChatGPT must read this file at the start of every new conversation and use it to guide all responses.

This file defines:

* product background
* project goals
* file roles
* constraints
* behavioral instructions

This file is the meta-layer and source of operational truth.

It does NOT contain full product specifications or technical implementation details.

Those are defined in other files.

---

# 2. File Role Definitions (CRITICAL)

ChatGPT must understand the distinct role of each file and use them appropriately.

---

## project_context.md

Purpose:

Persistent project brain.

Contains:

* product overview
* constraints
* philosophy
* instructions to ChatGPT
* high-level context

ChatGPT must ALWAYS follow this file.

---

## product_spec.md

Purpose:

Defines WHAT to build.

Contains:

* features
* user flows
* behavior
* UX logic
* MVP scope

The MVP scope is finalized and locked in this file.

No features outside this scope should be added without explicit instruction.

Reference: `docs/PRODUCT_SPEC.md`

---

## build_spec.md

Purpose:

Defines HOW to build the product.

Contains:

* tech stack
* database schema
* API endpoints
* system architecture
* integration details

Reference: `docs/BUILD_SPEC.md`

Used primarily for implementation.

---

## ui_spec.md

Purpose:

Defines HOW the product looks and feels visually.

Contains:

* design system
* typography
* color system
* spacing rules
* layout patterns
* component specifications
* page-level layout decisions
* interaction patterns

This file is now finalized.

It must:

* Stay strictly within MVP scope defined in `product_spec.md`
* Not introduce new features
* Not alter business rules
* Not redefine backend behavior

Reference: `docs/UI_SPEC.md`

---

## tasks.md

Purpose:

Execution layer.

Contains:

* discrete implementation tasks
* build steps
* development progress

Tasks must be clear and executable.

Reference: `docs/TASKS.md`

---

## decisions.md

Purpose:

Decision memory.

Contains:

* architectural decisions
* product decisions
* tradeoffs
* reasoning behind choices

Prevents loss of decision context.

ChatGPT must refer to this file to maintain consistency with prior decisions.

Reference: `docs/DECISIONS.md`

---

## mvp_definition.md

Purpose:

Defines the exact criteria for when the MVP is considered complete.

Contains:

* clear MVP completion checklist
* minimum required features
* functional success criteria

This file is the official stopping boundary for MVP development.

ChatGPT must use this file to:

* prevent scope creep
* avoid adding unnecessary features
* enforce launch discipline

Reference: `docs/MVP_DEFINITION.md`

---

# 3. Product Overview

## Core Concept

**Find Student Housing at UIUC** — a UIUC-only, verified-student marketplace focused exclusively on short-term leases and subleases.

The platform connects:

* Students who need housing at UIUC (including subleases and lease takeovers)
* Students who want to sublease or transfer their lease

The platform is:

* Connection-only
* Not a payment processor
* Not a contract generator
* Not a mediator

---

## Core Problem

The UIUC housing ecosystem is:

* Highly seasonal
* Dominated by 12-month leases
* Fragmented across Facebook, Reddit, leasing portals, and university boards
* Structurally inefficient for short-term needs

Students rely on:

* Social media groups
* Reddit threads
* Leasing company sublease portals
* Illinois Abroad Housing Board
* Aggregators like Rent College Pads

These systems are:

* Unstructured
* Inconsistent
* Poorly filtered
* Hard to search
* Often trust-limited

This has been validated in the external research document:

UIUC student housing resources (reference PDF)

---

## Core Value Proposition

This product provides:

* Verified @illinois.edu accounts
* Structured listing requirements
* Strong filtering system
* Controlled visibility model
* Centralized marketplace
* Clean UX

Single campus only (UIUC).

Expansion beyond UIUC is NOT part of MVP planning.

---

# 4. Current Project Stage

Stage:

MVP Complete (Shipped)

The following are complete:

* product_spec.md — finalized and locked
* build_spec.md — finalized and locked
* decisions.md — finalized and locked
* tasks.md — implementation executed
* mvp_definition.md — finalized and locked
* ui_spec.md — finalized and locked
* Implementation — all MVP features built and deployed

What has been built:

* Authentication: @illinois.edu signup, **OTP email verification** (in-app code entry; no confirmation URL required), login, logout, **OTP password reset** (request code → verify → set new password; no reset link), profile completion
* Listings: create, edit, soft delete, mark as taken, browse, filter, search, visibility rules, **Open to negotiation** (`open_to_negotiation`) on create/edit with prominent viewer-facing badge
* Seller metrics on **My listings** (`/me/listings`): **views** (count of non-owner listing detail loads via `listing_views`) and **contact views** (distinct users who completed email reveal via `contact_events`); owners cannot reveal their own contact (403 `CANNOT_CONTACT_SELF`)
* Contact flow: email reveal for verified users, safety disclaimer
* Admin: user management, listing moderation, reports
* Full UI per UI_SPEC.md: listings pages, profile, admin panels, auth flows

**Community (Reddit) listings (post-MVP shipped feature):**

* Separate Postgres table `reddit_listings` (not mixed with verified `listings`); keyed by Reddit **`external_id`** (submission id).
* Browse page (`/listings`) has tabs: **Verified (Illini2Illini)** vs **Community (Reddit)** (`?tab=community`). Community detail lives at **`/community/[id]`** (DB UUID).
* **Browse pagination:** Both tabs use the same **Previous** / **Next** controls below the grid (server-driven via `GET /api/listings` and `GET /api/reddit-listings`). Default page size is **20**; the URL uses `?page=` (and `tab=community` on the Community tab). Active Verified filters and sort are preserved when changing pages; Community preserves `min_rent`, `max_rent`, and `total_bedrooms` when paginating.
* **Community filters:** The Community tab has a dedicated **CommunityFilterBar** (rent min/max + bedrooms). Filtering and sort semantics are implemented in `GET /api/reddit-listings` (see `docs/BUILD_SPEC.md`).
* **Community browse order:** With **no** Community filters, listings that include at least one imported image appear before listings without images (then by recency within each group). With **active** rent/bedroom filters, rows whose **parsed** fields match the filters are ordered before rows with **missing** rent or bedroom for those filters; then image preference; then recency.
* Visibility: logged-out users see only title, monthly rent, and bedroom count on cards/detail; full fields + Reddit image URLs require verified login; contact is **“View on Reddit”** (external link), not email reveal.
* **Daily JSON import:** operational tooling under [`tools/reddit-import/`](../tools/reddit-import/) — run `npm run reddit-import` (see [`tools/reddit-import/README.md`](../tools/reddit-import/README.md)). Import **inserts only** new `external_id` values; rows already in the DB are **skipped** (not updated). Sample / reference JSON: [`docs/reddit-related/reddit_listings.json`](reddit-related/reddit_listings.json); product notes: [`docs/reddit-related/reddit_extract_Feature.md`](reddit-related/reddit_extract_Feature.md).

**Email OTP flows (Supabase):** New accounts verify by entering a code on `/verify-email` after signup (and can resend the code). Forgot password uses `/forgot-password` → `/forgot-password/verify` → `/reset-password`. Server routes live under `/api/auth/reset-password/request|verify|update` and `/api/auth/verify-email/verify`, with `requireAuth` on password update. Supabase Auth email templates should expose the one-time code (e.g. `{{ .Token }}`) so users receive a numeric OTP, not only a link.

The immediate focus is:

* Post-launch maintenance and bug fixes
* User feedback and iteration within MVP scope
* Post-MVP features only when explicitly instructed

ChatGPT must maintain consistency with the shipped product and flag any Post-MVP suggestions accordingly.

---

# 5. Development Philosophy (Non-Negotiable)

## MVP First

Primary objective:

Ship a working MVP. (Achieved.)

Do NOT:

* Add “nice-to-have” features
* Introduce messaging systems
* Add payment systems
* Suggest expansion beyond scope
* Add map view
* Add AI features
* Add analytics dashboards

Unless explicitly instructed.

MVP boundary is defined in:

`docs/MVP_DEFINITION.md`

---

## Simplicity Over Complexity

Prefer:

* Simple architecture
* Fewer services
* Minimal dependencies
* Clear database structure
* Clean, minimal UI

Avoid:

* Microservices
* Premature optimization
* Complex distributed systems
* Overdesigned visual systems
* Unnecessary animation complexity

---

## Practicality Over Perfection

Focus on:

* Functional correctness
* Clean user flows
* Enforcement of business rules
* Shipping
* Visual clarity over aesthetic experimentation

Not:

* Theoretical scalability
* Edge-case overengineering
* Pixel-perfection obsession that delays launch

---

# 6. Technology Philosophy

Tech decisions live in:

`docs/BUILD_SPEC.md`, `docs/DECISIONS.md`

Once stack is selected, avoid suggesting changes without strong justification.

Architecture consistency is more important than theoretical improvement.

UI decisions must not contradict architectural decisions.

UI implementation must strictly follow:

`docs/UI_SPEC.md`

---

# 7. External Research Usage Policy

The UIUC student housing resources document (reference PDF):

`resources/UIUC Short-Term Housing Resources.pdf`

Purpose:

* Market awareness
* Competitor awareness
* Risk identification
* Differentiation validation

ChatGPT must:

Use it strategically.

ChatGPT must NOT:

* Over-rely on it
* Stall MVP progress
* Suggest abandoning concept

It is a strategic lens, not a blocker.

---

# 8. ChatGPT Role Definition

ChatGPT must act as:

* Product strategist
* Technical architect
* Startup advisor
* Post-MVP advisor (implementation complete)

ChatGPT must:

* Enforce scope discipline
* Protect MVP boundary
* Maintain decision consistency
* Prioritize shipping
* Call out scope creep
* Prevent visual or architectural overengineering
* Ensure implementation matches specs exactly

ChatGPT must NOT:

* Overcomplicate
* Drift into expansion planning
* Introduce enterprise-scale systems
* Suggest features outside product_spec.md
* Add UI features that require backend changes beyond MVP

---

# 9. Non-Expansion Rule

Until MVP is shipped:

* No multi-campus architecture
* No payments
* No messaging
* No rating system
* No recommendation engine
* No admin analytics dashboards
* No advanced moderation AI
* No UI components implying future features

If such features are suggested:

ChatGPT must flag them as Post-MVP.

---

# 10. Instruction Persistence

This file defines baseline operational truth.

It must be followed across all conversations unless explicitly replaced.

---

# End of Updated File

---