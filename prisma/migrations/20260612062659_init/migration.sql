-- CreateEnum
CREATE TYPE "StaffType" AS ENUM ('TEACHING', 'NON_TEACHING');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('CLASS_TEACHER', 'SUBJECT_TEACHER', 'ADMIN', 'HEAD_TEACHER', 'BURSARY', 'STOREKEEPER', 'SUPPORT');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'GRADUATED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SchoolLevel" AS ENUM ('DAYCARE', 'PRENURSERY', 'NURSERY_1', 'NURSERY_2', 'NURSERY_3', 'PRIMARY_1', 'PRIMARY_2', 'PRIMARY_3', 'PRIMARY_4', 'PRIMARY_5', 'PRIMARY_6');

-- CreateEnum
CREATE TYPE "ClassColor" AS ENUM ('YELLOW', 'BLUE', 'GREEN', 'RAINBOW');

-- CreateEnum
CREATE TYPE "ClassStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MERGED');

-- CreateEnum
CREATE TYPE "SectionStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Term" AS ENUM ('FIRST_TERM', 'SECOND_TERM', 'THIRD_TERM');

-- CreateEnum
CREATE TYPE "TermStatus" AS ENUM ('COMPLETED', 'CURRENT', 'UPCOMING');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('COMPLETED', 'CURRENT', 'UPCOMING');

