-- AlterTable
ALTER TABLE "ClassSubject" ADD COLUMN     "termId" TEXT;

-- AddForeignKey
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_termId_fkey" FOREIGN KEY ("termId") REFERENCES "AcademicTerm"("id") ON DELETE SET NULL ON UPDATE CASCADE;
