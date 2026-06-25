-- CreateEnum
CREATE TYPE "SignalStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterTable
ALTER TABLE "News" ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "signal_issues" (
    "id" TEXT NOT NULL,
    "issueNo" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "activityTime" TEXT,
    "status" "SignalStatus" NOT NULL DEFAULT 'DRAFT',
    "intro" TEXT,
    "participants" JSONB NOT NULL,
    "sections" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signal_issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "signal_issues_issueNo_key" ON "signal_issues"("issueNo");
