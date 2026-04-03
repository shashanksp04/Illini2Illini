# 📄 DECISIONS.md TEXT

(Ready to paste into decisions.md )

---

Decision: Hybrid Visibility Model (Public + Verified Access)

Reason:
Encourages signup while preserving SEO and discoverability.
Protects privacy of full addresses and personal data.
Balances growth and trust.

Date:
2026-02-28

---

Decision: Username Required and Immutable

Reason:
Prevents identity churn and impersonation.
Improves credibility.
Simplifies moderation.

Date:
2026-02-28

---

Decision: Maximum 3 Active Listings Per User

Reason:
Prevents spam and abuse.
Allows realistic multi-room subleases.
Maintains marketplace quality.

Date:
2026-02-28

---

Decision: Exact Address Required but Hidden from Public

Reason:
Location is critical decision factor at UIUC.
Improves listing quality.
Maintains privacy for non-verified visitors.

Date:
2026-02-28

---

Decision: Landmark Field Publicly Visible

Reason:
Provides contextual location without exposing full address.
Improves browsing experience for visitors.

Date:
2026-02-28

---

Decision: No Internal Messaging in MVP

Reason:
Reduces engineering complexity.
Speeds launch.
Email reveal is sufficient for connection platform.

Date:
2026-02-28

---

Decision: Soft Delete Instead of Hard Delete

Reason:
Allows moderation review.
Preserves audit trail.
Prevents accidental permanent deletion.

Date:
2026-02-28

---

Decision: Automatic Expiration Based on End Date

Reason:
Prevents stale inventory.
Keeps marketplace clean without manual moderation.

Date:
2026-02-28

---

Decision: Lease Type Required (Sublease vs Lease Takeover)

Reason:
Important distinction in UIUC housing ecosystem.
Improves clarity and filtering.

Date:
2026-02-28

---

Decision: Profile Picture Required

Reason:
Increases trust.
Improves credibility.
Differentiates from anonymous social media posts.

Date:
2026-02-28

---

Decision: Use Supabase (Postgres + Auth + Storage) Instead of Firebase for MVP
Reason: 
Founder is not familiar with Firebase; Postgres fits marketplace filtering/search/expiration and constraints more naturally; 
fastest path to ship while staying within MVP scope.

Date: 
2026-02-28

---

Decision: Migration-Friendly Architecture Boundaries
Reason: 
Keep Supabase Auth as identity-only, store all domain data in Postgres, enforce access and business logic server-side, and wrap integrations (storage/search/auth checks) behind helper functions so future changes (messaging, notifications, storage provider, search engine) require minimal refactors.

Date: 
2026-02-28

---

Decision: Add auth_user_id to Users Table (Auth-Provider Decoupling)
Reason: 
Allows swapping auth providers in the future without changing domain primary keys or relationships; improves long-term portability.

Date: 
2026-02-28

---

Decision: Include contact_events Table in MVP
Reason: Provides lightweight audit/analytics for email reveal flow and establishes an extensible event pattern for future messaging/notifications without adding MVP complexity.

Date: 
2026-02-28

---

Decision: Include listing_views Table for Seller Metrics
Reason: Records each non-owner successful listing detail load (`GET /api/listings/:id`) so sellers see **view** totals on My Listings without client-side beacons; optional `viewer_user_id` preserves attribution for logged-in viewers while still counting anonymous traffic.

Date:
2026-03-31

---

Decision: Community (Reddit) listings in a separate table

Reason:

* Keeps Reddit-sourced posts out of the verified `listings` feed and preserves a clear trust model (verified vs external).
* No `owner_id`; contact is via **external Reddit URL**, not email reveal.

Date:
2026-04-03

---

Decision: Reddit JSON import is insert-only for existing `external_id`

Reason:

* Daily runs add **new** submissions without re-writing rows already stored.
* Avoids overwriting data if the extract or pipeline changes; tradeoff: corrections to existing posts require manual DB edit or a future “force update” mode.

Date:
2026-04-03

---

Decision: Browse listings pagination via URL + shared Prev/Next on both tabs

Reason:

* `GET /api/listings` and `GET /api/reddit-listings` already expose `page`, `page_size` (max 100), and `has_more`.
* The `/listings` route uses server-rendered **Previous** / **Next** links so pagination works without client state; `listingsHrefForPage` keeps Verified filters and Community `tab` in sync with `?page=`.

Date:
2026-04-03

---

Decision: Community browse lists rows with images before rows without (then by recency)

Reason:

* Improves grid preview when many Reddit posts lack images.
* Sort is applied in the **paginated** `GET /api/reddit-listings` query (not client-side) so ordering stays correct across pages.
* When rent/bedroom filters are active, **match tier** (parsed fields vs filters) sorts **before** the image/recency tie-break within each tier.

Date:
2026-04-03

---

Decision: Community tab rent/bedroom filters preserve unparsed rows at the end of the sort

Reason:

* Reddit import may leave `monthly_rent` or `total_bedrooms` null when text parsing fails; the original post may still contain that information (e.g. in an image).
* Users can filter by rent and bedrooms while still seeing those listings, ordered after rows whose parsed fields match the active filters.
* Same query params as Verified browse (`min_rent`, `max_rent`, `total_bedrooms`) keep URL state consistent when switching tabs.

Date:
2026-04-03

---

Decision: Use Vercel Cron for Daily Listing Expiration
Reason: 
Minimal operational overhead and simplest scheduled execution model aligned with MVP speed and monolith deployment.

Date: 
2026-02-28

---

Decision: Email Verification and Password Reset via In-App OTP (Supabase `verifyOtp`)

Reason:

* Avoids reliance on confirmation/reset **links** in email (reduces prefetch and “link clicked before user” issues).
* Aligns with Supabase Auth: `verifyOtp` with `type: "signup"` for signup confirmation and `type: "email"` for password-reset OTP after `signInWithOtp`.
* Password change after reset remains server-gated with `requireAuth` + `updateUser({ password })`.

Date:

2026-03-31

---

Decision: Listing Field `open_to_negotiation` (Open to negotiation)

Reason:

* Lets sellers signal price flexibility, which can improve conversion.
* Stored as a boolean on `listings`, set at create time and editable later.
* Shown to all viewers (including public preview) when true, using a distinct **NegotiableBadge** treatment so it does not blend in with other metadata chips.

Date:

2026-03-31

---