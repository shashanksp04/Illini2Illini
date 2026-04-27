import asyncio
import asyncpraw
import nest_asyncio
import json
import re
from datetime import datetime, UTC
from google.colab import ai

nest_asyncio.apply()

# ------------------------
# JSON Parsing (FIXED)
# ------------------------

def safe_parse_json(response_text):
    if not response_text:
        return None

    response_text = str(response_text)

    # 🔥 Remove markdown fences like ```json
    response_text = re.sub(r"```.*?\n", "", response_text)
    response_text = response_text.replace("```", "")

    # 🔥 Extract JSON block only
    match = re.search(r"\{[\s\S]*\}", response_text)

    if not match:
        print("❌ No JSON found in:", response_text)
        return None

    json_str = match.group(0)

    try:
        return json.loads(json_str)
    except Exception as e:
        print("❌ JSON parsing failed:", json_str)
        print("Error:", e)
        return None


# ------------------------
# REGEX EXTRACTION (HIGH CONFIDENCE)
# ------------------------

def extract_bed_bath(text):
    text = text.lower()

    # Studio → 1B/1B
    if "studio" in text:
        return 1, 1

    # 🔥 NEW: Handle 1br, 2br, etc.
    match = re.search(r'(\d)\s*br', text)
    if match:
        bedrooms = int(match.group(1))
        return bedrooms, None  # bathroom unknown

    # 2B/2B, 2B-2B
    match = re.search(r'(\d)\s*(b|bed)[^\d]{0,3}(\d)\s*(b|bath)', text)
    if match:
        return int(match.group(1)), int(match.group(3))

    # 2B2B
    match = re.search(r'(\d)b\s*(\d)b', text)
    if match:
        return int(match.group(1)), int(match.group(2))

    # 2 bed 1 bath
    match = re.search(r'(\d)\s*(bed|bedroom)[^\d]{0,5}(\d)\s*(bath|bathroom)', text)
    if match:
        return int(match.group(1)), int(match.group(3))

    return None, None

def extract_lease_type(text):
    text = text.lower()

    if "sublease" in text:
        return "SUBLEASE"

    if "lease takeover" in text:
        return "LEASE_TAKEOVER"

    # 🔥 NEW RULE
    if "semester lease" in text:
        return "SUBLEASE"

    return None
# ------------------------
# Image EXTRACTION
# ------------------------
def extract_images(submission):
    images = []

    # Case 1: Gallery
    if getattr(submission, "is_gallery", False):
        media_metadata = submission.media_metadata or {}

        for item in media_metadata.values():
            if item.get("e") == "Image":
                url = item["s"]["u"]
                images.append(url.replace("&amp;", "&"))

    # Case 2: Preview image
    elif hasattr(submission, "preview"):
        try:
            images.append(
                submission.preview["images"][0]["source"]["url"].replace("&amp;", "&")
            )
        except:
            pass

    # Case 3: Direct image link
    elif submission.url.endswith((".jpg", ".jpeg", ".png", ".webp")):
        images.append(submission.url)

    return images

# ------------------------
# AI EXTRACTION
# ------------------------

