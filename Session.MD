# Illini2Illini – Reddit Integration (Near-Verbatim Conversation Log)
This session shows me building a Reddit ingestion pipeline for Illini2Illini, a student housing marketplace, to aggregate listings from r/uiuc_housing and reduce fragmentation in the subleasing process. I iterated on a hybrid AI + rule-based extraction system, debugged parsing failures, and designed the data model and architecture to separate verified and external listings while maintaining trust and scalability.

---

## Shashank:
okay now I want to add another feature where the posts from r/uiuc_housing are added everyday. Basically these posts will be listed with a tag saying "Reddit Extracted" and the ones posted by user on the platform will have "Verified" this is just to bring everything in one place.

What do you think?

---

## GPT:
This is actually a very strong idea.

You're essentially turning your platform into:
→ a **housing aggregator + marketplace hybrid**

Why it’s powerful:
- Solves fragmentation (Reddit, FB, etc.)
- Instantly increases supply
- Makes your platform the default place to search

But there are risks:
- Trust (Reddit is unverified)
- Noise (demand posts, spam)
- UX clutter

Key recommendation:
→ Clearly separate:
- Verified (your platform)
- Reddit Extracted (external)

---

## Shashank:
okay this is great. Create a summary with the 7 points you talked about. And then we'll discuss the rest

---

## GPT:
Summary included:
1. Aggregation advantage  
2. Trust separation  
3. Filtering needed  
4. UI clarity  
5. Avoid clutter  
6. Keep verified premium  
7. Future scalability  

---

## Shashank:
(shared asyncpraw script)

Now I already have this script ready and tested. We just need to refactor it a bit to match our requirements.

Also below's the list of things we ask user when they're posting a listing which we need to extract from each post

(listing schema...)

---

## GPT:
Key idea:
→ Use **AI + rule-based hybrid extraction**

Why:
- AI = flexible parsing (rent, dates, etc.)
- Regex = precise (beds/baths)

Also:
- Use title + description together
- Normalize output to your schema

---

## Shashank:
what if I use google collab's built-in AI and run the script manually everyday and then upload it to a script in my codebase which adds these posts to the database?

---

## GPT:
That’s actually a **great MVP move**

Pros:
- No infra complexity
- Full control
- Easy debugging

Cons:
- Manual

Verdict:
→ Perfect for v1

---

## Shashank:
okay now update my collab script accordingly

---

## GPT:
Refactored:
- Added `extract_with_ai`
- Added JSON parser
- Structured output

---

## Shashank:
(from google.colab import ai...)

I meant this, use this and refactor the script

---

## GPT:
Adjusted to use `ai.generate_text()`

---

## Shashank:
error logs:
- Unclosed client session
- AI parsing failed: Expecting value

---

## GPT:
Root cause:
→ AI returns markdown (```json)

Fix:
- Strip markdown fences
- Extract JSON safely

---

## Shashank:
this is what I got, what do you think?

---

## GPT:
Good progress, but:
→ Missing structured fields

Need:
- Better parsing
- Better prompt constraints

---

## Shashank:
for the bedroom, most of them specify it in the title itself like 1B, 2B...

(add rules)

Also:
- Use title info
- fallback description = title
- limit = 10

---

## GPT:
Refactored:
- Added regex for bed/bath
- Used title + description
- Added limit
- Improved extraction logic

---

## Shashank:
why not do this with AI?

---

## GPT:
You *can*, but:

Best system:
→ Hybrid

- Regex = deterministic
- AI = flexible

---

## Shashank:
(example JSON where everything is null)

see here everything is provided but still the values are null.

---

## GPT:
Diagnosis:
→ AI output is correct  
→ Parsing is failing → fallback used

---

## Shashank:
(still failing, logs)

---

## GPT:
Issue:
→ Your parser leaves `"json"` at the beginning

Fix:
→ Extract `{...}` using regex

---

## Shashank:
(still failing)

---

## GPT:
Updated parser:
- Remove markdown properly
- Extract JSON block only
- Log raw output

---

## Shashank:
okay this works! Few things to add:

1. 1br → bedroom
2. semester lease → SUBLEASE

---

## GPT:
Added:
- regex for `1br`
- rule for semester lease

---

## Shashank:
also fix that if its a 1bedroom apt then obv it will have 1 bathroom

---

## GPT:
Added rule:
→ if bedrooms > 0 and bathrooms missing → bathrooms = 1

---

## Shashank:
Add AI field "exclude"

true if:
- looking for sublease
- looking for housing

---

## GPT:
Updated prompt:

exclude = true → demand posts  
exclude = false → supply posts  

Also:
→ Skip those posts in pipeline

---

## Shashank:
Okay now this is great!

---

## GPT:
You’ve built:

- ingestion pipeline
- parsing system
- filtering system

Next:
→ UI

---

## Shashank:
now working on the UI, what do you think will be better, a new listing table for Reddit posts or using the same table with changes?

---

## GPT:
Strong recommendation:
→ **Separate table**

Reasons:
- Trust separation
- Avoid null-heavy schema
- Cleaner queries
- Future extensibility

Structure:
- listings → verified
- external_listings → Reddit

---

## Shashank:
also when retrieving the post, is it possible for us to retrieve the image too?

---

## GPT:
Yes, but depends on type:

1. Image post → easy  
2. Gallery → medium  
3. External links → messy  
4. Text → none  

Provided function:
→ extract_images()

Recommendation:
→ Optional, not required

---

## Shashank:
the external id here is the submission id?

---

## GPT:
Yes.

external_id = submission.id

Benefits:
- Deduplication
- Idempotent ingestion
- Future updates

Add:
UNIQUE(source, external_id)

---

## Shashank:
finally update this code so that the file name of json follows:

mm-dd-batch_size-limit

---

## GPT:
Solution:

- Use datetime
- Use len(results)
- Use original_limit

Important fix:
→ You are mutating `limit`

So:
```python
original_limit = limit