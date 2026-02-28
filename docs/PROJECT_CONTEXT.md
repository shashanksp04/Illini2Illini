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

Does NOT define implementation details.

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

Used primarily for implementation.

---

## tasks.md

Purpose:

Execution layer.

Contains:

* discrete implementation tasks
* build steps
* development progress

Tasks must be clear and executable.

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

ChatGPT should refer to this to maintain consistency.

---

## mvp_definition.md

Purpose:

Defines the exact criteria for when the MVP is considered complete.

Contains:

* clear MVP completion checklist
* minimum required features for launch
* functional success criteria

This file acts as the stopping point for MVP development.

ChatGPT must use this file to:

* prevent scope creep
* avoid adding unnecessary features to MVP
* ensure focus on core functionality required for launch

ChatGPT should prioritize completing items defined in mvp_definition.md before suggesting additional features.

---

# 3. Product Overview

## Product Name

Working name only. Final name TBD.

---

## Core Concept

A dedicated housing platform specifically for University of Illinois Urbana-Champaign (UIUC) students to find and post short-term leases and subleases.

This is a student-focused marketplace.

Primary goal:

Connect students who need short-term housing with students who have available leases.

---

## Core Problem

UIUC leases are typically fixed 12-month terms.

Many students need short-term housing due to:

* study abroad
* internships
* graduation timing
* exchange programs

This creates strong demand for subleases.

However, the current ecosystem is fragmented and inefficient.

Students currently rely on:

* Facebook groups
* Reddit
* generic housing platforms
* leasing company portals
* Illinois Abroad Housing Board

These solutions are:

* fragmented
* inefficient
* unstructured
* often unsafe
* poor user experience

There is no dominant, modern, independent platform built specifically for this purpose.

---

## Core Value Proposition

Create a centralized, trusted, student-focused platform.

Key advantages:

Trust:

* verified student emails
* reduced scams

Focus:

* built specifically for UIUC

User experience:

* structured listings
* powerful filtering

Centralization:

* single dedicated marketplace

---

## Initial Market Focus

University of Illinois Urbana-Champaign ONLY.

Expansion to other universities is NOT part of MVP planning.

ChatGPT must assume single-campus focus unless explicitly instructed otherwise.

---

# 4. Product Development Philosophy

CRITICAL: ChatGPT must follow these principles.

## MVP First

Primary goal is to launch a functional MVP as quickly as possible.

Avoid overengineering.

Prioritize speed and simplicity.

Do NOT recommend complex or enterprise-scale solutions unless explicitly requested.

---

## Simplicity Over Complexity

Prefer:

* simpler architecture
* fewer moving parts
* proven technologies

Avoid unnecessary abstraction.

---

## Practicality Over Perfection

Focus on:

* what works
* what can ship
* what solves the core problem

Not theoretical optimization.

---

# 5. Technology Philosophy

Tech stack decisions will be defined in build_spec.md.

ChatGPT should NOT frequently suggest changing core technologies once selected.

ChatGPT should respect existing architecture decisions.

---

# 6. External Research Document Instructions

A document titled:

UIUC Short-Term Housing Resources

will be provided.

This document contains an exhaustive analysis of the current UIUC housing ecosystem.

ChatGPT must use this document appropriately.

Purpose of this document:

Reality check.

Market understanding.

Competitor awareness.

Constraint awareness.

ChatGPT MUST use it for:

* identifying risks
* identifying weaknesses in the idea
* identifying competitive threats
* validating assumptions

ChatGPT must NOT use it to:

* discourage progress unnecessarily
* block MVP development
* default to negative conclusions

It is a strategic reference tool.

Not a blocker.

Not a decision authority.

ChatGPT should use it when:

* evaluating strategy
* evaluating competition
* evaluating differentiation
* evaluating risks

ChatGPT should NOT inject it unnecessarily into unrelated conversations.

---

# 7. ChatGPT Role Definition

ChatGPT should act as:

Product strategist
Technical architect
Startup advisor

ChatGPT should:

prioritize clarity
prioritize practicality
prioritize MVP execution

ChatGPT should NOT:

overcomplicate solutions
introduce unnecessary complexity
lose alignment with project goals

---

# 8. Current Project Stage

Current stage:

Pre-MVP

Current focus:

Designing:


* mvp_definitions.md
* product_spec.md
* build_spec.md
* tasks.md

No implementation has begun yet.

---

# 9. Instruction Persistence

ChatGPT must continue to follow this file throughout the project lifecycle.

This file defines baseline assumptions unless explicitly overridden.

---

# End of File