-- CreateEnum
CREATE TYPE "Grade" AS ENUM ('A', 'C', 'P', 'F');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('SALARIES', 'UTILITIES', 'SUPPLIES', 'MAINTENANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "IncomeCategory" AS ENUM ('FEES', 'DONATIONS', 'BOOKS', 'LEVY');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "HolidayType" AS ENUM ('PUBLIC', 'SCHOOL', 'RELIGIOUS', 'EXAM');

-- CreateEnum
CREATE TYPE "SubjectAssignmentStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "BillScope" AS ENUM ('ALL_STUDENTS', 'BY_CLASS', 'BY_STUDENT');

-- CreateEnum
CREATE TYPE "IntakeType" AS ENUM ('NEW', 'CONTINUING');

-- CreateEnum
CREATE TYPE "StoreIssuancePayment" AS ENUM ('PREPAID', 'CHARGED');

-- CreateEnum
CREATE TYPE "InventoryCategory" AS ENUM ('BOOKS', 'STATIONERY', 'UNIFORM', 'OFFICE', 'LAB', 'SPORTSWEAR', 'CLEANING', 'OTHER');

-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('OK', 'LOW', 'CRITICAL', 'OUT');

-- CreateEnum
CREATE TYPE "NewsletterStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NewsletterTarget" AS ENUM ('PARENTS', 'STAFF', 'ALL');

-- CreateEnum
CREATE TYPE "NewsletterType" AS ENUM ('NEWSLETTER', 'ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('PENDING', 'VERIFIED', 'COMPLETED', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "NurseryRating" AS ENUM ('Y', 'N', 'S');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'EXCUSED', 'ABSENT');

-- CreateEnum
CREATE TYPE "AnnouncementCategory" AS ENUM ('GENERAL', 'URGENT', 'CLASS_UPDATE');

-- CreateTable
CREATE TABLE "SchoolConfiguration" (
    "id" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "term" "Term" NOT NULL,
    "maxStudentsPerClass" INTEGER NOT NULL DEFAULT 30,
    "minAverageScore" DOUBLE PRECISION NOT NULL DEFAULT 55,
    "minAttendancePercentage" DOUBLE PRECISION NOT NULL DEFAULT 75,
    "maxFailedSubjects" INTEGER NOT NULL DEFAULT 3,
    "passMark" DOUBLE PRECISION NOT NULL DEFAULT 55,
    "creditMark" DOUBLE PRECISION NOT NULL DEFAULT 70,
    "distinctionMark" DOUBLE PRECISION NOT NULL DEFAULT 90,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolCalendar" (
    "id" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "term" "Term" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isCurrentTerm" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL,

    CONSTRAINT "SchoolCalendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "type" "HolidayType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "firebaseUid" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "address" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "type" "StaffType" NOT NULL,
    "role" "StaffRole" NOT NULL,
    "secondaryRole" "StaffRole",
    "status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "biometricId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" "SchoolLevel" NOT NULL,
    "status" "ClassStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currentEnrollment" INTEGER NOT NULL DEFAULT 0,
    "color" "ClassColor",
    "roomNumber" TEXT,
    "status" "SectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "classTeacherId" TEXT,
    "assistantTeacherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSubject" (
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassSubject_pkey" PRIMARY KEY ("classId","subjectId")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT,
    "academicYear" TEXT NOT NULL,
    "term" "Term" NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'PENDING',
    "transferredAt" TIMESTAMP(3),
    "previousSectionId" TEXT,
    "transferCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parent" (
    "id" TEXT NOT NULL,
    "firebaseUid" TEXT NOT NULL,
    "accountEmail" TEXT NOT NULL,
    "accountPhone" TEXT NOT NULL,
    "fatherFirstName" TEXT,
    "fatherLastName" TEXT,
    "fatherPhone" TEXT,
    "fatherEmail" TEXT,
    "fatherOccupation" TEXT,
    "motherFirstName" TEXT,
    "motherLastName" TEXT,
    "motherPhone" TEXT,
    "motherEmail" TEXT,
    "motherOccupation" TEXT,
    "address" TEXT,
    "maritalStatus" TEXT,
    "biometricId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "admissionNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" "Gender",
    "dateOfBirth" TIMESTAMP(3),
    "nationality" TEXT,
    "state" TEXT,
    "lga" TEXT,
    "religion" TEXT,
    "healthInfo" TEXT,
    "sportHouse" TEXT,
    "address" TEXT,
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "intakeType" "IntakeType" NOT NULL DEFAULT 'NEW',
    "passportPhoto" TEXT,
    "admissionDocs" TEXT,
    "biometricId" TEXT,
    "admissionDate" TIMESTAMP(3),
    "graduationDate" TIMESTAMP(3),
    "parentId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "subjectCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectLevel" (
    "subjectId" TEXT NOT NULL,
    "level" "SchoolLevel" NOT NULL,

    CONSTRAINT "SubjectLevel_pkey" PRIMARY KEY ("subjectId","level")
);

-- CreateTable
CREATE TABLE "SubjectAssignment" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "term" "Term" NOT NULL,
    "status" "SubjectAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubjectAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicSession" (
    "id" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'UPCOMING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicTerm" (
    "id" TEXT NOT NULL,
    "term" "Term" NOT NULL,
    "status" "TermStatus" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ca1Score" DOUBLE PRECISION NOT NULL,
    "ca2Score" DOUBLE PRECISION NOT NULL,
    "examScore" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "grade" "Grade" NOT NULL,
    "position" INTEGER,
    "overallPosition" INTEGER,
    "classAverage" DOUBLE PRECISION,
    "subjectTeacherRemark" TEXT,
    "classTeacherRemark" TEXT,
    "headTeacherRemark" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehavioralTrait" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,

    CONSTRAINT "BehavioralTrait_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehavioralRating" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "traitId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "term" "Term" NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BehavioralRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NurseryAssessmentItem" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "NurseryAssessmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NurseryAssessment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "term" "Term" NOT NULL,
    "rating" "NurseryRating" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NurseryAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "academicYear" TEXT NOT NULL,
    "term" "Term" NOT NULL,
    "isCompulsory" BOOLEAN NOT NULL DEFAULT true,
    "scope" "BillScope" NOT NULL,
    "intakeType" "IntakeType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillClass" (
    "billId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,

    CONSTRAINT "BillClass_pkey" PRIMARY KEY ("billId","classId")
);

-- CreateTable
CREATE TABLE "BillStudent" (
    "billId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "BillStudent_pkey" PRIMARY KEY ("billId","studentId")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "parentId" TEXT,
    "billId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "academicYear" TEXT NOT NULL,
    "term" "Term" NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "parentId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" "IncomeCategory" NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paystackRef" TEXT,
    "transactionId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookPrice" (
    "id" TEXT NOT NULL,
    "level" "SchoolLevel" NOT NULL,
    "bookName" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncomeRecord" (
    "id" TEXT NOT NULL,
    "category" "IncomeCategory" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncomeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Newsletter" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "fileUrl" TEXT,
    "type" "NewsletterType" NOT NULL DEFAULT 'NEWSLETTER',
    "target" "NewsletterTarget" NOT NULL DEFAULT 'ALL',
    "announcementCategory" "AnnouncementCategory",
    "status" "NewsletterStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Newsletter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementRead" (
    "id" TEXT NOT NULL,
    "newsletterId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementRead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionRun" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "status" "PromotionStatus" NOT NULL DEFAULT 'PENDING',
    "staffId" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionLog" (
    "id" TEXT NOT NULL,
    "promotionRunId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fromLevel" "SchoolLevel" NOT NULL,
    "toLevel" "SchoolLevel" NOT NULL,
    "promoted" BOOLEAN NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Counter" (
    "id" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Counter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "supplies" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "InventoryCategory" NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "status" "StockStatus" NOT NULL DEFAULT 'OK',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockIn" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockOut" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "issuedTo" TEXT NOT NULL,
    "studentId" TEXT,
    "paymentStatus" "StoreIssuancePayment",
    "issuedById" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockOut_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchoolConfiguration_academicYear_term_key" ON "SchoolConfiguration"("academicYear", "term");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolCalendar_academicYear_term_key" ON "SchoolCalendar"("academicYear", "term");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_staffId_key" ON "Staff"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_firebaseUid_key" ON "Staff"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_key" ON "Staff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Class_level_key" ON "Class"("level");

-- CreateIndex
CREATE UNIQUE INDEX "Section_classTeacherId_key" ON "Section"("classTeacherId");

-- CreateIndex
CREATE UNIQUE INDEX "Section_assistantTeacherId_key" ON "Section"("assistantTeacherId");

-- CreateIndex
CREATE UNIQUE INDEX "Section_classId_name_key" ON "Section"("classId", "name");

-- CreateIndex
CREATE INDEX "Enrollment_classId_academicYear_term_idx" ON "Enrollment"("classId", "academicYear", "term");

-- CreateIndex
CREATE INDEX "Enrollment_sectionId_academicYear_term_idx" ON "Enrollment"("sectionId", "academicYear", "term");

-- CreateIndex
CREATE INDEX "Enrollment_status_idx" ON "Enrollment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_academicYear_term_key" ON "Enrollment"("studentId", "academicYear", "term");

-- CreateIndex
CREATE UNIQUE INDEX "Parent_firebaseUid_key" ON "Parent"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "Parent_accountEmail_key" ON "Parent"("accountEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Student_admissionNumber_key" ON "Student"("admissionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_subjectCode_key" ON "Subject"("subjectCode");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectAssignment_sectionId_subjectId_academicYear_term_key" ON "SubjectAssignment"("sectionId", "subjectId", "academicYear", "term");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicSession_session_key" ON "AcademicSession"("session");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicTerm_sessionId_term_key" ON "AcademicTerm"("sessionId", "term");

-- CreateIndex
CREATE INDEX "Result_studentId_termId_sessionId_idx" ON "Result"("studentId", "termId", "sessionId");

-- CreateIndex
CREATE INDEX "Result_subjectId_idx" ON "Result"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Result_studentId_subjectId_termId_sessionId_key" ON "Result"("studentId", "subjectId", "termId", "sessionId");

-- CreateIndex
CREATE INDEX "Attendance_sectionId_date_idx" ON "Attendance"("sectionId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_studentId_date_key" ON "Attendance"("studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "BehavioralTrait_name_key" ON "BehavioralTrait"("name");

-- CreateIndex
CREATE INDEX "BehavioralRating_sectionId_academicYear_term_idx" ON "BehavioralRating"("sectionId", "academicYear", "term");

-- CreateIndex
CREATE UNIQUE INDEX "BehavioralRating_studentId_traitId_academicYear_term_key" ON "BehavioralRating"("studentId", "traitId", "academicYear", "term");

-- CreateIndex
CREATE INDEX "NurseryAssessment_sectionId_academicYear_term_idx" ON "NurseryAssessment"("sectionId", "academicYear", "term");

-- CreateIndex
CREATE UNIQUE INDEX "NurseryAssessment_studentId_itemId_academicYear_term_key" ON "NurseryAssessment"("studentId", "itemId", "academicYear", "term");

-- CreateIndex
CREATE UNIQUE INDEX "Bill_name_academicYear_term_key" ON "Bill"("name", "academicYear", "term");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_studentId_academicYear_term_idx" ON "Invoice"("studentId", "academicYear", "term");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paystackRef_key" ON "Payment"("paystackRef");

-- CreateIndex
CREATE INDEX "Payment_studentId_idx" ON "Payment"("studentId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementRead_newsletterId_parentId_key" ON "AnnouncementRead"("newsletterId", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionRun_sessionId_key" ON "PromotionRun"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "StockIn_ref_key" ON "StockIn"("ref");

-- CreateIndex
CREATE INDEX "StockIn_itemId_idx" ON "StockIn"("itemId");

-- CreateIndex
CREATE INDEX "StockIn_supplierId_idx" ON "StockIn"("supplierId");

-- CreateIndex
CREATE INDEX "StockIn_date_idx" ON "StockIn"("date");

-- CreateIndex
CREATE UNIQUE INDEX "StockOut_ref_key" ON "StockOut"("ref");

-- CreateIndex
CREATE INDEX "StockOut_itemId_idx" ON "StockOut"("itemId");

-- CreateIndex
CREATE INDEX "StockOut_studentId_idx" ON "StockOut"("studentId");

-- CreateIndex
CREATE INDEX "StockOut_issuedById_idx" ON "StockOut"("issuedById");

-- CreateIndex
CREATE INDEX "StockOut_date_idx" ON "StockOut"("date");

-- AddForeignKey
ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "SchoolCalendar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_classTeacherId_fkey" FOREIGN KEY ("classTeacherId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_assistantTeacherId_fkey" FOREIGN KEY ("assistantTeacherId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectLevel" ADD CONSTRAINT "SubjectLevel_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectAssignment" ADD CONSTRAINT "SubjectAssignment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectAssignment" ADD CONSTRAINT "SubjectAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectAssignment" ADD CONSTRAINT "SubjectAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicTerm" ADD CONSTRAINT "AcademicTerm_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_termId_fkey" FOREIGN KEY ("termId") REFERENCES "AcademicTerm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehavioralRating" ADD CONSTRAINT "BehavioralRating_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehavioralRating" ADD CONSTRAINT "BehavioralRating_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehavioralRating" ADD CONSTRAINT "BehavioralRating_traitId_fkey" FOREIGN KEY ("traitId") REFERENCES "BehavioralTrait"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehavioralRating" ADD CONSTRAINT "BehavioralRating_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurseryAssessment" ADD CONSTRAINT "NurseryAssessment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurseryAssessment" ADD CONSTRAINT "NurseryAssessment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurseryAssessment" ADD CONSTRAINT "NurseryAssessment_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "NurseryAssessmentItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurseryAssessment" ADD CONSTRAINT "NurseryAssessment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillClass" ADD CONSTRAINT "BillClass_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillClass" ADD CONSTRAINT "BillClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillStudent" ADD CONSTRAINT "BillStudent_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillStudent" ADD CONSTRAINT "BillStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementRead" ADD CONSTRAINT "AnnouncementRead_newsletterId_fkey" FOREIGN KEY ("newsletterId") REFERENCES "Newsletter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementRead" ADD CONSTRAINT "AnnouncementRead_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRun" ADD CONSTRAINT "PromotionRun_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRun" ADD CONSTRAINT "PromotionRun_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionLog" ADD CONSTRAINT "PromotionLog_promotionRunId_fkey" FOREIGN KEY ("promotionRunId") REFERENCES "PromotionRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionLog" ADD CONSTRAINT "PromotionLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockIn" ADD CONSTRAINT "StockIn_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockIn" ADD CONSTRAINT "StockIn_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockOut" ADD CONSTRAINT "StockOut_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockOut" ADD CONSTRAINT "StockOut_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockOut" ADD CONSTRAINT "StockOut_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
