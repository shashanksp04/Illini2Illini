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
* **Event pattern**: `contact_events` table establishes future notification/messaging event model.

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

#### `GET /api/listings/:id`

Public endpoint; returns **public detail** unless viewer is verified (then return verified detail).

Response (public detail):

* same as preview + possibly a “login to view more” flag

```json
{ "ok": true, "data": { "listing": { ...publicPreview }, "requires_login_for_details": true } }
```

Response (verified detail):

```json
{ "ok": true, "data": { "listing": { ...verifiedDetail } } }
```

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

Auth: required
Returns all listings for current user including status badges.

---

### 8.4 Contact Reveal

#### `POST /api/listings/:id/reveal-contact`

Auth: required + verified + profile complete + not banned

Behavior:

* Returns seller email
* Writes a row into `contact_events`
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
