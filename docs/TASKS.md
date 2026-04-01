# TASKS.md

Purpose:

Execution layer.

Contains:

- discrete implementation tasks
- build steps
- development progress

Tasks must be clear and executable.

---

# 0) Status

- Current phase: Build / Implementation
- Scope boundary: MVP_DEFINITION.md
- Stack + endpoints: BUILD_SPEC.md

---

# 1) Repo + Environment Setup

## 1.1 Create codebase
- [ ] Initialize Next.js (App Router) + TypeScript
- [ ] Add env handling + validation (server-only vs client)
- [ ] Add linting/formatting (minimal)

Acceptance:
- App runs locally.
- Env vars fail fast if missing.

## 1.2 Supabase project setup
- [ ] Create Supabase project
- [ ] Enable email/password auth
- [ ] Configure email verification
- [ ] Configure allowed signup domains policy in server logic (must enforce @illinois.edu)

Acceptance:
- Can create user, receives verification email.

## 1.3 Storage buckets
- [ ] Create buckets:
  - [ ] profile-pictures
  - [ ] listing-photos
- [ ] Decide public/private bucket policy (MVP: simplest workable)
- [ ] Add minimal upload constraints (file size, mime types)

Acceptance:
- Upload works end-to-end for both buckets.

---

# 2) Database + ORM

## 2.1 Prisma (or ORM) setup
- [ ] Add Prisma + connect to Supabase Postgres
- [ ] Define schema models:
  - [ ] users
  - [ ] listings
  - [ ] listing_photos
  - [ ] reports
  - [ ] contact_events
  - [ ] listing_views (seller view counts; nullable viewer_user_id for anonymous views)
  - [ ] enums per BUILD_SPEC

Acceptance:
- Prisma migrate runs cleanly.
- Tables + enums exist.

## 2.2 DB constraints + indexes
- [ ] Unique constraints:
  - [ ] users.email
  - [ ] users.username
  - [ ] users.auth_user_id
  - [ ] reports(listing_id, reported_by_user_id)
- [ ] Indexes:
  - [ ] listings(status, created_at)
  - [ ] listings(monthly_rent)
  - [ ] listings(start_date, end_date)

Acceptance:
- Constraints enforced at DB level.

---

# 3) Core Server Helpers (Migration-Friendly Contracts)

## 3.1 Auth helpers
- [ ] Implement:
  - [ ] requireAuth(req) -> { authUserId }
  - [ ] requireVerified(req) -> { authUserId }
  - [ ] requireProfileComplete(authUserId) -> user
  - [ ] requireNotBanned(authUserId)
  - [ ] requireAdmin(authUserId) -> user

Acceptance:
- Any protected endpoint rejects correctly:
  - 401 unauthorized
  - 403 unverified / banned / not admin

## 3.2 Listing helpers
- [ ] Implement:
  - [ ] getPublicListings(filters)
  - [ ] getVerifiedListings(filters, viewer)
  - [ ] getListingPublic(id)
  - [ ] getListingVerified(id, viewer)
  - [ ] createListing(user, payload)
  - [ ] updateListing(user, listingId, payload)
  - [ ] markTaken(user, listingId)
  - [ ] softDeleteListing(userOrAdmin, listingId)
  - [ ] expireListingsJob()

Acceptance:
- Helpers pass basic unit tests or manual verification.

## 3.3 Search helper (MVP)
- [ ] Implement keyword search with ILIKE (title + description)
- [ ] Implement filter composition in one place
- [ ] Implement sort:
  - [ ] newest
  - [ ] price_asc

Acceptance:
- /api/listings returns correctly filtered results.

## 3.4 Storage helper
- [ ] Implement:
  - [ ] uploadProfilePicture(userId, file) -> url
  - [ ] uploadListingPhotos(listingId, files[]) -> urls[]
- [ ] Enforce max photo count = 8
- [ ] Validate mime types and size limits

Acceptance:
- URLs saved and returned only where allowed by visibility rules.

---

# 4) API Endpoints (Implementation Level)

(All must follow BUILD_SPEC conventions: { ok, data?, error? } + correct status codes.)

## 4.1 Auth
- [ ] POST /api/auth/signup
  - [ ] enforce @illinois.edu on server
  - [ ] create Supabase auth user
