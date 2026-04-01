# UI_SPEC.md

UIUC Housing Marketplace — UI System Specification

---

# 1. Design Philosophy

The UI should feel:

• Clean
• Structured
• Modern
• Trustworthy
• Fast
• Student-friendly

Design inspiration:

• Airbnb listing UX
• Modern SaaS dashboards
• Apple-level spacing and clarity

Key principle:

**Every page must look like it belongs to the same product.**

All screens must follow:

• the same **navigation**
• the same **container**
• the same **spacing system**
• the same **card components**
• the same **color tokens**

No page should introduce new styling patterns.

---

# 2. Technology Stack

Required:

• Tailwind CSS
• shadcn/ui components
• Lucide icons

Rules:

• No custom CSS files
• Styling through Tailwind utilities only
• Theme tokens override allowed
• Mobile-first development

---

# 3. Color System (UIUC Theme)

Primary brand colors:

Illini Blue
`#13294B`

Illini Orange
`#FF5F05`

White
`#FFFFFF`

Supporting neutrals:

Gray 50
Gray 100
Gray 200
Gray 500
Gray 700

---

## Color Usage Rules

Illini Blue

Used for:

• navbar background
• page background accents
• headings

Illini Orange

Used for:

• primary CTA buttons
• price tags on listing cards
• focus states
• important badges

White

Used for:

• page surfaces
• cards
• input fields

Never:

• large orange backgrounds
• gradient color schemes

---

# 4. Typography

Font:

Inter (fallback: system-ui)

Scale:

Page Title
text-2xl md:text-3xl font-semibold

Section Title
text-lg font-semibold

Card Title
text-base font-medium

Body Text
text-sm

Meta Text
text-xs text-muted-foreground

---

# 5. Global Layout System

All pages must follow the **App Shell layout**.

Structure:

Navbar
Main container
Page content

---

## Page Container

All pages use:

```
mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8
```

Vertical spacing:

Mobile
space-y-6

Desktop
space-y-8

No page content should exceed **max-w-6xl**.

---

# 6. Responsive Layout Rules

Breakpoints (Tailwind defaults):

sm 640px
md 768px
lg 1024px
xl 1280px

---

## Mobile (< md)

• single column layout
• stacked sections
• filter drawer instead of full filter bar

---

## Tablet (md)

• 2 column listing grid

---

## Desktop (lg)

• 3 column listing grid

---

## Large screens (xl)

• 4 column listing grid

---

# 7. Global Navigation Bar

Used on **all pages**.

Height

64px

Layout

Left
Logo + product name

Center
Search bar (desktop only)

Right
Auth controls

Visitor:

Login
Sign up

Verified user:

Avatar
Dropdown menu

---

## Navbar Style

Background

Illini Blue

Text

White

Search bar

Rounded full input

---

# 8. Global Search Bar

Centered in navbar on desktop.

Design:

Rounded full input

Placeholder:

“Search listings…”

Includes icon.

Mobile:

Search moves below navbar.

---

# 9. Filter System

Used on Browse Listings page.

Desktop:

Horizontal filter bar.

Layout:

```
Price | Dates | Room Type | Furnished | Utilities | Lease Type | Sort
```

Each filter opens a popover.

Style:

• rounded container
• subtle border
• soft shadow

---

## Mobile Filters

Filters collapse into:

“Filters” button

Opens bottom drawer.

Includes:

Apply button
Clear button

---

# 10. Listing Grid

Grid layout:

```
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6
```

Cards must align evenly.

Images must have fixed aspect ratio.

---

# 11. Listing Card Component

Structure:

Image
Title + price
Landmark
Date range
Tags
Seller row

---

## Card Design

Container

rounded-xl
border
shadow-sm
hover:shadow-lg

Image

aspect-[4/3]
rounded-t-xl
object-cover

Price tag

Top-right overlay

Orange background

Example:

`$850 / month`

---

## Tags

Examples:

