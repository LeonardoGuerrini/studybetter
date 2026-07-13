-- CreateEnum
CREATE TYPE "StudyMethod" AS ENUM ('PDF', 'QUESTIONS', 'VIDEO', 'PDF_QUESTIONS', 'REVIEW', 'MIND_MAP', 'FLASH_CARDS');

-- CreateEnum
CREATE TYPE "StudyPeriod" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING', 'DAWN');

-- AlterTable
ALTER TABLE "study_sessions" ADD COLUMN     "correctCount" INTEGER,
ADD COLUMN     "pagesStudied" INTEGER,
ADD COLUMN     "questionsCount" INTEGER,
ADD COLUMN     "studyDate" TIMESTAMP(3),
ADD COLUMN     "studyMethod" "StudyMethod",
ADD COLUMN     "studyPeriod" "StudyPeriod";
