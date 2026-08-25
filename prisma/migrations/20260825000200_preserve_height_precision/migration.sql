-- AlterTable
ALTER TABLE "DailyPlan"
ALTER COLUMN "greensWalkHeight" TYPE TEXT USING "greensWalkHeight"::TEXT,
ALTER COLUMN "greensTriplexHeight" TYPE TEXT USING "greensTriplexHeight"::TEXT,
ALTER COLUMN "greensCleanupHeight" TYPE TEXT USING "greensCleanupHeight"::TEXT,
ALTER COLUMN "tcaTeesHeight" TYPE TEXT USING "tcaTeesHeight"::TEXT,
ALTER COLUMN "tcaCollarsApproachesFairwaysHeight" TYPE TEXT USING "tcaCollarsApproachesFairwaysHeight"::TEXT,
ALTER COLUMN "roughHeight" TYPE TEXT USING "roughHeight"::TEXT,
ALTER COLUMN "roughSecondaryCutHeight" TYPE TEXT USING "roughSecondaryCutHeight"::TEXT;

-- AlterTable
ALTER TABLE "HeightOfCutDefault"
ALTER COLUMN "greensWalkHeight" TYPE TEXT USING "greensWalkHeight"::TEXT,
ALTER COLUMN "greensTriplexHeight" TYPE TEXT USING "greensTriplexHeight"::TEXT,
ALTER COLUMN "greensCleanupHeight" TYPE TEXT USING "greensCleanupHeight"::TEXT,
ALTER COLUMN "tcaTeesHeight" TYPE TEXT USING "tcaTeesHeight"::TEXT,
ALTER COLUMN "tcaCollarsApproachesFairwaysHeight" TYPE TEXT USING "tcaCollarsApproachesFairwaysHeight"::TEXT,
ALTER COLUMN "roughHeight" TYPE TEXT USING "roughHeight"::TEXT,
ALTER COLUMN "roughSecondaryCutHeight" TYPE TEXT USING "roughSecondaryCutHeight"::TEXT;
