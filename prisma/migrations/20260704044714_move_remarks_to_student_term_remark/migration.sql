/*
  Warnings:

  - You are about to drop the column `classTeacherRemark` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `headTeacherRemark` on the `Result` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Result" DROP COLUMN "classTeacherRemark",
DROP COLUMN "headTeacherRemark";

-- CreateTable
CREATE TABLE "StudentTermRemark" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "classTeacherRemark" TEXT,
    "headTeacherRemark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentTermRemark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentTermRemark_studentId_termId_sessionId_key" ON "StudentTermRemark"("studentId", "termId", "sessionId");

-- AddForeignKey
ALTER TABLE "StudentTermRemark" ADD CONSTRAINT "StudentTermRemark_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentTermRemark" ADD CONSTRAINT "StudentTermRemark_termId_fkey" FOREIGN KEY ("termId") REFERENCES "AcademicTerm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentTermRemark" ADD CONSTRAINT "StudentTermRemark_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
