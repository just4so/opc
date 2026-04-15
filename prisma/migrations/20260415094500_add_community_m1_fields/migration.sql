-- AlterTable
ALTER TABLE "Community" ADD COLUMN     "benefits" JSONB,
ADD COLUMN     "contactNote" TEXT,
ADD COLUMN     "entryInfo" JSONB,
ADD COLUMN     "focusTracks" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "totalArea" TEXT,
ADD COLUMN     "totalWorkstations" INTEGER,
ADD COLUMN     "transit" TEXT;
