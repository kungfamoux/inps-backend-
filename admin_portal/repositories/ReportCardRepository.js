const prisma = require("../../lib/prisma");

// Fetch student profile information
const findStudentProfile = (studentId) =>
	prisma.student.findUnique({
		where: { id: studentId },
		select: {
			id: true,
			admissionNumber: true,
			firstName: true,
			lastName: true,
			middleName: true,
			gender: true,
			dateOfBirth: true,
			address: true,
			parentId: true,
			parent: {
				select: {
					id: true,
					accountEmail: true,
					accountPhone: true,
					primaryGuardian: true,
				},
			},
		},
	});

// Fetch class information
const findClassInfo = (classId) =>
	prisma.class.findUnique({
		where: { id: classId },
		select: {
			id: true,
			name: true,
			classTeacher: {
				select: {
					firstName: true,
					lastName: true,
				},
			},
			assistantTeacher: {
				select: {
					firstName: true,
					lastName: true,
				},
			},
		},
	});

// Fetch student's class enrollment
const findStudentEnrollment = (studentId, academicYear, term) =>
	prisma.enrollment.findUnique({
		where: {
			studentId_academicYear_term: {
				studentId,
				academicYear,
				term,
			},
		},
		select: {
			classId: true,
			class: {
				select: {
					name: true,
					classTeacher: {
						select: {
							firstName: true,
							lastName: true,
						},
					},
				},
			},
		},
	});

// Fetch all results for a student in a term/session
const findStudentResults = (studentId, termId, sessionId) =>
	prisma.result.findMany({
		where: { studentId, termId, sessionId, isVerified: true },
		include: {
			subject: {
				select: {
					subjectName: true,
					subjectCode: true,
				},
			},
			staff: {
				select: {
					firstName: true,
					lastName: true,
				},
			},
		},
		orderBy: { subject: { subjectName: "asc" } },
	});

// Fetch term remarks (class teacher and head teacher remarks)
const findTermRemarks = (studentId, termId, sessionId) =>
	prisma.studentTermRemark.findUnique({
		where: {
			studentId_termId_sessionId: {
				studentId,
				termId,
				sessionId,
			},
		},
		select: {
			classTeacherRemark: true,
			headTeacherRemark: true,
		},
	});

// Fetch school configuration for grading
const findSchoolConfig = () =>
	prisma.schoolConfig.findUnique({
		where: { id: "singleton" },
		select: {
			academicYear: true,
			currentTerm: true,
			currentSession: {
				select: {
					session: true,
				},
			},
		},
	});

// Fetch academic session and term details
const findSessionAndTerm = (sessionId, termId) =>
	prisma.$transaction([
		prisma.academicSession.findUnique({
			where: { id: sessionId },
			select: { session: true },
		}),
		prisma.academicTerm.findUnique({
			where: { id: termId },
			select: { term: true, startDate: true, endDate: true },
		}),
	]);

// Fetch class enrollment count for position context
const findClassEnrollmentCount = (classId, academicYear, term) =>
	prisma.enrollment.count({
		where: {
			classId,
			academicYear,
			term,
			status: "ACTIVE",
		},
	});

// Fetch all students in a class for batch generation
const findClassStudents = (classId, academicYear, term) =>
	prisma.enrollment.findMany({
		where: {
			classId,
			academicYear,
			term,
			status: "ACTIVE",
		},
		select: {
			studentId: true,
			student: {
				select: {
					id: true,
					admissionNumber: true,
					firstName: true,
					lastName: true,
				},
			},
		},
		orderBy: {
			student: { lastName: "asc", firstName: "asc" },
		},
	});

// Get complete report card data for a single student
const getReportCardData = async (studentId, termId, sessionId) => {
	const [student, sessionAndTerm, results, termRemarks, schoolConfig] =
		await Promise.all([
			findStudentProfile(studentId),
			findSessionAndTerm(sessionId, termId),
			findStudentResults(studentId, termId, sessionId),
			findTermRemarks(studentId, termId, sessionId),
			findSchoolConfig(),
		]);

	if (!student) {
		throw new Error("Student not found");
	}

	const [session, term] = sessionAndTerm;
	const academicYear = schoolConfig?.academicYear || session?.session;

	// Get student's class enrollment
	const enrollment = await findStudentEnrollment(
		studentId,
		academicYear,
		term?.term,
	);

	// Get class enrollment count for position context
	let classEnrollmentCount = 0;
	if (enrollment) {
		classEnrollmentCount = await findClassEnrollmentCount(
			enrollment.classId,
			academicYear,
			term?.term,
		);
	}

	// Calculate summary statistics
	const totalSubjects = results.length;
	const totalScore = results.reduce((sum, r) => sum + (r.total || 0), 0);
	const averageScore = totalSubjects > 0 ? totalScore / totalSubjects : 0;
	const passedSubjects = results.filter((r) => r.grade !== "F").length;

	return {
		student: {
			...student,
			className: enrollment?.class?.name || null,
			classTeacher: enrollment?.class?.classTeacher || null,
		},
		session: session?.session || "",
		term: term?.term || "",
		termStartDate: term?.startDate || null,
		termEndDate: term?.endDate || null,
		results,
		termRemarks: termRemarks || { classTeacherRemark: null, headTeacherRemark: null },
		summary: {
			totalSubjects,
			totalScore,
			averageScore,
			passedSubjects,
			classEnrollmentCount,
		},
	};
};

module.exports = {
	findStudentProfile,
	findClassInfo,
	findStudentEnrollment,
	findStudentResults,
	findTermRemarks,
	findSchoolConfig,
	findSessionAndTerm,
	findClassEnrollmentCount,
	findClassStudents,
	getReportCardData,
};
