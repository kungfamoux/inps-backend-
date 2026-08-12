const prisma = require("../../lib/prisma");

// RESULTS

// Get all subjects assigned to a teacher (their mark book)
const findAssignedSubjects = (staffId, academicYear, term) =>
	prisma.subjectAssignment.findMany({
		where: { teacherId: staffId, academicYear, term, status: "ACTIVE" },
		include: {
			subject: { select: { subjectName: true, subjectCode: true } },
			class: { select: { name: true } },
		},
	});

// Get all students in a class with their result for a specific subject/term
const findStudentsWithResults = async (
	classId,
	subjectId,
	termId,
	sessionId,
) => {
	const students = await prisma.student.findMany({
		where: {
			deletedAt: null,
			enrollments: { some: { classId, status: "ACTIVE" } },
		},
		select: {
			id: true,
			admissionNumber: true,
			firstName: true,
			lastName: true,
			results: {
				where: { subjectId, termId, sessionId },
				select: {
					id: true,
					ca1Score: true,
					ca2Score: true,
					examScore: true,
					total: true,
					grade: true,
					position: true,
					overallPosition: true,
					classAverage: true,
					subjectTeacherRemark: true,
				},
			},
		},
		orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
	});

	return students.map(({ results, ...student }) => ({
		...student,
		result: results[0] ?? null,
	}));
};

const buildResultUpsert = (data) =>
	prisma.result.upsert({
		where: {
			studentId_subjectId_termId_sessionId: {
				studentId: data.studentId,
				subjectId: data.subjectId,
				termId: data.termId,
				sessionId: data.sessionId,
			},
		},
		update: {
			ca1Score: data.ca1Score,
			ca2Score: data.ca2Score,
			examScore: data.examScore,
			total: data.total,
			grade: data.grade,
			subjectTeacherRemark: data.subjectTeacherRemark ?? null,
		},
		create: {
			studentId: data.studentId,
			subjectId: data.subjectId,
			staffId: data.staffId,
			termId: data.termId,
			sessionId: data.sessionId,
			ca1Score: data.ca1Score,
			ca2Score: data.ca2Score,
			examScore: data.examScore,
			total: data.total,
			grade: data.grade,
			subjectTeacherRemark: data.subjectTeacherRemark ?? null,
		},
		include: {
			student: {
				select: { admissionNumber: true, firstName: true, lastName: true },
			},
			subject: { select: { subjectName: true } },
		},
	});

const upsertResult = (data) => buildResultUpsert(data);

const bulkUpsertResults = (records) =>
	prisma.$transaction(records.map((record) => buildResultUpsert(record)));

const findResultById = (resultId) =>
	prisma.result.findUnique({
		where: { id: resultId },
		include: {
			student: {
				select: { admissionNumber: true, firstName: true, lastName: true },
			},
			subject: { select: { subjectName: true } },
		},
	});

const findStudentResultSheet = (studentId, termId, sessionId) =>
	prisma.result.findMany({
		where: { studentId, termId, sessionId },
		include: {
			subject: { select: { subjectName: true, subjectCode: true } },
			staff: { select: { firstName: true, lastName: true } },
		},
		orderBy: { subject: { subjectName: "asc" } },
	});

const rankByScore = (items, scoreSelector) => {
	let position = 1;
	return items.map((item, index) => {
		const score = scoreSelector(item);
		if (index > 0 && score < scoreSelector(items[index - 1])) {
			position = index + 1;
		}
		return { ...item, newPosition: position };
	});
};

const computePositions = async (classId, subjectId, termId, sessionId) => {
	const results = await prisma.result.findMany({
		where: {
			subjectId,
			termId,
			sessionId,
			student: { enrollments: { some: { classId, status: "ACTIVE" } } },
		},
		orderBy: { total: "desc" },
		select: { id: true, total: true, position: true },
	});

	const ranked = rankByScore(results, (r) => r.total);
	const updates = ranked
		.filter((r) => r.position !== r.newPosition)
		.map((r) =>
			prisma.result.update({
				where: { id: r.id },
				data: { position: r.newPosition },
			}),
		);

	if (!updates.length) return ranked.length;
	await prisma.$transaction(updates);
	return ranked.length;
};

