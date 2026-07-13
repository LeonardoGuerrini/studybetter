/*
  Warnings:

  - You are about to drop the column `isActive` on the `subjects` table. All the data in the column will be lost.
  - You are about to drop the column `knowledgeLevel` on the `subjects` table. All the data in the column will be lost.
  - You are about to drop the column `priorityScore` on the `subjects` table. All the data in the column will be lost.
  - You are about to drop the column `weeklyGoalMinutes` on the `subjects` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `subjects` table. All the data in the column will be lost.
  - Added the required column `knowledgeLevel` to the `cycle_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priorityScore` to the `cycle_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weight` to the `cycle_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "subjects_userId_isActive_idx";

-- AlterTable
ALTER TABLE "cycle_items" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "knowledgeLevel" INTEGER NOT NULL,
ADD COLUMN     "priorityScore" INTEGER NOT NULL,
ADD COLUMN     "weight" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "subjects" DROP COLUMN "isActive",
DROP COLUMN "knowledgeLevel",
DROP COLUMN "priorityScore",
DROP COLUMN "weeklyGoalMinutes",
DROP COLUMN "weight";
