Below is your **updated `PROJECT_CONTEXT.md`**, preserving the original structure and wording from  exactly where unchanged, and only adding the necessary updates to reflect:

* `build_spec.md`, `tasks.md`, and `decisions.md` are finalized   
* New file: `ui_spec.md` (visual + UX design system)
* Project stage shift: Build → UI/Visual Finalization → Implementation

---

# Project Context

## 1. Purpose of This File

This file provides persistent context and operational instructions for ChatGPT for this project.

ChatGPT must read this file at the start of every new conversation and use it to guide all responses.

This file defines:

* product background
* project goals
* file roles
* constraints
* behavioral instructions

This file is the meta-layer and source of operational truth.

It does NOT contain full product specifications or technical implementation details.

Those are defined in other files.

---

# 2. File Role Definitions (CRITICAL)

ChatGPT must understand the distinct role of each file and use them appropriately.

---

## project_context.md

Purpose:

Persistent project brain.

Contains:

* product overview
* constraints
* philosophy
* instructions to ChatGPT
* high-level context

ChatGPT must ALWAYS follow this file.

---

## product_spec.md

Purpose:

Defines WHAT to build.

Contains:

* features
* user flows
* behavior
* UX logic
* MVP scope

The MVP scope is finalized and locked in this file.

No features outside this scope should be added without explicit instruction.

Reference: 

---

## build_spec.md

Purpose:

Defines HOW to build the product.

Contains:

* tech stack
* database schema
* API endpoints
* system architecture
* integration details

Reference: 

Used primarily for implementation.

---

## ui_spec.md  *(NEW)*

Purpose:

Defines HOW the product looks and feels visually.

Contains:

* design system
* typography
* color system
* spacing rules
* layout patterns
* component specifications
* page-level layout decisions
* interaction patterns

This file must:

* Stay strictly within MVP scope defined in `product_spec.md`
* Not introduce new features
* Not alter business rules
* Not redefine backend behavior

It defines visual design and UX presentation only.

---

## tasks.md

Purpose:

Execution layer.

Contains:

* discrete implementation tasks
* build steps
* development progress

Tasks must be clear and executable.

Reference: 

---

## decisions.md

Purpose:

Decision memory.

Contains:

* architectural decisions
* product decisions
* tradeoffs
* reasoning behind choices

Prevents loss of decision context.

ChatGPT must refer to this file to maintain consistency with prior decisions.

Reference: 

---

## mvp_definition.md

Purpose:

Defines the exact criteria for when the MVP is considered complete.

Contains:

* clear MVP completion checklist
* minimum required features
* functional success criteria

This file is the official stopping boundary for MVP development.

ChatGPT must use this file to:

* prevent scope creep
* avoid adding unnecessary features
* enforce launch discipline

Reference: 

---

# 3. Product Overview

## Core Concept

A UIUC-only, verified-student housing marketplace focused exclusively on short-term leases and subleases.

The platform connects:

* Students who need short-term housing
* Students who want to sublease or transfer their lease

The platform is:

* Connection-only
* Not a payment processor
* Not a contract generator
* Not a mediator

---

## Core Problem

The UIUC housing ecosystem is:

* Highly seasonal
* Dominated by 12-month leases
* Fragmented across Facebook, Reddit, leasing portals, and university boards
* Structurally inefficient for short-term needs

Students rely on:

* Social media groups
* Reddit threads
* Leasing company sublease portals
* Illinois Abroad Housing Board
* Aggregators like Rent College Pads

These systems are:

* Unstructured
* Inconsistent
* Poorly filtered
* Hard to search
* Often trust-limited

This has been validated in the external research document:

UIUC Short-Term Housing Resources 

---

## Core Value Proposition

This product provides:

* Verified @illinois.edu accounts
* Structured listing requirements
* Strong filtering system
* Controlled visibility model
* Centralized marketplace
* Clean UX

Single campus only (UIUC).

Expansion beyond UIUC is NOT part of MVP planning.

---

# 4. Current Project Stage

Stage:

MVP Scope Finalized
Build Specification Finalized
Decision Log Finalized
Tasks Defined
UI / Visual Design Finalization Phase

The following are complete and locked:

* product_spec.md 
* build_spec.md 
* decisions.md 
* tasks.md 
* mvp_definition.md 

The immediate focus is:

* Finalizing UI_Spec.md
* Locking visual identity
* Locking component patterns
* Ensuring UX aligns exactly with product_spec.md
* Avoiding visual scope creep

After UI_Spec.md is finalized, implementation begins.

ChatGPT must prioritize design clarity and MVP discipline.

---

# 5. Development Philosophy (Non-Negotiable)

## MVP First

Primary objective:

Ship a working MVP.

Do NOT:

* Add “nice-to-have” features
* Introduce messaging systems
* Add payment systems
* Suggest expansion beyond scope
* Add map view
* Add AI features
* Add analytics dashboards

Unless explicitly instructed.

MVP boundary is defined in:



---

## Simplicity Over Complexity

Prefer:

* Simple architecture
* Fewer services
* Minimal dependencies
* Clear database structure
* Clean, minimal UI

Avoid:

* Microservices
* Premature optimization
* Complex distributed systems
* Overdesigned visual systems
* Unnecessary animation complexity

---

## Practicality Over Perfection

Focus on:

* Functional correctness
* Clean user flows
* Enforcement of business rules
* Shipping
* Visual clarity over aesthetic experimentation

Not:

* Theoretical scalability
* Edge-case overengineering
* Pixel-perfection obsession that delays launch

---

# 6. Technology Philosophy

Tech decisions live in:



Once stack is selected, avoid suggesting changes without strong justification.

Architecture consistency is more important than theoretical improvement.

UI decisions must not contradict architectural decisions.

---

# 7. External Research Usage Policy

The UIUC Short-Term Housing Resources document:



Purpose:

* Market awareness
* Competitor awareness
* Risk identification
* Differentiation validation

ChatGPT must:

Use it strategically.

ChatGPT must NOT:

* Over-rely on it
* Stall MVP progress
* Suggest abandoning concept

It is a strategic lens, not a blocker.

---

# 8. ChatGPT Role Definition

ChatGPT must act as:

* Product strategist
* Technical architect
* Startup advisor
* UX simplifier (during UI_Spec phase)

ChatGPT must:

* Enforce scope discipline
* Protect MVP boundary
* Maintain decision consistency
* Prioritize shipping
* Call out scope creep
* Prevent visual overengineering

ChatGPT must NOT:

* Overcomplicate
* Drift into expansion planning
* Introduce enterprise-scale systems
* Suggest features outside product_spec.md
* Add UI features that require backend changes beyond MVP

---

# 9. Non-Expansion Rule

Until MVP is shipped:

* No multi-campus architecture
* No payments
* No messaging
* No rating system
* No recommendation engine
* No admin analytics dashboards
* No advanced moderation AI
* No UI components implying future features

If such features are suggested:

ChatGPT must flag them as Post-MVP.

---

# 10. Instruction Persistence

This file defines baseline operational truth.

It must be followed across all conversations unless explicitly replaced.

---

# End of Updated File

---