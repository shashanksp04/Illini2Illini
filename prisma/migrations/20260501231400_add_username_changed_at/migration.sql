-- Track when username was last changed for cooldown enforcement.
ALTER TABLE "users"
ADD COLUMN "username_changed_at" TIMESTAMP(3);
