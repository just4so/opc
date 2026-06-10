-- Migration: cleanup_like_table_and_screenshots
-- Date: 2026-06-10
-- Description:
--   1. Drop deprecated Like table (data already migrated to Favorite)
--   2. Drop unused Project.screenshots field (0 records, no code references)

-- Drop Like table
DROP TABLE IF EXISTS "Like";

-- Drop screenshots column from Project
ALTER TABLE "Project" DROP COLUMN IF EXISTS "screenshots";