const computeOverallPositions = async (classId, termId, sessionId) => {
	const results = await prisma.result.findMany({
		where: {
			termId,
			sessionId,
			student: { enrollments: { some: { classId, status: "ACTIVE" } } },
		},
		select: { studentId: true, total: true, overallPosition: true },
	});

	const totalsByStudent = new Map();
	for (const result of results) {
		totalsByStudent.set(
			result.studentId,
			(totalsByStudent.get(result.studentId) || 0) + result.total,
		);
	}

	const ranked = rankByScore(
		[...totalsByStudent.entries()]
			.map(([studentId, total]) => ({ studentId, total }))
			.sort((a, b) => b.total - a.total),
		(r) => r.total,
	);

	if (!ranked.length) return 0;

	await prisma.$transaction(
		ranked.map((r) =>
			prisma.result.updateMany({
				where: { studentId: r.studentId, termId, sessionId },
				data: { overallPosition: r.newPosition },
			}),
		),
	);

	return ranked.length;
};

const computeClassAverage = async (classId, subjectId, termId, sessionId) => {
	const aggregate = await prisma.result.aggregate({
		where: {
			subjectId,
			termId,
			sessionId,
			student: { enrollments: { some: { classId, status: "ACTIVE" } } },
		},
		_avg: { total: true },
	});

	const classAverage = aggregate._avg.total ?? 0;

	await prisma.result.updateMany({
		where: {
			subjectId,
			termId,
			sessionId,
			student: { enrollments: { some: { classId, status: "ACTIVE" } } },
		},
		data: { classAverage },
	});

	return classAverage;
};

// STUDENT TERM REMARKS — one class-teacher remark and one head-teacher
// remark per student per term (not duplicated per subject).
const findTermRemark = (studentId, termId, sessionId) =>
	prisma.studentTermRemark.findUnique({
		where: { studentId_termId_sessionId: { studentId, termId, sessionId } },
	});

const upsertClassTeacherRemark = (studentId, termId, sessionId, remark) =>
	prisma.studentTermRemark.upsert({
		where: { studentId_termId_sessionId: { studentId, termId, sessionId } },
		update: { classTeacherRemark: remark },
		create: { studentId, termId, sessionId, classTeacherRemark: remark },
	});

const upsertHeadTeacherRemark = (studentId, termId, sessionId, remark) =>
	prisma.studentTermRemark.upsert({
		where: { studentId_termId_sessionId: { studentId, termId, sessionId } },
		update: { headTeacherRemark: remark },
		create: { studentId, termId, sessionId, headTeacherRemark: remark },
	});

// BEHAVIORAL RATINGS
const buildBehavioralRatingUpsert = (data) =>
	prisma.behavioralRating.upsert({
		where: {
			studentId_traitId_academicYear_term: {
				studentId: data.studentId,
				traitId: data.traitId,
				academicYear: data.academicYear,
				term: data.term,
			},
		},
		update: { score: data.score },
		create: {
			studentId: data.studentId,
			classId: data.classId,
			traitId: data.traitId,
			staffId: data.staffId,
			academicYear: data.academicYear,
			term: data.term,
			score: data.score,
		},
	});

const upsertBehavioralRating = (data) => buildBehavioralRatingUpsert(data);

const bulkUpsertBehavioralRatings = (records) =>
	prisma.$transaction(records.map((r) => buildBehavioralRatingUpsert(r)));

const findBehavioralRatings = (studentId, academicYear, term) =>
	prisma.behavioralRating.findMany({
		where: { studentId, academicYear, term },
		include: { trait: true },
		orderBy: { trait: { domain: "asc" } },
	});

const findAllTraits = () =>
	prisma.behavioralTrait.findMany({ orderBy: { domain: "asc" } });

