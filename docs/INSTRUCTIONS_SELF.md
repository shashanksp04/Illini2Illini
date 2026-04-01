## For GPT Chats:
Before starting a new chat in the Project, make sure you say 
"Read project_context.md, follow it for all future responses and get ready."

## For Brainstorming and Updates:
Create separate chats inside the Project for different purposes to keep work organized and context clean. 
For example, create a chat like IDEAS — Brainstorming to explore feature ideas, discuss possibilities, and think through product 
decisions without worrying about structure or finality. This is where creative and exploratory thinking happens. Similarly, you 
can create other focused chats such as Master Product Spec and Master Build Spec, each dedicated to maintaining their respective 
documents without mixing in unrelated discussion.

Use the Master Product Spec chat to create, refine, and update the product_spec.md file, which defines what the product does, its features, 
and user behavior. Use the Master Build Spec chat to create and update the build_spec.md file, which defines how the product will be built, 
including architecture, database design, and technical implementation. This separation ensures brainstorming stays flexible, while the spec 
chats remain clean, structured, and ready to guide development.

## When asking GPT to update project_context using the following prompt
I'm done finalizing my Build_Spec.md, Tasks.md and Decision.md file. Now before I start coding, I want to finalize the UI or visual design of my product. It will be stored in UI_Spec.md. Update my Project_Context.md file accordingly. Also when you update, the sections like description of .md files should stay consistent. U should preserve the verbatim of the file (refer to the project_context.md I upload the updated version before running this prompt). You should only add new content or edit the necessary relevant content

When implementing the Email Verification page (UI tasks):

The shipped flow is **OTP in-app**, not “click link then land on home.” After signup, users go to **`/verify-email`**, enter the **one-time code** from email, and **`POST /api/auth/verify-email/verify`** establishes the Supabase session (cookies via SSR).

Ensure:

* Session is available immediately after a successful verify (same-origin fetch + cookie handling).
* Gating updates: unverified users stay blocked from protected actions until `email_confirmed_at` is set.
* Clear UX feedback on success (then redirect, e.g. to `/listings`; middleware may send new users to `/profile/setup` if the profile is incomplete).
* No requirement for the **landing page** to detect a “just verified” return from an email link—that pattern is obsolete for this product.

**verify-email page OTP UX** (code field, resend, error states for invalid/expired codes) is the right place to refine polish.