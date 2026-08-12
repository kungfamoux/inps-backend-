-- Merge CLASS_TEACHER and SUBJECT_TEACHER into a single TEACHER role.
-- Per-class and per-subject authorization already lives in Section.classTeacherId/
-- assistantTeacherId and SubjectAssignment.teacherId, not in the role label, so this
-- is safe to collapse without losing any access control.

-- CreateEnum (new enum with TEACHER replacing the two split roles)
CREATE TYPE "StaffRole_new" AS ENUM ('TEACHER', 'ADMIN', 'HEAD_TEACHER', 'BURSARY', 'STOREKEEPER', 'SUPPORT');

-- Migrate Staff.role, mapping both former teaching roles onto TEACHER
ALTER TABLE "Staff" ALTER COLUMN "role" TYPE "StaffRole_new" USING (
  CASE "role"::text
    WHEN 'CLASS_TEACHER' THEN 'TEACHER'
    WHEN 'SUBJECT_TEACHER' THEN 'TEACHER'
    ELSE "role"::text
  END
)::"StaffRole_new";

-- secondaryRole only ever existed to let one teacher hold both CLASS_TEACHER and
-- SUBJECT_TEACHER at once — moot now that there is a single TEACHER role.
ALTER TABLE "Staff" DROP COLUMN "secondaryRole";

-- Swap in the new enum in place of the old one
DROP TYPE "StaffRole";
ALTER TYPE "StaffRole_new" RENAME TO "StaffRole";
