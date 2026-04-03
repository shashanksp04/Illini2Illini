# Product Spec

---

# 1. Product Overview

## What This Product Is

**Find Student Housing at UIUC** — a UIUC-only, verified-student marketplace focused exclusively on short-term leases and subleases.

The platform connects:

* Students who need housing at UIUC (including subleases and lease takeovers)
* Students who want to sublease or transfer their lease

The platform does NOT:

* Process payments
* Generate contracts
* Enforce lease agreements
* Mediate transactions

It is strictly a structured connection platform.

---

## Who It Is For

Primary Users:

* UIUC students studying abroad
* UIUC students graduating mid-year
* UIUC students doing internships
* Exchange students staying one semester
* Students needing Spring-only or Summer-only housing

The platform is restricted to verified @illinois.edu accounts.

---

## Core Value Proposition

Current ecosystem issues (from UIUC housing analysis ):

* Fragmented platforms
* Unstructured posts
* High volume of social media listings
* Trust concerns
* Poor filtering systems

This product solves that by providing:

* Verified UIUC-only accounts
* Structured listings
* Powerful filtering
* Centralized marketplace
* Cleaner UX

Single campus only (UIUC).

---

# 2. MVP Scope

Aligned exactly with MVP_DEFINITION.md .

---

## Feature: Authentication

* @illinois.edu email required
* Email verification mandatory
* Profile completion required before usage

Profile includes:

* First name
* Last name
* Username (unique, immutable)
* Profile picture
* Account created timestamp

Username:

* Unique
* Alphanumeric + underscore
* Cannot be changed after creation

---

## Feature: Structured Listing Creation

Users may create up to **3 active listings**.

Required fields:

Basic Info:

* Title (max 100 chars)
* Monthly rent (numeric)
* Lease type (Sublease / Lease takeover)

Dates:

* Start date
* End date (must be after start date, must be future)

Location:

* Exact address (hidden from public users)
* Nearby landmark (public, max 80 chars)

Unit Details:

* Total bedrooms (integer)
* Private room OR entire unit
* Furnished (yes/no)
* Utilities included (yes/no)
* Open to negotiation (yes/no; whether the seller is willing to negotiate rent)
* Gender preference (Male / Female / Any)

Description:

* Max 1000 characters

Photos:

* Minimum 1
* Maximum 8

---

## Feature: Public + Verified Visibility Model

Public users can see:

* Title
* Rent
* Date range
* Landmark
* Lease type
* Private vs entire
* Furnished
* Utilities included
* Open to negotiation (when true, shown prominently on cards and detail)
* Username

Public users cannot see:

* Exact address
* Photos
* Description
* Full name
* Profile picture
* Contact access

Verified logged-in users can see:

* All listing details
* Exact address
* Photos
* Description
* Full name
* Profile picture
* Verified badge
* Contact button

---

## Feature: Filtering & Search

Filters:

* Min rent
* Max rent
* Start date
* End date
* Private vs entire
* Furnished
* Utilities included
* Lease type

Includes:

* Keyword search (title + description)
* Sort by newest
* Sort by price (low to high)

**Pagination:** Browse results load in pages (default **20** per page). On `/listings`, users move between pages with **Previous** and **Next** below the grid on both the Verified and Community tabs; the URL uses `?page=`, and Verified filters/search/sort carry across pages; Community rent/bedroom filter params carry across pages when set.

No map view.

---

## Feature: Community (Reddit) listings (aggregated)

The browse experience includes a separate **Community (Reddit)** tab (verified **Illini2Illini** listings remain the default tab).

