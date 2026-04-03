# BUILD_SPEC.md (Final)

## 1. Purpose

Defines **HOW** to build the product specified in `PRODUCT_SPEC.md`, within MVP scope and under the simplicity-first rules in `PROJECT_CONTEXT.md`.

---

## 2. Principles

### 2.1 MVP-Speed

* Single Next.js app (monolith)
* No microservices
* Minimal dependencies
* Ship-first architecture

### 2.2 Migration-Friendly

* **Identity ≠ Domain**: Supabase Auth is identity only; domain data lives in Postgres.
* **Stable domain layer**: UI never talks directly to DB; all access via server endpoints.
* **Integration wrappers**: storage, search, auth checks centralized in helpers.
* **Portable keys**: domain `users.id` is internal; store `auth_user_id` to decouple auth provider.
* **Upgradeable search**: one search function; swap ILIKE → FTS later without UI change.
* **Event pattern**: `contact_events` (reveal audit) and `listing_views` (detail-load audit for seller metrics) support analytics-style counts without a separate analytics stack.

---

## 3. Tech Stack

### App

* **Next.js (App Router) + TypeScript**
* Route Handlers for API endpoints: `/app/api/**/route.ts`

### Database

* **PostgreSQL** (Supabase managed)

### ORM

* **Prisma** (recommended)

### Auth

* **Supabase Auth** (email/password + email verification and password reset completed in-app via **OTP** and `verifyOtp` in route handlers—not only magic links)

### Storage

* **Supabase Storage**

  * buckets: `profile-pictures`, `listing-photos`

### Deployment

* **Vercel** (app)
* **Supabase** (DB/Auth/Storage)

### Scheduled Jobs

* **Vercel Cron** calls internal endpoint daily for expiration

---

## 4. Architecture Overview

### Components

1. Next.js app (UI + API layer)
2. Supabase Auth (identity + verification)
3. Postgres (domain storage)
4. Supabase Storage (images)
5. Vercel Cron (expiration job)

### Server-side gates (must be enforced server-side)

* `@illinois.edu` signup restriction
* Verified email required for:

  * viewing full listing details
  * revealing contact email
  * creating/editing listings
  * reporting
* Profile completion required for:

  * creating listings
  * revealing contact email
* Public vs Verified response shaping
* Ban checks

---

## 5. Data Model (Postgres)

### Enums

* `Role`: `USER | ADMIN`
* `ListingStatus`: `ACTIVE | TAKEN | EXPIRED | DELETED`
* `LeaseType`: `SUBLEASE | LEASE_TAKEOVER`
* `RoomType`: `PRIVATE_ROOM | ENTIRE_UNIT`
* `GenderPreference`: `MALE | FEMALE | ANY`
* `ReportStatus`: `OPEN | RESOLVED`
* `ExternalListingSource`: `REDDIT` (external aggregated posts)

### users

* `id` uuid pk
* `auth_user_id` uuid unique (Supabase Auth user id)
* `email` text unique (must end with `@illinois.edu`)
* `first_name` text nullable until profile completion
* `last_name` text nullable until profile completion
* `username` text unique (immutable after set)
* `profile_picture_url` text nullable until profile completion
* `role` enum default USER
* `is_banned` boolean default false
* `created_at` timestamp
* `updated_at` timestamp

### listings

* `id` uuid pk
* `owner_id` fk → users.id
* `title` varchar(100)
* `monthly_rent` int
* `lease_type` enum
* `start_date` date
* `end_date` date
* `exact_address` text
* `nearby_landmark` varchar(80)
* `total_bedrooms` int
* `room_type` enum
* `furnished` boolean
* `utilities_included` boolean
* `open_to_negotiation` boolean default false (seller open to negotiating rent)
* `gender_preference` enum
* `description` varchar(1000)
* `status` enum default ACTIVE
* `created_at` timestamp
* `updated_at` timestamp

Indexes:

* `(status, created_at)`
* `(monthly_rent)`
* `(start_date, end_date)`
* Search: MVP uses ILIKE; upgrade to FTS later

### listing_photos

* `id` uuid pk
* `listing_id` fk → listings.id
* `image_url` text
* `display_order` int
* `created_at` timestamp

### reports

* `id` uuid pk
* `listing_id` fk → listings.id
* `reported_by_user_id` fk → users.id
* `reason` text
* `status` enum default OPEN
* `created_at` timestamp

Constraint:

* unique `(listing_id, reported_by_user_id)`

### contact_events (recommended)

* `id` uuid pk
* `listing_id` fk → listings.id
* `viewer_user_id` fk → users.id
* `created_at` timestamp

