/*
  Warnings:

  - The primary key for the `ClassSubject` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Made the column `termId` on table `ClassSubject` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ClassSubject" DROP CONSTRAINT "ClassSubject_termId_fkey";

-- AlterTable
ALTER TABLE "ClassSubject" DROP CONSTRAINT "ClassSubject_pkey",
ALTER COLUMN "termId" SET NOT NULL,
ADD CONSTRAINT "ClassSubject_pkey" PRIMARY KEY ("classId", "subjectId", "termId");

-- AddForeignKey
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_termId_fkey" FOREIGN KEY ("termId") REFERENCES "AcademicTerm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