Private Room
Entire Unit
Furnished
Utilities Included
Sublease
Lease Takeover

Tag style:

Rounded badge

Muted background.

**Open to negotiation** (when `open_to_negotiation` is true):

Use a separate, high-emphasis treatment (e.g. solid emerald fill, bold text, ring/shadow) so it does not look like the muted metadata chips above. On the listing detail page, place near the rent when possible.

Shared via `NegotiableBadge` (same component on grid cards and detail).

---

## Seller Row

Avatar
Username
Verified badge

---

# 12. Listing Detail Page

Two layouts depending on authentication.

Product visibility rules from Product Spec apply. 

---

## Layout

Mobile

Single column.

Desktop

12 column grid.

```
Main content: col-span-8
Sidebar: col-span-4
```

---

## Main Content

Order:

Title
Rent (and **Open to negotiation** badge when applicable, visually tied to price)
Landmark
Date range
Photo gallery
Unit details
Description
Report listing

---

## Photo Gallery

Carousel.

Images:

rounded-xl

---

## Sidebar (Verified Users)

Seller card.

Contains:

Profile picture
Full name
Username
Verified badge
Contact Seller button

---

## Public Users

Hidden:

Photos
Description
Address
Contact button

Display instead:

Login CTA box

---

# 13. Landing Page

Structure:

Hero
Value proposition section
Browse CTA

---

## Hero Section

Centered content.

Title

“Find Short-Term Housing at UIUC”

Subheadline.

Search bar.

Primary CTA

Browse Listings.

---

## Value Props

3 columns:

Verified UIUC Students
Structured Listings
Powerful Filters

Cards:

rounded-xl
shadow-sm

---

# 14. Authentication Pages

Pages:

Login
Signup
Email verification (enter OTP on `/verify-email`)
Forgot password (`/forgot-password`)
Forgot password — enter OTP (`/forgot-password/verify`)
Reset password (`/reset-password`, after OTP session)
Profile setup

---

## Auth Layout

Centered card.

Max width:

```
max-w-md
```

Card style:

rounded-xl
border
shadow-md

Fields stacked vertically.

Primary button:

Orange.

---

# 15. Dashboard

Layout:

Simple page layout.

Top section:

Create Listing button.

Below:

User listings grid.

---

## Listing Status Badges

Active

Green badge

Taken

Gray badge

Expired

Muted badge

Deleted

Muted badge

Matches product lifecycle rules. 

---

# 16. Create Listing Page

Form layout.

Max width:

```
max-w-2xl
```

Sections:

Basic Info
Dates
Location
Unit Details
Description
Photos

---

## Photo Upload

Grid preview.

1–8 photos.

Drag and drop allowed.

---

# 17. Admin Panel

Minimal design.

Table layout.

Columns:

User
Listing
Date
Status
Actions

Actions:

Delete listing
Ban user

---

# 18. Motion & Interaction

Allowed animations:

Card hover shadow
Image hover zoom
Modal fade
Drawer slide

Not allowed:

Bounce animations
Heavy transitions
Parallax effects

---

# 19. Accessibility

Required:

Keyboard navigation
Visible focus ring (orange)
Semantic HTML
Input labels
ARIA roles where needed

---

# 20. UI Acceptance Checklist

Responsive:

320px no horizontal scroll

768px grid becomes 2 columns

1024px grid becomes 3 columns

1280px grid becomes 4 columns

---

Visibility:

Public cannot see photos

Public cannot see description

Public cannot see address

Public cannot contact seller

Verified users see all listing data

---

Lifecycle:

Expired listings hidden

Taken listings marked

Deleted listings not visible publicly

---

If any rule fails, implementation is incomplete.

---

# 21. Component Reuse Rule

All pages must reuse these core components:

Navbar
SearchBar
FilterBar
ListingCard
NegotiableBadge (for “Open to negotiation”; use wherever listing rent flexibility is shown)
SellerCard
AuthCard
PageContainer

New UI patterns must not be introduced without updating this spec.

---