### listing_views

* `id` uuid pk
* `listing_id` fk → listings.id
* `viewer_user_id` fk → users.id **nullable** (anonymous listing detail loads)
* `created_at` timestamp

Indexes: `listing_id`, `viewer_user_id`

Purpose: one row per successful `GET /api/listings/:id` response when the requester is not the listing owner; powers **view_count** for the seller on `GET /api/me/listings`.

### reddit_listings

Separate from platform `listings`. Stores Reddit-sourced rows ingested via JSON import (`tools/reddit-import/`). Not owned by a `users` row.

* `id` uuid pk
* `external_id` text **unique** (Reddit submission id)
* `source` enum `ExternalListingSource` (default `REDDIT`)
* `title`, `description` (text)
* Nullable structured fields aligned with extract: `monthly_rent`, `lease_type`, `start_date`, `end_date`, `room_type`, `furnished`, `utilities_included`, `open_to_negotiation`, `gender_preference`, `nearby_landmark`, `total_bedrooms`, `total_bathrooms`, `exact_address`
* `external_url` text (Reddit post URL)
* `source_created_at` timestamp (from source post)
* `raw_text` text optional
* `image_urls` text array (Reddit CDN URLs; may be empty)
* `exclude` boolean default false (hide from Community API when true)

Index: `(exclude, source_created_at)` for listing queries.

**Operational import:** `lib/reddit-import/import-rows.ts` — **insert-only** for new `external_id`; existing ids are skipped (no update). CLI: `npm run reddit-import`, `npm run import-reddit-listings`. See `tools/reddit-import/README.md`.

---

## 6. Core Helpers (Migration-Friendly Interfaces)

These helpers are the “stable contract” so future migrations are painless:

### Auth helpers

* `requireAuth(req) -> { authUserId }`
* `requireVerified(req) -> { authUserId }`
* `requireProfileComplete(authUserId) -> user`
* `requireAdmin(authUserId) -> user`
* `requireNotBanned(authUserId)`

### Listing helpers

* `getPublicListings(filters) -> publicListing[]`
* `getVerifiedListings(filters, viewer) -> verifiedListing[]`
* `getListingPublic(id) -> publicListingDetail`
* `getListingVerified(id, viewer) -> verifiedListingDetail`
* `createListing(user, payload) -> listing`
* `updateListing(user, listingId, payload) -> listing`
* `markTaken(user, listingId)`
* `softDeleteListing(userOrAdmin, listingId)`
* `expireListingsJob() -> { expiredCount }`
* `recordListingView({ listingId, viewerUserId })` — inserts `listing_views` for ACTIVE listings; skips when the viewer is the owner (see `lib/listings/views.ts`)

### Reddit listing helpers

* `getRedditListingsMinimal({ page, pageSize, min_rent?, max_rent?, total_bedrooms? })` — public list fields for Community tab (`lib/reddit-listings/helpers.ts`). Optional filters match query params on `GET /api/reddit-listings`. **Where:** rows with `exclude = false`; rent/bedroom filters include rows with **null** `monthly_rent` or `total_bedrooms` when that dimension is filtered (so unparsed values remain visible). **Order:** sort tier `0` when every **active** filter is satisfied by non-null parsed values; tier `1` when a filtered dimension is null (unparsed); then rows with at least one `image_urls` entry before rows without; then `source_created_at` descending (all in SQL so pagination is global).
* `getRedditListingPublic(id)` / `getRedditListingVerified(id)` — anonymous vs verified detail shaping for `GET /api/reddit-listings/:id`

### Storage helpers

* `uploadProfilePicture(userId, file) -> url`
* `uploadListingPhotos(listingId, files[]) -> urls[]`
* (later swap storage provider by editing only this module)

### Search helper

* `applyListingFilters(query, filters)`
* `applyKeywordSearch(query, keyword)` (ILIKE now, FTS later)

---

## 7. Public vs Verified Data Shaping

### Public listing preview (logged-out)

Return only:

* `id`
* `title`
* `monthly_rent`
* `start_date`, `end_date`
* `nearby_landmark`
* `lease_type`
* `room_type`
* `furnished`
* `utilities_included`
* `open_to_negotiation`
* `owner_username`

Do NOT return:

* photos
* description
* exact_address
* owner name
* owner profile picture
* contact email

### Verified listing detail (logged-in + verified)

Return all listing fields plus:

* `photos[]`
* `owner_first_name`, `owner_last_name`
* `owner_profile_picture_url`
* `owner_username`
* `verified_badge = true`

