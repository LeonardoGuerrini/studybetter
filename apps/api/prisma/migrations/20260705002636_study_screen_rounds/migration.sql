-- CreateEnum
CREATE TYPE "CycleRoundKind" AS ENUM ('CYCLE_RESET', 'SUBJECT_SAVE');

-- AlterTable
ALTER TABLE "cycle_items" ADD COLUMN     "roundStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "study_sessions" ADD COLUMN     "cycleId" TEXT;

-- CreateTable
CREATE TABLE "cycle_round_archives" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "subjectId" TEXT,
    "subjectName" TEXT NOT NULL,
    "studiedSeconds" INTEGER NOT NULL,
    "kind" "CycleRoundKind" NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cycle_round_archives_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cycle_round_archives_cycleId_idx" ON "cycle_round_archives"("cycleId");

-- CreateIndex
CREATE INDEX "study_sessions_cycleId_status_idx" ON "study_sessions"("cycleId", "status");

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "study_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_round_archives" ADD CONSTRAINT "cycle_round_archives_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "study_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
