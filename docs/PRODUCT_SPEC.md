# Product Spec

---

# 1. Product Overview

## What This Product Is

A UIUC-only, verified-student housing marketplace focused exclusively on short-term leases and subleases.

The platform connects:

* Students who need short-term housing
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

No map view.

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