### Reddit (Community) listings — visibility

**Public / anonymous:** list and detail return only `id`, `title`, `monthly_rent`, `total_bedrooms`, optional `thumbnail_url` (first image); detail includes `requires_login_for_details: true`.

**Verified session:** full row including `description`, dates, enums, `image_urls` / gallery, `external_url` for “View on Reddit”. No seller email or `contact_events`.

---

## 8. API Endpoints (Implementation Level)

All endpoints are **Next.js Route Handlers** under `/app/api/**/route.ts`.

### Conventions

* All JSON responses: `{ ok: boolean, data?: any, error?: { code, message, details? } }`
* Status codes:

  * 200 OK, 201 Created
  * 400 Validation
  * 401 Unauthorized
  * 403 Forbidden (unverified, banned, not owner)
  * 404 Not found
  * 409 Conflict (username taken, report duplicate)
  * 429 Too many requests (optional later)
  * 500 Server error

---

### 8.1 Auth / Session

#### `POST /api/auth/signup`

Creates Supabase Auth user and triggers a **signup confirmation** email (include `{{ .Token }}` in the Supabase email template so users receive a one-time code). The user completes verification by entering that code on `/verify-email` via `POST /api/auth/verify-email/verify`. **`emailRedirectTo` is not used** for completing verification in-app.

Body:

```json
{ "email": "netid@illinois.edu", "password": "..." }
```

Rules:

* must end with `@illinois.edu` (server check)
* if invalid → 400

Response:

```json
{ "ok": true, "data": { "needs_verification": true } }
```

#### `POST /api/auth/login`

Body:

```json
{ "email": "netid@illinois.edu", "password": "..." }
```

Response:

```json
{ "ok": true, "data": { "session": true } }
```

#### `POST /api/auth/logout`

Response:

```json
{ "ok": true }
```

#### `POST /api/auth/resend-verification`

Resends the **signup confirmation** OTP email (`type: "signup"`). No redirect URL is required for the in-app OTP flow.

Body:

```json
{ "email": "netid@illinois.edu" }
```

#### `POST /api/auth/verify-email/verify`

Verifies the signup confirmation code and establishes a session (SSR cookies).

Body:

```json
{ "email": "netid@illinois.edu", "token": "123456" }
```

* Server: `verifyOtp({ email, token, type: "signup" })`

#### `POST /api/auth/reset-password/request`

Starts password reset: sends an email OTP (`signInWithOtp` with `shouldCreateUser: false`). Same `@illinois.edu` rules as other auth routes; response is generic success to avoid email enumeration.

Body:

```json
{ "email": "netid@illinois.edu" }
```

#### `POST /api/auth/reset-password/verify`

Verifies the reset OTP and establishes a session.

Body:

```json
{ "email": "netid@illinois.edu", "token": "123456" }
```

* Server: `verifyOtp({ email, token, type: "email" })`

#### `POST /api/auth/reset-password/update`

Sets a new password for the **current session** only (`requireAuth` + `updateUser({ password })`).

Body:

```json
{ "password": "..." }
```

**Note:** `/auth/callback` remains available for OAuth/PKCE flows where applicable. Signup confirmation and password-reset **completion** no longer depend on users clicking links in email.

---

### 8.2 Me / Profile

#### `GET /api/me`

Auth: required

Returns current user domain profile (and flags):

```json
{
  "ok": true,
  "data": {
    "email": "...",
    "email_verified": true,
    "is_profile_complete": true,
    "role": "USER",
    "is_banned": false,
    "username": "alexk2026",
    "first_name": "Alex",
    "last_name": "Kim",
    "profile_picture_url": "..."
  }
}
```

#### `POST /api/me/profile/complete`

Auth: required + email verified
Completes profile (one-time; username immutable).

Body:

```json
{
  "first_name": "Alex",
  "last_name": "Kim",
  "username": "alexk2026",
  "profile_picture_url": "https://..."
}
```

Rules:

* username unique → else 409
* if profile already complete → 409 (or allow idempotent if identical)

Response:

```json
{ "ok": true, "data": { "is_profile_complete": true } }
```

#### `POST /api/me/profile-picture/upload`

Auth: required + email verified
Accepts multipart upload (or returns signed upload instructions).

MVP recommended approach:

* Use a **signed upload URL** or direct upload via Supabase client with server-issued policy.
* Endpoint returns a storage path / URL.

Response:

```json
{ "ok": true, "data": { "profile_picture_url": "..." } }
```

---

### 8.3 Listings

#### `GET /api/listings`

