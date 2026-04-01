# MVP Definition

## Purpose

Define the exact criteria for when the MVP is considered complete.

This document acts as the stopping boundary for MVP development.

No features outside this scope are required for launch.

---

# 1️⃣ Core Objective

Launch a functional, UIUC-only short-term housing marketplace where:

* Verified UIUC students can post structured short-term lease listings.
* Students can browse and filter listings.
* Students can securely obtain contact information.
* Admin can moderate the platform.

The platform does NOT handle payments, contracts, or transactions.

It is strictly a connection platform.

---

# 2️⃣ Authentication & User Accounts

## Requirements

Users must:

* Sign up using an `@illinois.edu` email.
* Verify email (one-time code on `/verify-email`) before gaining access to full platform features.
* Create a profile with:

  * First name
  * Last name
  * Username (unique, immutable)
  * Profile picture
  * Email (stored, not publicly editable)
  * Account created timestamp

## Visibility Rules

**Public (logged-out) users can see:**

* Username only

**Logged-in verified users can see:**

* First name
* Last name
* Profile picture
* Verified UIUC indicator

---

# 3️⃣ Listing Creation

Users may create up to **3 active listings maximum**.

Listings must include the following required fields:

* Title
* Monthly rent
* Available start date
* Available end date
* Exact address (hidden from public users)
* Nearby landmark (visible publicly)
* Lease type:

  * Sublease
  * Lease takeover
* Total number of bedrooms
* Private room OR entire unit
* Furnished (yes/no)
* Utilities included (yes/no)
* Open to negotiation (yes/no)
* Gender preference:

  * Male
  * Female
  * Any / No preference
* Description (character capped)
* At least 1 photo

Listings exceeding 3 active postings are not permitted.

Expired or deleted listings do not count toward the limit.

---

# 4️⃣ Browsing & Visibility Rules

## Public (Logged-Out) Users Can See:

* Title
* Monthly rent
* Available date range
* Nearby landmark
* Lease type
* Private room vs entire unit
* Furnished
* Utilities included
* Open to negotiation (when applicable)
* Username

They cannot see:

* Exact address
* Photos
* Description
* Real name
* Profile picture
* Contact information

---

## Logged-In Users Can See:

* Full listing details
* Exact address
* Photos
* Description
* Poster’s full name
* Profile picture
* Verified UIUC badge
* Contact access

---

# 5️⃣ Filtering & Search

Users must be able to filter listings by:

* Minimum rent
* Maximum rent
* Start date
* End date
* Private room vs entire unit
* Furnished
* Utilities included
* Lease type

Users must also have:

* Keyword search (title + description)
* Sort by:

  * Newest
  * Price (low to high)

No map view included in MVP.

---

# 6️⃣ Contact Flow

* User clicks “Contact Seller”.
* If not logged in → forced login.
* After login → email is revealed.
* Safety disclaimer displayed during contact.

No in-app messaging system.

No payment integration.

No contract automation.

---

# 7️⃣ Listing Management

Users can:

* Edit their listing
* Soft delete their listing
* Mark listing as taken

System behavior:

* Listings automatically hide when end date passes.
* Deleted listings are soft deleted.
* Expired listings are hidden automatically.
* Expired/deleted listings do not count toward active listing limit.

---

# 8️⃣ Admin Controls

Admin must be able to:

* View all users
* View all listings
* Delete listings
* Ban users
* View reported listings

Listings must include a “Report” option.

---

# 9️⃣ Business Rules

* Maximum 3 active listings per user.
* Username must be unique.
* Username cannot be changed after account creation.
* Only verified UIUC emails can create listings.
* Platform is connection-only and not responsible for transactions.

---

# 🔟 MVP Completion Checklist

The MVP is complete when:

* A verified UIUC student can:

  * Sign up
  * Verify email
  * Create profile
  * Upload profile picture
  * Create listing
  * Edit/delete listing
  * Mark listing as taken

* A visitor can:

  * Browse listings publicly
  * View limited listing information

* A logged-in user can:

  * View full listing details
  * Filter listings
  * Use keyword search
  * Reveal seller email

* Listings:

  * Respect active limit rules
  * Auto-hide when expired
  * Soft delete properly

* Admin can:

  * Moderate users
  * Moderate listings
  * View reports

When all above conditions function correctly and reliably, MVP is complete.

No additional features are required for launch.

---