* Data is loaded from a dedicated API backed by the `reddit_listings` table (not user-owned `listings`).
* **Public / logged-out:** may see title, monthly rent, bedroom count, and optional image thumbnail on cards; detail pages lock further fields until the user is logged in with a verified @illinois.edu account.
* **Contact:** there is no “Contact seller” for Reddit rows; the product action is **open the post on Reddit** (external link).
* **Trust:** UI distinguishes verified platform listings from Reddit-sourced community listings.
* **Pagination:** Uses the same browse **Previous** / **Next** pattern as Verified; URL includes `tab=community` and `page` as needed.
* **Filters (Community tab):** Users can narrow by **monthly rent** (min/max) and **bedrooms** (query params align with Verified: `min_rent`, `max_rent`, `total_bedrooms`; bedroom `5` means five or more). Rows where rent or bedroom was **not parsed** into the database still appear when relevant filters are set, but are ordered **after** rows whose parsed values **match** the filters; rows with parsed values **outside** the range are excluded. The UI explains that parsing misses do not mean the information is absent from the original Reddit post.
* **Browse order (Community only):** When rent/bedroom filters are active, **match tier** (parsed fields satisfy active filters) comes first, then **thumbnail preference** (listings with at least one image before those without), then **source recency**. When no Community filters are set, order is **images first**, then recency (same as before).

Operational: new rows are added via a **daily JSON import** (see `tools/reddit-import/README.md`). Imports add **only new** Reddit submission ids; existing ids in the database are not overwritten by subsequent runs.

---

## Feature: Contact Flow

* User clicks “Contact Seller”
* Must be logged in and verified
* Seller email revealed
* Safety disclaimer displayed

No internal messaging system.

No payment integration.

---

## Feature: Listing Lifecycle Management

Users can:

* Edit listing
* Soft delete listing
* Mark listing as taken
* See listing **views** and **contact views** (how many distinct users revealed email) on their dashboard

System behavior:

* Listings auto-hide when end_date passes
* status = expired
* Expired/deleted/taken do NOT count toward active limit
* Soft delete (status = deleted)

---

## Feature: Admin Controls

Admin can:

* View users
* View listings
* Delete listings
* Ban users
* View reports
* Resolve reports

---

# 3. User Roles

---

## Visitor

Permissions:

* View listing previews
* Use filters
* Use search
* View limited detail pages

Restrictions:

* No photos
* No description
* No address
* No contact

---

## Verified User

Permissions:

* Create listings (max 3 active)
* Edit/delete listings
* Mark listing as taken
* View full listing details
* Reveal seller email
* Report listings

---

## Admin

Permissions:

* View all users
* Ban users
* View all listings
* Delete listings
* View reports
* Resolve reports

---

# 4. User Flows

(Condensed version for clarity; detailed logic already defined above.)

Signup → Verify Email (OTP code) → Complete Profile → Access Dashboard
Create Listing → Validate → Save → Status = Active
Browse (Public) → Limited View
Browse (Logged-In) → Full View
Contact → Reveal Email
Mark Taken → Status = Taken
Expiration → Automatic status = Expired

---

# 5. Screens / Pages

* Landing Page
* Browse Listings Page
* Listing Detail Page (public + logged-in versions)
* Signup Page
* Login Page
* Email Verification Page
* Profile Setup Page
* Dashboard
* My Listings Page
* Create Listing Page
* Edit Listing Page
* Admin Panel

---

# 6. Data Models

User
Listing
ListingPhoto
Report
ContactEvent (analytics)

(As previously defined in detail.)

---

# 7. API Interactions (Abstract Level)

Authentication operations
User profile operations
Listing CRUD operations
Report submission
Admin moderation actions

Detailed endpoints defined in build_spec.md .

---

# 8. Business Rules

* Max 3 active listings per user
* Username immutable
* Only verified users can create listings
* Exact address hidden from public
* Expired listings auto-hidden
* Deleted listings soft-deleted
* Only one report per listing per user

---

# 9. Edge Cases

* Duplicate email
* Username collision
* 4th listing attempt
* Expired listing edit
* Failed photo upload
* Report spam attempt
* Contact attempt by unverified user

---

# 10. Definition of MVP Complete

MVP complete when:

* All user flows function correctly
* Role-based visibility works precisely
* Listing lifecycle rules enforced
* Expiration automation works
* Contact reveal works
* Admin moderation works
* No functionality exceeds MVP_DEFINITION.md 

---