Public endpoint; returns **public previews** unless viewer is verified (then return verified previews).

Query params:

* `min_rent`, `max_rent`
* `start_date`, `end_date`
* `room_type`
* `furnished`
* `utilities_included`
* `lease_type`
* `keyword`
* `sort` = `newest` | `price_asc`
* `page`, `page_size`

Response (public):

```json
{ "ok": true, "data": { "items": [ ...publicPreview ], "page": 1, "has_more": true } }
```

**Browse UI (`/listings` Verified tab):** The page’s **Previous** / **Next** controls pass `page` (and existing filter/sort/keyword query params). Default `page_size` is **20** when omitted.

#### `GET /api/listings/:id`

Public endpoint; returns **public detail** unless viewer is verified (then return verified detail).

Side effect (implemented): after a successful response for an **ACTIVE** listing, the server records a **listing view** unless the authenticated domain user is the listing owner (owner preview/edit flows must not increment views). Logged-out viewers are recorded with `viewer_user_id` null.

Response (public detail):

* same as preview + possibly a “login to view more” flag

```json
{ "ok": true, "data": { "listing": { ...publicPreview }, "requires_login_for_details": true } }
```

Response (verified detail):

```json
{ "ok": true, "data": { "listing": { ...verifiedDetail } } }
```

#### `GET /api/reddit-listings`

Public. Paginated **Community** tab source.

**Query:** `page`, `page_size` (max **100**; default **20** when omitted), optional `min_rent`, `max_rent`, `total_bedrooms` (integer **1–5**; **5** means five or more bedrooms, same as Verified listings). If both `min_rent` and `max_rent` are set, `min_rent` must not exceed `max_rent` (else **400**).

Returns minimal card fields per item (`id`, `title`, `monthly_rent`, `total_bedrooms`, `thumbnail_url`); only rows with `exclude = false`. **Filter logic:** when rent bounds are set, rows with **null** `monthly_rent` remain included; when a bedroom value is set, rows with **null** `total_bedrooms` remain included; parsed rent outside the range or parsed bedroom count that does not match the selection are **excluded**. **Sort:** match tier (all active filters satisfied by parsed fields) before incomplete/unparsed-for-filter rows; then listings with images first (non-empty `image_urls`), then listings without; then `source_created_at` descending.

**Browse UI (`/listings`):** The Community tab is driven by this endpoint (and the Verified tab by `GET /api/listings` above). The page renders **Previous** / **Next** links that update `?page=` while preserving `tab=community`, Community filter params, or existing Verified query params as applicable. Default `page_size` is **20** when omitted.

#### `GET /api/reddit-listings/:id`

Public cookie-aware endpoint. Anonymous: minimal detail + `requires_login_for_details: true`. Verified @illinois.edu session: full detail including `images` / `external_url` (no email contact).

#### `POST /api/listings`

Auth: required + verified + profile complete + not banned

Body:

```json
{
  "title": "Sublease near Engineering Quad",
  "monthly_rent": 750,
  "lease_type": "SUBLEASE",
  "start_date": "2026-05-15",
  "end_date": "2026-08-10",
  "exact_address": "123 E Green St, Champaign, IL",
  "nearby_landmark": "2 mins from Engineering Quad",
  "total_bedrooms": 4,
  "room_type": "PRIVATE_ROOM",
  "furnished": true,
  "utilities_included": false,
  "open_to_negotiation": true,
  "gender_preference": "ANY",
  "description": "..."
}
```

Rules:

* validate required fields
* validate date ordering
* enforce **max 3 ACTIVE listings** per user → 403 with code `ACTIVE_LIMIT_REACHED`
* require photos: MVP implementation detail:

  * Either create listing first and then upload photos via `/photos` endpoint (recommended)
  * Or accept photo URLs already uploaded

Response:

```json
{ "ok": true, "data": { "listing_id": "..." } }
```

#### `POST /api/listings/:id/photos`

Auth: required + verified + profile complete
Owner-only. Upload up to 8 photos.

Response:

```json
{ "ok": true, "data": { "photos": [ { "image_url": "...", "display_order": 1 } ] } }
```

Validation:

* at least 1 photo must exist before listing becomes fully active. Two MVP options:

  * **Option A (simplest):** require client to upload first photo immediately after create; listing is visible once first photo exists.
  * **Option B:** set status `ACTIVE` only after first photo upload.
    Pick Option A unless you want stricter enforcement.

#### `PUT /api/listings/:id`

Auth: required + verified + profile complete
Owner-only. Body = same fields as create (partial allowed).

Rules:

