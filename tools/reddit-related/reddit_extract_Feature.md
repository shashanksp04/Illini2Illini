# 🧩 Reddit Integration — Core Principles

## 1. Keep Reddit Listings Separate

* Do **NOT mix** Reddit posts with your main listings feed
* Create a dedicated section:

  * **“Community Listings (Reddit)”**

---

## 2. Maintain Clear UI Separation

* Use **two tabs or sections**:

  * 🟢 Verified Listings (Illini2Illini)
  * 🟡 Community Listings (Reddit)
* This preserves trust and avoids UX confusion

---

## 3. Normalize Reddit Data (Light Structuring)

* Extract and display:

  * Title
  * Price (if available)
  * Dates (if available)
  * Location keywords
  * Description text
* Keep it **clean, readable, and consistent**

---

## 4. No In-App Contact for Reddit Posts

* ❌ No “Contact Seller” button
* ✅ Only action: **“View on Reddit”**
* Prevents breaking your platform’s core contact model

---

## 5. Use Clear Tagging (Trust Signals)

* 🟢 **Verified** → platform listings
* 🟡 **Reddit Extracted** → external listings
* Make **Verified feel premium**, Reddit secondary

---

## 6. Prioritize Verified Listings

* Always:

  1. Show Verified listings first
  2. Reddit listings after (or in separate tab)
* Never give equal priority

---

## 7. Keep Content Fresh (Daily Pull)

* Pull Reddit posts **daily**
* Only include:

  * Last 24–48 hours
* Avoid clutter and stale listings

---

## 🔑 One-Line Strategy

> Reddit = **supply aggregator**
> Illini2Illini = **trusted marketplace**

---

Ready to go deeper — we can now design:

* UI (this is where it gets interesting), or
* Backend flow (cron + parsing + DB)
