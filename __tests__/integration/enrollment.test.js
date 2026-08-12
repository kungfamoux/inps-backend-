// Regression test for a real bug found and fixed in this session:
// enrollStudentWithCount used to relabel EVERY error (including an invalid
// sectionId) as "Student already enrolled for this term". The fix itself
// then had its own bug — it checked err.meta.target, which doesn't exist
// in this Prisma version's driver-adapter error shape — so it silently
// failed to recognize the real duplicate case. Both are covered here.
require("dotenv").config({ override: true, quiet: true });
const prisma = require("../../lib/prisma");
const EnrollmentRepository = require("../../admin_portal/repositories/EnrollmentRepository");

let testStudentId;
let testClassId;

beforeAll(async () => {
	const cls = await prisma.class.findFirst({ where: { status: "ACTIVE" } });
	if (!cls) {
		throw new Error("No active class found in the DB to run this test against");
	}
	testClassId = cls.id;

	const student = await prisma.student.create({
		data: {
			admissionNumber: `TEST-ENROLL-${Date.now()}`,
			firstName: "Test",
			lastName: "Enrollment",
			status: "ACTIVE",
		},
	});
	testStudentId = student.id;
});

afterAll(async () => {
	await prisma.enrollment.deleteMany({ where: { studentId: testStudentId } });
	await prisma.student.delete({ where: { id: testStudentId } });
	await prisma.$disconnect();
});

describe("enrollStudentWithCount", () => {
	test("enrolling a brand-new student/year/term succeeds", async () => {
		const enrollment = await EnrollmentRepository.enrollStudentWithCount({
			studentId: testStudentId,
			classId: testClassId,
			sectionId: null,
			academicYear: "2099/2100",
			term: "FIRST_TERM",
			status: "ACTIVE",
		});
		expect(enrollment.studentId).toBe(testStudentId);
	});

	test("re-enrolling the same student/year/term is rejected as a real duplicate", async () => {
		await expect(
			EnrollmentRepository.enrollStudentWithCount({
				studentId: testStudentId,
				classId: testClassId,
				sectionId: null,
				academicYear: "2099/2100",
				term: "FIRST_TERM",
				status: "ACTIVE",
			}),
		).rejects.toThrow("Student already enrolled for this term");
	});

	test("an invalid sectionId is NOT mislabeled as a duplicate enrollment", async () => {
		await expect(
			EnrollmentRepository.enrollStudentWithCount({
				studentId: testStudentId,
				classId: testClassId,
				sectionId: "totally-bogus-section-id",
				academicYear: "2099/2101",
				term: "FIRST_TERM",
				status: "ACTIVE",
			}),
		).rejects.not.toThrow("Student already enrolled for this term");
	});

	test("a nonexistent studentId is reported as such, not as a duplicate", async () => {
		await expect(
			EnrollmentRepository.enrollStudentWithCount({
				studentId: "nonexistent-student-id-xyz",
				classId: testClassId,
				sectionId: null,
				academicYear: "2099/2102",
				term: "FIRST_TERM",
				status: "ACTIVE",
			}),
		).rejects.toThrow("Student not found");
	});
});
