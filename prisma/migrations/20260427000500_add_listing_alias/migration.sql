-- Add optional custom alias for listing share links.
ALTER TABLE "listings"
ADD COLUMN "alias" VARCHAR(50);

-- Enforce global uniqueness for aliases when present.
CREATE UNIQUE INDEX "listings_alias_key"
ON "listings"("alias");
