# 🎨 UI_SPEC.md (MVP Visual System)

This document defines visual design and UX presentation only.
It must not introduce new features or alter backend behavior defined in product_spec.md or build_spec.md.

---

# 1️⃣ Design System

## Brand Direction

**Positioning:**
Campus-native, trustworthy, structured, student-first.

**Avoid:**

* Landlord-corporate aesthetic
* Overly playful startup vibe
* Loud Illinois athletics branding
* Gradient-heavy tech bro look

We borrow from Illinois colors — but in a refined way.

---

## 🎨 Color System

### Primary Brand Color (Illinois-Inspired)

**Illini Blue (Primary)**

* `#13294B`
* Used for:

  * Primary buttons
  * Headers
  * Logo
  * Active states
  * Verified elements

This creates institutional trust.

---

### Accent / Secondary Color

**Illini Orange (Accent)**

* `#E84A27`
* Used sparingly:

  * Hover states
  * Links
  * Focus rings
  * Small accent elements

Never large background fills.

---

### Neutrals (Core UI Backbone)

| Role            | Color     |
| --------------- | --------- |
| Background      | `#F8F9FB` |
| Surface / Cards | `#FFFFFF` |
| Border          | `#E5E7EB` |
| Text Primary    | `#111827` |
| Text Secondary  | `#6B7280` |
| Disabled        | `#D1D5DB` |

Clean, modern, Tailwind-friendly palette.

---

### Semantic Colors

| State   | Color     | Usage                |
| ------- | --------- | -------------------- |
| Success | `#16A34A` | ACTIVE               |
| Warning | `#D97706` | Rare use             |
| Error   | `#DC2626` | EXPIRED, form errors |
| Info    | `#2563EB` | Verified badge       |

These are muted, not neon.

---

## 🧱 Border Radius

* Cards: `rounded-xl`
* Buttons: `rounded-lg`
* Inputs: `rounded-lg`
* Badges: `rounded-full`

Soft but not bubbly.

---

## 🌫 Shadow Depth

Use only two levels:

* **Card default:** `shadow-sm`
* **Hover:** `shadow-md`

No heavy elevation system.

---

## 🔤 Typography

### Font Stack

Use system-native + Inter:

```
Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
```

### Scale

| Role  | Size                   |
| ----- | ---------------------- |
| H1    | text-3xl font-semibold |
| H2    | text-2xl font-semibold |
| H3    | text-xl font-medium    |
| Body  | text-base              |
| Small | text-sm                |
| Micro | text-xs                |

No fancy serif. Clean, modern.

---

# 2️⃣ Status Color Coding

Consistency builds trust.

---

## Listing Status Badges

| Status  | Style                                            |
| ------- | ------------------------------------------------ |
| ACTIVE  | Green background (`bg-green-100 text-green-700`) |
| TAKEN   | Gray (`bg-gray-100 text-gray-600`)               |
| EXPIRED | Red (`bg-red-100 text-red-700`)                  |
| DELETED | Not shown publicly                               |

Badges:

* `text-xs`
* `font-medium`
* `rounded-full`
* subtle padding

---

## Verification Badge

**UIUC Verified**

* Small blue check icon
* Color: `#2563EB`
* Placed next to user name
* Tooltip: “Verified UIUC Student”

Must feel official but not dramatic.

---

## Lease Type Tags

| Type           | Color                                    |
| -------------- | ---------------------------------------- |
| Sublease       | Purple (`bg-purple-100 text-purple-700`) |
| Lease takeover | Teal (`bg-teal-100 text-teal-700`)       |

These are contextual, not dominant.

---

## Gender Preference Tag

Very subtle:

* `bg-gray-100 text-gray-600`
* Small
* Same visual weight as bedrooms count

We do NOT emphasize gender visually.

---

# 3️⃣ Component Patterns

Minimal, structured, repeatable.

---

## 🧾 Listing Card (Browse Page)

Layout:

```
---------------------------------------
| Title (bold)        $750 / month    |
| Landmark                          |
| Date range                         |
| -----------------------------------|
| [Private Room] [Furnished] [UTIL]  |
| [Sublease] [ACTIVE badge]          |
| Username                           |
---------------------------------------
```

Rules:

* Clean white card
* 16px padding
* No photos in public preview
* Hover shadow increase
* Entire card clickable

Verified users:

* Show 1 thumbnail photo in corner
* Show owner profile circle (small)

---

## 📄 Listing Detail Page

### Layout (Desktop)

```
Left (2/3):
  Photo gallery (carousel or grid)
  Title + rent
  Tags row
  Description
  Exact address

Right (1/3):
  Seller card
    Profile picture
    Full name
    Verified badge
    Contact button
    Report link
```

Mobile:

* Single column
* Contact button sticky bottom

---

## 🔍 Filter Pattern

MVP simplicity:

**Top horizontal filters** (NOT sidebar)

Why:

* Faster to build
* Better mobile consistency
* Less layout complexity

Structure:

* Rent min/max
* Date range
* Lease type
* Room type
* Furnished
* Utilities included
* Keyword search

Compact, collapsible on mobile.

---

## 🔘 Button Styles

### Primary

* Background: Illini Blue
* Text: white
* Hover: slightly darker
* Used for:

  * Create listing
  * Contact seller
  * Submit

---

### Secondary

* White background
* Border gray
* Text dark
* Used for:

  * Cancel
  * Edit

---

### Destructive

* White background
* Red text
* Red border
* Used for:

  * Delete listing
  * Ban user

No filled red buttons.

---

## 📝 Form Field Style

* `rounded-lg`
* 1px gray border
* Focus ring: Illini Orange
* Label above field
* Clear error state below field

---

## ❗ Error State

* Border: red
* Helper text: red small text
* Optional subtle background tint

No shake animations.

---

## 🗂 Empty State

Example: No listings found

Centered:

* Small icon (house outline)
* Message:
  “No listings match your filters.”
* Secondary text:
  “Try adjusting your rent range or dates.”

Optional button:

* “Clear Filters”

No illustrations for MVP.

---

# 4️⃣ Tone of Visual Identity

Final Decision:

### Illini2Illini = Clean Campus Tech

Feels:

* Built by students
* For students
* Structured
* Trustworthy
* Not flashy
* Not landlord-corporate
* Slightly institutional

We lean on:

* Structured layout
* Strong typography
* Subtle Illinois-inspired color accents

We do NOT:

* Use loud orange blocks
* Use gradients
* Use heavy animations
* Mimic Zillow or leasing portals

---

# 5️⃣ Implementation Strategy (MVP-Aligned)

Use:

* **Tailwind CSS**
* **shadcn/ui**
* Minimal customization
* Override theme tokens only

Do NOT:

* Build custom component library
* Overwrite design tokens extensively
* Add dark mode (Post-MVP)

---

# Final Visual Positioning Summary

Illini2Illini should feel like:

> “If UIUC students built a better housing board — modern, verified, and structured.”

Not:

> “Another landlord portal.”

---