* cannot change owner
* keep status as-is (do not auto-reactivate expired/taken)

Response:

```json
{ "ok": true, "data": { "updated": true } }
```

#### `POST /api/listings/:id/mark-taken`

Auth: required + verified + profile complete
Owner-only.

Response:

```json
{ "ok": true, "data": { "status": "TAKEN" } }
```

#### `DELETE /api/listings/:id`

Auth: required + verified + profile complete
Owner-only. Soft delete.

Response:

```json
{ "ok": true, "data": { "status": "DELETED" } }
```

#### `GET /api/me/listings`

Auth: required (profile complete expected for management flows)
Returns all listings for the current user including status badges, plus per-listing metrics:

* `view_count` — number of rows in `listing_views` for that listing (total detail loads by non-owners).
* `contact_viewer_count` — number of **distinct** `viewer_user_id` values in `contact_events` for that listing (multiple reveals by the same user still count once).

Example item fields:

```json
{
  "id": "...",
  "title": "...",
  "status": "ACTIVE",
  "monthly_rent": 750,
  "start_date": "...",
  "end_date": "...",
  "created_at": "...",
  "updated_at": "...",
  "view_count": 42,
  "contact_viewer_count": 5,
  "photos": [ { "image_url": "...", "display_order": 0 } ]
}
```

---

### 8.4 Contact Reveal

#### `POST /api/listings/:id/reveal-contact`

Auth: required + verified + profile complete + not banned

Behavior:

* Returns seller email
* Writes a row into `contact_events` when the caller is **not** the listing owner
* If the caller **is** the owner, returns **403** with code `CANNOT_CONTACT_SELF` and does **not** write `contact_events`
* Does NOT reveal anything to public users

Response:

```json
{ "ok": true, "data": { "seller_email": "owner@illinois.edu" } }
```

---

### 8.5 Reports

#### `POST /api/reports`

Auth: required + verified + profile complete

Body:

```json
{ "listing_id": "...", "reason": "Suspected scam / misleading info" }
```

Rules:

* enforce unique `(listing_id, reported_by_user_id)` → 409 `ALREADY_REPORTED`

Response:

```json
{ "ok": true, "data": { "report_id": "..." } }
```

---

### 8.6 Admin

Admin auth rule:

* must be verified + profile complete + `role=ADMIN`

#### `GET /api/admin/users`

Returns list of users.

#### `POST /api/admin/users/:id/ban`

Body:

```json
{ "is_banned": true }
```

#### `GET /api/admin/listings`

Includes all statuses; filterable.

#### `DELETE /api/admin/listings/:id`

Soft delete listing (status=DELETED)

#### `GET /api/admin/reports`

Returns open reports.

#### `POST /api/admin/reports/:id/resolve`

Body:

```json
{ "status": "RESOLVED" }
```

---

### 8.7 Jobs

#### `POST /api/jobs/expire-listings`

Protected by header secret `X-CRON-SECRET`.

Behavior:

* Finds listings where `status=ACTIVE` and `end_date < today`
* Sets status to `EXPIRED`
* Returns count

Response:

```json
{ "ok": true, "data": { "expired_count": 17 } }
```

---

## 9. Business Rules Enforcement (Must-Haves)

* **Max 3 active listings per user**
* Username unique and immutable
* Profile completion required for listings + contact reveal
* Email verification required for full access
* Public vs verified shaping server-side
* Soft delete
* Auto-expire daily job
* Report uniqueness

---

## 10. Search Implementation (Upgradeable)

MVP:

* SQL WHERE filters
* Keyword search: `ILIKE` on `title` and `description`
  Upgrade path:
* Postgres Full-Text Search index with ranking

All search logic lives in one server helper so the UI does not change.

---

## 11. Image Storage (Upgradeable)

MVP:

* Upload to Supabase Storage
* Store URLs in DB
* Only return photo URLs in verified endpoints (server shaping)

Upgrade:

* Signed URLs for verified users
* Provider swap possible by editing storage helper only

---

## 12. Deployment & Environments

* Vercel project with env vars:

  * Supabase URL
  * Supabase anon key (client)
  * Supabase service role key (server only)
  * Database URL for Prisma
  * Cron secret
* Supabase project for DB/Auth/Storage
* Vercel Cron configured daily for `/api/jobs/expire-listings`

---

## 13. Acceptance Criteria

Build is correct when:

* All endpoints enforce gates correctly
* Public endpoints never leak private fields
* Verified users get full view + contact reveal
* Listing lifecycle works: active/taken/expired/deleted
* Expiration job updates records daily
* Admin moderation works end-to-end

---