def extract_with_ai(text):
    prompt = f"""
    Extract structured housing info from this UIUC housing post.

    Return ONLY valid JSON. No explanation.

    Add a field:
    "exclude": true or false

    Rules:
    - TRUE → if user is LOOKING for housing (e.g. "looking for sublease", "need apartment", "searching for housing")
    - FALSE → if user is OFFERING housing (e.g. "subleasing", "lease takeover", "room available")

    Format:

    {{
      "monthly_rent": number or null,
      "lease_type": "SUBLEASE" or "LEASE_TAKEOVER" or null,
      "start_date": "YYYY-MM-DD" or null,
      "end_date": "YYYY-MM-DD" or null,
      "room_type": "PRIVATE_ROOM" or "ENTIRE_UNIT" or null,
      "furnished": true or false or null,
      "utilities_included": true or false or null,
      "open_to_negotiation": true or false or null,
      "gender_preference": "MALE" or "FEMALE" or "ANY" or null,
      "nearby_landmark": string or null,
      "exclude": true or false
    }}

    Text:
    {text}
    """

    try:
        response = ai.generate_text(prompt)

        # ✅ Extract text safely
        if hasattr(response, "text"):
            response_text = response.text
        else:
            response_text = str(response)

        print("RAW AI TEXT:", response_text)

        parsed = safe_parse_json(response_text)

        if parsed is None:
            raise ValueError("Invalid AI JSON")

        return parsed

    except Exception as e:
        print("AI parsing failed:", e)

        return {
            "monthly_rent": None,
            "lease_type": None,
            "start_date": None,
            "end_date": None,
            "room_type": None,
            "furnished": None,
            "utilities_included": None,
            "open_to_negotiation": None,
            "gender_preference": None,
            "nearby_landmark": None,
            "exclude": False
        }


# ------------------------
# MAIN SCRIPT
# ------------------------

async def main():
    reddit = asyncpraw.Reddit(client_id='iYzqD0qtopP7OiouLNrtdg',
                               client_secret='Dkrf9zRvsD2hlLCyS01YOITgN5LpBg',
                               user_agent='CMSC396H_DATA by Past_Stress9658',
                               requestor_kwargs={'timeout': 60})

    try:
        subreddit = await reddit.subreddit('uiuc_housing')
        results = []
        allowed = 60
        limit = allowed

        # 🔥 LIMIT = 10 (testing)
        async for submission in subreddit.new():
            await submission.load()

            if limit < 0:
              break

            images = extract_images(submission)
            title = submission.title or ""
            description = submission.selftext or title  # fallback

            full_text = f"{title}\n{description}"

            print("Processing:", title)

            # ------------------------
            # REGEX FIRST
            # ------------------------
            bedrooms, bathrooms = extract_bed_bath(full_text)

            if bedrooms == 0:
                bedrooms = None

            if bedrooms is not None and bedrooms > 0 and bathrooms is None:
                bathrooms = 1

            # ------------------------
            # AI SECOND
            # ------------------------
            ai_data = extract_with_ai(full_text)

            # 🔥 Skip unwanted posts
            if ai_data.get("exclude") is True:
                print("🚫 Skipping (demand-side post):", title)
                continue

            lease_type = extract_lease_type(full_text) or ai_data.get("lease_type")

            limit -= 1
            # ------------------------
            # FINAL OBJECT
            # ------------------------
            listing = {
                "external_id": submission.id,
                "source": "REDDIT",

                "title": title[:100],
                "description": description[:1000],

                "monthly_rent": ai_data.get("monthly_rent"),
                "lease_type": lease_type,
                "start_date": ai_data.get("start_date"),
                "end_date": ai_data.get("end_date"),
                "room_type": ai_data.get("room_type"),
                "furnished": ai_data.get("furnished"),
                "utilities_included": ai_data.get("utilities_included"),
                "open_to_negotiation": ai_data.get("open_to_negotiation"),
                "gender_preference": ai_data.get("gender_preference"),
                "nearby_landmark": ai_data.get("nearby_landmark"),

                "total_bedrooms": bedrooms,
                "total_bathrooms": bathrooms,

                "exact_address": None,

                "external_url": f"https://reddit.com{submission.permalink}",
                "created_at": datetime.fromtimestamp(
                    submission.created_utc, UTC
                ).isoformat(),

                "raw_text": full_text,
                "exclude": ai_data.get("exclude"),
                "images": images,
            }

            results.append(listing)

        # ------------------------
        # SAVE OUTPUT
        # ------------------------
        today = datetime.now(UTC)

        month = f"{today.month:02d}"
        day = f"{today.day:02d}"

        batch_size = len(results)

        file_name = f"{month}-{day}-batch_size-{batch_size}.json"

        with open(file_name, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)

        print("✅ Saved", len(results), "listings")

    finally:
        await reddit.close()


# Run
await main()