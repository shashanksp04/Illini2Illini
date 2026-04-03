# Illini2Illini

**Find Student Housing**  
**at UIUC**

Find subleases, lease takeovers, and full-year housing from verified UIUC students. Browse, filter, and connect directly.

---

## 🏫 What Is Illini2Illini?

Illini2Illini is the University of Illinois Urbana-Champaign marketplace for **subleases, lease takeovers, and full-year housing** from **verified UIUC students** — structured listings you can browse, filter, and use to connect with sellers.

It solves a simple but frustrating problem:

UIUC housing is built around rigid 12-month leases — but student life isn’t.

Students graduate mid-year.
Study abroad.
Leave for internships.
Arrive for one semester.

And the current ecosystem?
Scattered across Facebook groups, Reddit threads, and leasing portals.

Illini2Illini brings structure, verification, and clarity to finding student housing at UIUC.

---

## ✨ Why It Exists

The existing experience of finding student housing at UIUC is:

* Fragmented
* Unstructured
* Hard to filter
* Trust-limited
* Overrun with inconsistent posts

Illini2Illini replaces chaos with:

* Verified UIUC-only accounts
* Structured listings
* Powerful filtering
* Controlled visibility
* A clean, campus-native UX

---

## 🔐 Verified UIUC Community

Only `@illinois.edu` accounts can create listings.

Every user:

* Must verify their email
* Must complete a profile
* Has an immutable username
* Uploads a profile picture for credibility
* Displays a Verified UIUC badge

This dramatically reduces scams and anonymous spam.

---

## 🏠 Structured student housing listings

Every listing includes:

* Monthly rent
* Start & end dates
* Lease type (Sublease or Lease Takeover)
* Private room or entire unit
* Furnished & utilities flags
* Nearby landmark
* Description
* 1–8 photos

Each user can maintain up to 3 active listings.

Listings automatically expire based on availability dates to keep the marketplace clean.

---

## 🌐 Community (Reddit) listings

Alongside verified Illini2Illini posts, the browse page includes a **Community** tab with housing threads aggregated from Reddit (e.g. r/UIUC). These live in a separate database table (`reddit_listings`) and are **not** mixed with seller-verified `listings`.

* **Browse:** `/listings` — switch between **Verified (Illini2Illini)** and **Community (Reddit)**. Detail pages for Community items use the route **`/community/[id]`** (internal id).
* **Trust:** Community posts are third-party content; the UI labels them accordingly. Contact is **View on Reddit** (external link), not in-app email reveal.
* **Visibility:** Logged-out users see title, monthly rent, and bedroom count. Verified `@illinois.edu` users see full fields and image URLs where available.

**Importing JSON (operators):** Housing posts are loaded from daily export JSON. From the repo root:

```bash
npm run reddit-import
```

See [`tools/reddit-import/README.md`](tools/reddit-import/README.md) for file paths and flags. The job is **insert-only**: rows with an `external_id` already in the database are skipped, not updated.

More detail: [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md) and [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md).

---

## 👀 Smart Visibility Model

Illini2Illini uses a hybrid visibility system.

### Public Visitors Can:

* Browse listings
* Filter by rent, dates, room type, etc.
* See high-level details

### Verified Users Can:

* View photos
* See full descriptions
* View exact addresses
* See seller’s full name & profile picture
* Reveal seller email

This protects privacy while encouraging signups.

---

## 🔎 Powerful Filtering

Built specifically for student housing needs at UIUC (subleases, lease takeovers, full-year housing, and semester-style timelines).

Filter by:

* Rent range
* Start date
* End date
* Lease type
* Room type
* Furnished
* Utilities included

Includes keyword search and smart sorting.

No map clutter. No noise. Just structured listings.

---

## 🛡 Safety & Moderation

* Report system for listings
* Admin moderation tools
* User bans
* Soft-delete system
* Automatic expiration cleanup

The platform is connection-only.

It does not process payments, generate contracts, or mediate transactions.

---

## 🧠 Technical Architecture

Built for simplicity, speed, and long-term flexibility.

### Stack

* **Next.js (App Router)**
* **TypeScript**
* **PostgreSQL**
* **Supabase (Auth + Storage)**
* **Prisma ORM**
* **Vercel deployment**
* **Vercel Cron for automation**
* **Tailwind CSS + shadcn/ui**

### Architecture Principles

* Single monolithic app
* Strict server-side business rule enforcement
* Identity decoupled from domain layer
* Upgradeable search abstraction
* Migration-friendly helper boundaries
* Public vs verified response shaping at API level

---

## 🚀 Local Development

```bash
npm install
npm run dev
```

Required environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
CRON_SECRET=
# Optional. Set to https://www.illini2illini.app/ for production auth redirects.
NEXT_PUBLIC_APP_URL=
```

---

## Forgot Password 500 Error (Production)

If the forgot-password flow returns 500 from Supabase (`unexpected_failure`), check:

1. **Redirect URLs** – Supabase Dashboard → Authentication → URL Configuration:
   - Add `https://www.illini2illini.app/auth/callback` to Redirect URLs
   - Set Site URL to `https://www.illini2illini.app/`

2. **SMTP / Email** – Project Settings → Auth → SMTP Settings:
   - If using custom SMTP, verify credentials
   - Supabase’s built-in email can fail under load; consider custom SMTP for production

3. **Logs** – Check Vercel function logs for `[forgot-password]` entries and Supabase Auth logs for the underlying error.

---

## 📈 What Makes It Different

This is not another leasing portal.

It’s:

* Structured like a product
* Constrained like a startup
* Designed for one campus
* Built with execution discipline
* Focused on shipping

Illini2Illini feels like:

> “If UIUC students built a better housing board.”

Not:

> “Another landlord platform.”

---

## 🏁 Current Status

MVP launched.
Core marketplace functionality complete.

A **Community (Reddit)** browse tab and JSON import pipeline shipped post-MVP; verified seller listings and rules above remain the primary product.

Focused on:

* Reliability
* Clean UX
* Strict rule enforcement
* Campus adoption

---

## 📜 Disclaimer

Illini2Illini is a connection platform only.

We do not:

* Process payments
* Create contracts
* Guarantee listings
* Mediate disputes

Users are responsible for conducting due diligence before entering agreements.

---

## 🎓 Built at UIUC

Designed specifically for the Urbana-Champaign housing ecosystem.

Single campus.
Single problem.
Solved well.

---