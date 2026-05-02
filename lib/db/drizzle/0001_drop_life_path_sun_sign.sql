-- Task #63 — drop the unused life-path and sun-sign columns from
-- daily_content. Both have been written as NULL since Task #60 removed
-- every code path that produced meaningful values, so deleting them
-- here is non-destructive in practice. The post-merge setup script
-- runs `drizzle-kit push`, which detects the schema diff in
-- lib/db/src/schema/dailyContent.ts and emits the equivalent
-- ALTER TABLE statements; this file is kept as the historical record
-- of the change.

ALTER TABLE "daily_content" DROP COLUMN IF EXISTS "life_path_number";
ALTER TABLE "daily_content" DROP COLUMN IF EXISTS "sun_sign";
