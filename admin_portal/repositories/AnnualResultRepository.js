const prisma = require("../../lib/prisma");

// Get all results for a student across all terms in a session
const getStudentAnnualResults = async (studentId, sessionId) => {
	const results = await prisma.result.findMany({
		where: { studentId, sessionId },
		include: {
			subject: {
				select: { subjectName: true, subjectCode: true },
			},
			term: {
				select: { term: true },
			},
		},
		orderBy: [
			{ subject: { subjectName: "asc" } },
			{ term: { term: "asc" } },
		],
	});

	return results;
};

// Get all results for all students in a class across all terms in a session
const getClassAnnualResults = async (classId, sessionId) => {
	const enrollments = await prisma.enrollment.findMany({
		where: { classId, academicYear: sessionId, status: "ACTIVE" },
		select: { studentId: true },
	});

	const studentIds = enrollments.map((e) => e.studentId);

	const results = await prisma.result.findMany({
		where: {
			studentId: { in: studentIds },
			sessionId,
		},
		include: {
			student: {
				select: {
					id: true,
					admissionNumber: true,
					firstName: true,
					lastName: true,
				},
			},
			subject: {
				select: { subjectName: true, subjectCode: true },
			},
			term: {
				select: { term: true },
			},
		},
		orderBy: [
			{ subject: { subjectName: "asc" } },
			{ term: { term: "asc" } },
		],
	});

	return results;
};

// Calculate class age average
const calculateClassAgeAverage = async (classId, sessionId) => {
	const enrollments = await prisma.enrollment.findMany({
		where: { classId, academicYear: sessionId, status: "ACTIVE" },
		include: {
			student: {
				select: { dateOfBirth: true },
			},
		},
	});

	if (enrollments.length === 0) {
		return { averageAge: 0, studentCount: 0 };
	}

	const today = new Date();
	let totalAge = 0;

	for (const enrollment of enrollments) {
		if (enrollment.student.dateOfBirth) {
			const birthDate = new Date(enrollment.student.dateOfBirth);
			const age = today.getFullYear() - birthDate.getFullYear();
			const monthDiff = today.getMonth() - birthDate.getMonth();
			
			if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
				totalAge += age - 1;
			} else {
				totalAge += age;
			}
		}
	}

	const averageAge = totalAge / enrollments.length;

	return {
		averageAge: parseFloat(averageAge.toFixed(1)),
		studentCount: enrollments.length,
	};
};

// Compute annual positions per subject across all terms
const computeAnnualPositions = async (classId, sessionId) => {
	const results = await getClassAnnualResults(classId, sessionId);

	// Group by subject and student
	const subjectStudentMap = new Map();

	for (const result of results) {
		const key = `${result.subjectId}_${result.studentId}`;
		
		if (!subjectStudentMap.has(key)) {
			subjectStudentMap.set(key, {
				subjectId: result.subjectId,
				subjectName: result.subject.subjectName,
				studentId: result.studentId,
				student: result.student,
				cumulativeScore: 0,
			});
		}

		const entry = subjectStudentMap.get(key);
		entry.cumulativeScore += result.total || 0;
	}

	// Group by subject for ranking
	const subjectMap = new Map();

	for (const entry of subjectStudentMap.values()) {
		if (!subjectMap.has(entry.subjectId)) {
			subjectMap.set(entry.subjectId, []);
		}
		subjectMap.get(entry.subjectId).push(entry);
	}

	// Calculate positions per subject
	const positionUpdates = [];

	for (const [subjectId, entries] of subjectMap.entries()) {
		// Sort by cumulative score descending
		entries.sort((a, b) => b.cumulativeScore - a.cumulativeScore);

		let position = 1;
		let previousScore = null;

		for (let i = 0; i < entries.length; i++) {
			const entry = entries[i];
			
			if (previousScore !== null && entry.cumulativeScore < previousScore) {
				position = i + 1;
			}

			previousScore = entry.cumulativeScore;

			positionUpdates.push({
				subjectId,
				studentId: entry.studentId,
				annualPosition: position,
				cumulativeScore: entry.cumulativeScore,
			});
		}
	}

	return positionUpdates;
};

// Get student profile with class information
const getStudentProfileWithClass = async (studentId, sessionId) => {
	const student = await prisma.student.findUnique({
		where: { id: studentId },
		select: {
			id: true,
			admissionNumber: true,
			firstName: true,
			middleName: true,
			lastName: true,
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

	if (!student) {
		throw new Error("Student not found");
	}

	// Get student's enrollment for the session
	const enrollment = await prisma.enrollment.findFirst({
		where: {
			studentId,
			academicYear: sessionId,
			status: "ACTIVE",
		},
		include: {
			class: {
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
			},
		},
	});

	// Calculate student age
	let age = null;
	if (student.dateOfBirth) {
		const birthDate = new Date(student.dateOfBirth);
		const today = new Date();
		age = today.getFullYear() - birthDate.getFullYear();
		const monthDiff = today.getMonth() - birthDate.getMonth();
		
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
			age -= 1;
		}
	}

	return {
		...student,
		age,
		className: enrollment?.class?.name || null,
		classId: enrollment?.classId || null,
		classTeacher: enrollment?.class?.classTeacher || null,
		assistantTeacher: enrollment?.class?.assistantTeacher || null,
	};
};

// Get annual remarks for a student
const getAnnualRemarks = async (studentId, sessionId) => {
	// Get all term remarks for the student in the session
	const termRemarks = await prisma.studentTermRemark.findMany({
		where: {
			studentId,
			sessionId,
		},
		include: {
			term: {
				select: { term: true },
			},
		},
	});

	// Aggregate remarks across terms
	const classTeacherRemarks = termRemarks
		.filter((r) => r.classTeacherRemark)
		.map((r) => ({
			term: r.term.term,
			remark: r.classTeacherRemark,
		}));

	const headTeacherRemarks = termRemarks
		.filter((r) => r.headTeacherRemark)
		.map((r) => ({
			term: r.term.term,
			remark: r.headTeacherRemark,
		}));

	return {
		classTeacherRemarks,
		headTeacherRemarks,
	};
};

// Get class enrollment count
const getClassEnrollmentCount = async (classId, sessionId) => {
	const count = await prisma.enrollment.count({
		where: {
			classId,
			academicYear: sessionId,
			status: "ACTIVE",
		},
	});

	return count;
};

module.exports = {
	getStudentAnnualResults,
	getClassAnnualResults,
	calculateClassAgeAverage,
	computeAnnualPositions,
	getStudentProfileWithClass,
	getAnnualRemarks,
	getClassEnrollmentCount,
};