- [ ] POST /api/auth/login
- [ ] POST /api/auth/logout
- [ ] POST /api/auth/resend-verification
- Shipped additions (OTP): `POST /api/auth/verify-email/verify`, `POST /api/auth/reset-password/request`, `POST /api/auth/reset-password/verify`, `POST /api/auth/reset-password/update` — see `BUILD_SPEC.md` §8.1.

Acceptance:
- Signup/login/logout all functional.
- Verification gating enforced on later endpoints.

## 4.2 Me / Profile
- [ ] GET /api/me
  - [ ] return flags: email_verified, is_profile_complete, role, is_banned
- [ ] POST /api/me/profile-picture/upload
  - [ ] upload image to storage and return profile_picture_url
- [ ] POST /api/me/profile/complete
  - [ ] set first_name, last_name, username (immutable), profile_picture_url
  - [ ] username uniqueness -> 409

Acceptance:
- Profile completion is required for create listing + reveal contact.
- Username cannot be changed after set.

## 4.3 Listings
- [ ] GET /api/listings
  - [ ] public returns public preview shape
  - [ ] verified returns verified preview shape
  - [ ] supports filters + keyword + sorting + pagination
- [ ] GET /api/listings/:id
  - [ ] public returns limited detail + requires_login_for_details = true
  - [ ] verified returns full detail
  - [ ] records `listing_views` on success for ACTIVE listings (skip owner)
- [ ] POST /api/listings
  - [ ] requires verified + profile complete + not banned
  - [ ] enforce max 3 ACTIVE listings/user (403 ACTIVE_LIMIT_REACHED)
- [ ] POST /api/listings/:id/photos
  - [ ] owner-only
  - [ ] upload up to 8
  - [ ] ensure at least 1 photo exists for a valid listing (MVP flow)
- [ ] PUT /api/listings/:id
  - [ ] owner-only
  - [ ] partial update allowed
  - [ ] cannot re-activate expired/taken automatically
- [ ] POST /api/listings/:id/mark-taken
  - [ ] owner-only sets TAKEN
- [ ] DELETE /api/listings/:id
  - [ ] owner-only soft delete sets DELETED
- [ ] GET /api/me/listings
  - [ ] return all user listings with status
  - [ ] include `view_count` and `contact_viewer_count` per listing

Acceptance:
- Public never receives photos/description/exact_address/real name/profile pic.
- Verified receives full fields per spec.

## 4.4 Contact reveal
- [ ] POST /api/listings/:id/reveal-contact
  - [ ] verified + profile complete + not banned
  - [ ] returns seller_email
  - [ ] writes contact_events row when caller is not the listing owner
  - [ ] 403 `CANNOT_CONTACT_SELF` for owner (no contact_events row)
  - [ ] shows safety disclaimer in UI (see UI tasks)

Acceptance:
- Email is NOT leaked anywhere else.
- Contact reveal creates a `contact_events` row for non-owner viewers only.

## 4.5 Reports
- [ ] POST /api/reports
  - [ ] verified + profile complete
  - [ ] enforce unique report per user per listing -> 409 ALREADY_REPORTED

Acceptance:
- Duplicate reporting blocked by DB constraint and endpoint behavior.

## 4.6 Admin
(Admin requires verified + profile complete + role=ADMIN)
- [ ] GET /api/admin/users
- [ ] POST /api/admin/users/:id/ban (toggle is_banned)
- [ ] GET /api/admin/listings (all statuses, filterable)
- [ ] DELETE /api/admin/listings/:id (soft delete)
- [ ] GET /api/admin/reports (open reports)
- [ ] POST /api/admin/reports/:id/resolve (set RESOLVED)

Acceptance:
- Non-admin gets 403.
- Admin can ban user and banned user is blocked from protected flows.

## 4.7 Jobs
- [ ] POST /api/jobs/expire-listings
  - [ ] protected via X-CRON-SECRET
  - [ ] set ACTIVE listings with end_date < today to EXPIRED
  - [ ] return expired_count

Acceptance:
- Manual curl with secret works; without secret fails.
- End-date expiration correctly hides listings.

---

# 5) UI Pages + UX Flows

