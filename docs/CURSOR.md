Perfect.
We’ll create a **strict, execution-focused, scope-guarding `CURSOR.md`** tailored specifically to this project.

This file must:

* Lock Cursor into MVP scope
* Prevent schema drift
* Prevent feature creep
* Enforce build order
* Force it to stop when instructed
* Maintain alignment with all specs

Below is the finalized version.

You can copy this directly into `CURSOR.md`.

---

# `CURSOR.md`

---

# Cursor Operational Context

This document defines how Cursor must behave while implementing this project.

It is mandatory to follow this file strictly.

---

# 1️⃣ Project Overview

We are building:

A **UIUC-only, verified-student short-term housing marketplace**.

The platform:

* Is connection-only
* Does NOT process payments
* Does NOT generate contracts
* Does NOT mediate transactions
* Is restricted to verified `@illinois.edu` users

All behavior and scope are defined in:

* `PRODUCT_SPEC.md` → WHAT to build
* `BUILD_SPEC.md` → HOW to build it
* `MVP_DEFINITION.md` → Stopping boundary
* `UI_SPEC.md` → Visual system
* `TASKS.md` → Execution plan
* `DECISIONS.md` → Locked architectural decisions

You must not deviate from these files.

---

# 0️⃣ Project State (Manual Setup)

The following setup has already been completed manually and must NOT be redone or modified unless explicitly instructed.

## Supabase
- Project created and configured
- Email/password auth enabled
- Email verification required
- Redirect URLs configured for localhost
- Storage buckets created:
  - profile-pictures
  - listing-photos

## Prisma
- Prisma is installed and pinned to v6
- Prisma has already been initialized
- DATABASE_URL in `.env` uses Supabase Session Pooler (IPv4 compatible)
- Schema for TASKS 2.1–2.2 is complete
- Initial migration has been created and applied
- `prisma/schema.prisma` and `prisma/migrations` are finalized

You must NOT:
- Re-run prisma init
- Modify schema.prisma
- Modify prisma/migrations
- Change Prisma versions
- Alter DATABASE_URL
- Recreate migrations
- Touch Supabase configuration

## Environment
- `.env` and `.env.local` are correctly configured
- App runs locally
- Env validation exists and fails fast if missing variables

## Documentation
- Files in `/docs` are locked specifications
- Do NOT modify any files inside `/docs`

---

# 2️⃣ Hard Scope Boundary (Non-Negotiable)

You must NOT:

* Add features not explicitly defined
* Add messaging system
* Add payments
* Add map view
* Add ratings
* Add analytics dashboard
* Add dark mode
* Add multi-campus support
* Add roles beyond USER and ADMIN
* Add additional listing fields
* Rename database tables or enums
* Modify schema without explicit instruction

If something seems “missing” but is not defined in the spec:

Do NOT implement it.

---

# 3️⃣ Execution Discipline

You will implement only the task sections explicitly requested.

When given a section (example: TASKS.md 1.1–1.3):

* Implement only that section
* Do not move ahead
* Do not optimize beyond requirement
* Do not restructure architecture
* Stop after completion

If unsure whether something belongs in scope:

Assume it does NOT.

---

# 4️⃣ Architecture Rules

Follow `BUILD_SPEC.md` strictly.

## Stack

* Next.js (App Router) + TypeScript
* Supabase Auth
* Supabase Storage
* Postgres (Supabase managed)
* Prisma ORM
* Vercel (deployment later)
* Vercel Cron for expiration job

No additional frameworks.

No microservices.

Single monolith app.

---

# 5️⃣ Database Integrity Rules (Critical)

The schema defined in `BUILD_SPEC.md` is canonical.

You must:

* Use exact table names
* Use exact enum names
* Use exact column names
* Use exact relationships
* Use exact constraints
* Add defined indexes only

You must NOT:

* Rename enums
* Rename fields
* Change casing
* Add extra fields
* Modify constraints

Schema drift will break production.

---

# 6️⃣ Security Rules (Server-Side Enforcement Required)

The following must always be enforced server-side:

* `@illinois.edu` signup restriction
* Email verification required for:

  * viewing full listing details
  * revealing contact email
  * creating/editing listings
  * reporting
* Profile completion required for:

  * creating listings
  * revealing contact email
* Ban check
* Max 3 ACTIVE listings per user
* Public vs verified data shaping

Never rely on client-only enforcement.

---

# 7️⃣ Public vs Verified Data Separation

Public endpoints must NEVER return:

* Exact address
* Photos
* Description
* Owner real name
* Owner profile picture
* Seller email

Verified endpoints may return full detail as defined in spec.

Data shaping must happen server-side.

---

# 8️⃣ UI Rules (Mandatory)

All UI implementation must strictly follow `UI_SPEC.md`.

You must:

* Use Tailwind CSS
* Use shadcn/ui components minimally
* Follow defined color system exactly
* Use defined border radius rules
* Use defined shadow levels only
* Use defined typography scale
* Use defined badge styles for:

  * ACTIVE
  * TAKEN
  * EXPIRED
* Use defined lease-type tag colors
* Use defined verification badge style
* Follow listing card layout exactly as described
* Follow listing detail page layout structure exactly
* Use top horizontal filters (not sidebar)
* Follow button hierarchy:

  * Primary (Illini Blue)
  * Secondary (bordered)
  * Destructive (outlined red)

You must NOT:

* Introduce gradients
* Add heavy animations
* Add dark mode
* Add custom design systems
* Add UI elements that imply non-MVP features
* Change status badge colors
* Change brand colors
* Add extra UI states not defined in spec

UI must remain:

Clean
Campus-native
Structured
Minimal

If a UI decision is unclear:

Default to simplicity.

---

# 9️⃣ Implementation Order

Unless explicitly changed, follow this order:

1. Repo + Supabase + Prisma
2. DB models + migrations
3. Auth + profile completion gate
4. Public listing GET endpoints
5. Create listing flow
6. Photo upload
7. Contact reveal
8. Admin
9. Expiration job
10. UI polish

Do not skip steps.

Do not reorder.

---

# 🔟 Code Quality Philosophy

Prefer:

* Clear
* Explicit
* Minimal
* Readable
* Strictly typed
* Business-rule accurate

Avoid:

* Premature abstraction
* Overengineering
* Fancy patterns
* Generic enterprise architecture

Ship MVP.

---

# 1️⃣1️⃣ Stop Rule

When completing a requested task section:

Stop.

Do not continue.

Do not “improve” future sections.

Wait for the next instruction.

---

# Final Instruction

This is an MVP build.

The primary goal is:

Functional correctness
Business rule enforcement
Shipping

Not theoretical scalability.
Not architectural experimentation.

If you believe any part of the project state above is inconsistent or needs change,
STOP and request explicit instruction before modifying it.

Stay disciplined.

---

End of `CURSOR.md`

---