// NURSERY ASSESSMENTS
const buildNurseryAssessmentUpsert = (data) =>
	prisma.nurseryAssessment.upsert({
		where: {
			studentId_itemId_academicYear_term: {
				studentId: data.studentId,
				itemId: data.itemId,
				academicYear: data.academicYear,
				term: data.term,
			},
		},
		update: { rating: data.rating },
		create: {
			studentId: data.studentId,
			classId: data.classId,
			itemId: data.itemId,
			staffId: data.staffId,
			academicYear: data.academicYear,
			term: data.term,
			rating: data.rating,
		},
	});

const upsertNurseryAssessment = (data) => buildNurseryAssessmentUpsert(data);

const bulkUpsertNurseryAssessments = (records) =>
	prisma.$transaction(records.map((r) => buildNurseryAssessmentUpsert(r)));

const findNurseryAssessments = (studentId, academicYear, term) =>
	prisma.nurseryAssessment.findMany({
		where: { studentId, academicYear, term },
		include: { item: true },
		orderBy: { item: { sortOrder: "asc" } },
	});

const findAllNurseryAssessmentItems = () =>
	prisma.nurseryAssessmentItem.findMany({ orderBy: { sortOrder: "asc" } });

// RESULT VERIFICATION
const findAllResults = async ({ termId, sessionId, page = 1, limit = 20 }) => {
	const skip = (page - 1) * limit;
	const take = parseInt(limit, 10);
	const pageNum = parseInt(page, 10);
	
	const [results, total] = await Promise.all([
		prisma.result.findMany({
			where: {
				...(termId && { termId }),
				...(sessionId && { sessionId }),
				isVerified: false,
			},
			include: {
				student: {
					select: { 
						id: true,
						admissionNumber: true, 
						firstName: true, 
						lastName: true 
					},
				},
				subject: {
					select: { 
						id: true,
						subjectName: true, 
						subjectCode: true 
					},
				},
			},
			orderBy: { createdAt: "desc" },
			skip,
			take,
		}),
		prisma.result.count({
			where: {
				...(termId && { termId }),
				...(sessionId && { sessionId }),
				isVerified: false,
			},
		}),
	]);
	
	return {
		data: results,
		meta: {
			total,
			page: pageNum,
			limit: take,
			totalPages: Math.ceil(total / take),
		},
	};
};

const verifyResult = (resultId, staffId) =>
	prisma.result.update({
		where: { id: resultId },
		data: {
			isVerified: true,
			verifiedById: staffId,
			verifiedAt: new Date(),
		},
	});

const verifyAllResultsForStudent = (studentId, termId, sessionId, staffId) =>
	prisma.result.updateMany({
		where: { studentId, termId, sessionId, isVerified: false },
		data: {
			isVerified: true,
			verifiedById: staffId,
			verifiedAt: new Date(),
		},
	});

const verifyAllResultsForClass = async (classId, termId, sessionId, staffId) => {
	const enrollments = await prisma.enrollment.findMany({
		where: { classId, status: "ACTIVE" },
		select: { studentId: true },
	});

	const studentIds = enrollments.map((e) => e.studentId);

	const result = await prisma.result.updateMany({
		where: {
			studentId: { in: studentIds },
			termId,
			sessionId,
			isVerified: false,
		},
		data: {
			isVerified: true,
			verifiedById: staffId,
			verifiedAt: new Date(),
		},
	});

	return result;
};

module.exports = {
	// Results
	findAssignedSubjects,
	findStudentsWithResults,
	buildResultUpsert,
	upsertResult,
	bulkUpsertResults,
	findResultById,
	findStudentResultSheet,
	computePositions,
	computeOverallPositions,
	computeClassAverage,

	// Student Term Remarks
	findTermRemark,
	upsertClassTeacherRemark,
	upsertHeadTeacherRemark,

	// Behavioral Ratings
	buildBehavioralRatingUpsert,
	upsertBehavioralRating,
	bulkUpsertBehavioralRatings,
	findBehavioralRatings,
	findAllTraits,

	// Nursery Assessments
	buildNurseryAssessmentUpsert,
	upsertNurseryAssessment,
	bulkUpsertNurseryAssessments,
	findNurseryAssessments,
	findAllNurseryAssessmentItems,

	// Result Verification
	findAllResults,
	verifyResult,
	verifyAllResultsForStudent,
	verifyAllResultsForClass,
};