## 5.1 Public browsing (logged-out)
- [ ] Landing page
- [ ] Browse listings page:
  - [ ] show public preview fields only
  - [ ] filter UI + keyword search + sorting
- [ ] Listing detail page (public):
  - [ ] show limited view
  - [ ] “Login to see photos / description / address” gating

Acceptance:
- Public can browse but cannot access restricted fields.

## 5.2 Auth UX
- [ ] Signup page
- [ ] Login page
- [ ] Email verification page (instructions + resend)

Acceptance:
- Clear UX for verification requirement.

## 5.3 Profile completion UX (required)
- [ ] Profile setup page:
  - [ ] first name
  - [ ] last name
  - [ ] username (unique, immutable)
  - [ ] profile picture upload
- [ ] “Profile incomplete” blocking states on create listing & contact

Acceptance:
- User cannot create listings or reveal contact without completing profile.

## 5.4 Verified browsing + listing details
- [ ] Verified listing detail page:
  - [ ] render photos, description, exact address
  - [ ] show poster real name + profile picture + verified badge
  - [ ] show **Open to negotiation** prominently when `open_to_negotiation` is true (distinct from other chips)

Acceptance:
- Verified sees full detail only when verified + logged in.

## 5.5 Create/edit listings
- [ ] Create listing page (all required fields, including **Open to negotiation**)
- [ ] Photo upload step (min 1, max 8)
- [ ] Edit listing page (including ability to change **Open to negotiation**)
- [ ] My listings page:
  - [ ] status badges (ACTIVE/TAKEN/EXPIRED/DELETED)
  - [ ] per-card **views** and **contact views** (from `GET /api/me/listings`)
  - [ ] actions: edit, mark taken, delete

Acceptance:
- Enforces required fields + photo requirement.
- Enforces max 3 ACTIVE listings.

## 5.6 Contact flow UI
- [ ] “Contact Seller” button
  - [ ] if logged out -> redirect to login
  - [ ] if unverified -> show verify prompt
  - [ ] if profile incomplete -> redirect to profile setup
- [ ] Contact reveal page/modal:
  - [ ] show safety disclaimer
  - [ ] reveal email only after successful API call

Acceptance:
- Email only visible after reveal endpoint success.

## 5.7 Report listing UI
- [ ] “Report” action on listing detail (verified only)
- [ ] Simple reason input + submit

Acceptance:
- Public cannot report; verified can.

## 5.8 Admin panel UI
- [ ] Admin dashboard page
- [ ] Users table + ban toggle
- [ ] Listings table + delete
- [ ] Reports table + resolve

Acceptance:
- Only admin sees admin routes.

---

# 6) Policies, Disclaimers, and Safety Content (MVP)

- [ ] Add platform disclaimer copy (connection-only, not liable for transactions)
- [ ] Add safety disclaimer shown during contact reveal
- [ ] Add minimal Terms link/footer (text-only ok for MVP)

Acceptance:
- Disclaimer visible in contact flow and accessible globally.

---

# 7) QA Checklist (MVP Completion Criteria)

## 7.1 Role-based visibility
- [ ] Public cannot see: photos, description, exact address, real name, profile pic, email
- [ ] Verified can see all above

## 7.2 Business rules
- [ ] Max 3 ACTIVE listings per user enforced
- [ ] Username uniqueness + immutability enforced
- [ ] Soft delete works
- [ ] Mark taken works
- [ ] Expiration job sets EXPIRED and hides listings

## 7.3 Abuse/moderation
- [ ] Report uniqueness enforced
- [ ] Admin ban blocks protected actions
- [ ] Admin can delete listing and resolve reports

Acceptance:
- All checks pass with manual test scripts.

---

# 8) Deployment

- [ ] Vercel deploy
- [ ] Configure env vars in Vercel (Supabase URL/keys, DB URL, CRON secret)
- [ ] Configure Supabase env/auth redirects (prod URL)
- [ ] Configure Vercel Cron to call /api/jobs/expire-listings daily
- [ ] Smoke test production build

Acceptance:
- Production app usable end-to-end with real email verification.

---

# 9) Progress Log (Optional)

(Use this section to log what’s done, dates, and links to PRs.)

- YYYY-MM-DD — Task — Notes/PR