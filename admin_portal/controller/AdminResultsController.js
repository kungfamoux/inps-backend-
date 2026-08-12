const AdminSubjectsService = require("../services/AdminSubjects.service");
const TeacherResultRepository = require("../../shared/repositories/TeacherResultRepository");

const getUnverifiedResults = async (req, res, next) => {
	try {
		const { termId, sessionId, page, limit } = req.query;
		const result = await AdminSubjectsService.getUnverifiedResults({
			termId,
			sessionId,
			page,
			limit,
		});
		return res.status(200).json({ success: true, ...result });
	} catch (error) {
		return next(error);
	}
};

const verifyResult = async (req, res, next) => {
	try {
		const data = await AdminSubjectsService.verifyResult(
			req.params.resultId,
			req.staff.id,
		);
		return res.status(200).json({
			success: true,
			message: "Result verified successfully",
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const verifyAllResultsForStudent = async (req, res, next) => {
	try {
		const { studentId } = req.params;
		const { termId, sessionId } = req.body;
		if (!termId || !sessionId) {
			return res.status(400).json({
				success: false,
				message: "termId and sessionId are required",
			});
		}
		const data = await AdminSubjectsService.verifyAllResultsForStudent(
			studentId,
			termId,
			sessionId,
			req.staff.id,
		);
		return res.status(200).json({
			success: true,
			message: `${data.verified} result(s) verified for student`,
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const verifyAllResultsForClass = async (req, res, next) => {
	try {
		const { classId } = req.params;
		const { termId, sessionId } = req.body;
		if (!termId || !sessionId) {
			return res.status(400).json({
				success: false,
				message: "termId and sessionId are required",
			});
		}
		const data = await AdminSubjectsService.verifyAllResultsForClass(
			classId,
			termId,
			sessionId,
			req.staff.id,
		);
		return res.status(200).json({
			success: true,
			message: `${data.verified} result(s) verified for class`,
			data,
		});
	} catch (error) {
		return next(error);
	}
};

const bulkEntryScores = async (req, res, next) => {
	try {
		const { classId, subjectId, termId, sessionId, staffId } = req.body;
		const { scores } = req.body;

		if (!classId || !subjectId || !termId || !sessionId) {
			return res.status(400).json({
				success: false,
				message: "classId, subjectId, termId, and sessionId are required",
			});
		}

		if (!scores || !Array.isArray(scores) || scores.length === 0) {
			return res.status(400).json({
				success: false,
				message: "scores array is required",
			});
		}

		// Validate each score entry
		for (const score of scores) {
			if (!score.studentId) {
				return res.status(400).json({
					success: false,
					message: "Each score must have studentId",
				});
			}
			if (score.ca1Score !== undefined && (score.ca1Score < 0 || score.ca1Score > 30)) {
				return res.status(400).json({
					success: false,
					message: "CA1 score must be between 0 and 30",
				});
			}
			if (score.ca2Score !== undefined && (score.ca2Score < 0 || score.ca2Score > 30)) {
				return res.status(400).json({
					success: false,
					message: "CA2 score must be between 0 and 30",
				});
			}
			if (score.examScore !== undefined && (score.examScore < 0 || score.examScore > 40)) {
				return res.status(400).json({
					success: false,
					message: "Exam score must be between 0 and 40",
				});
			}
		}

		// Calculate totals and grades
		const enrichedScores = scores.map(score => {
			const ca1 = score.ca1Score || 0;
			const ca2 = score.ca2Score || 0;
			const exam = score.examScore || 0;
			const total = ca1 + ca2 + exam;
			const grade = AdminSubjectsService.computeGrade(total);

			return {
				...score,
				ca1Score: ca1,
				ca2Score: ca2,
				examScore: exam,
				total,
				grade,
				staffId: staffId || req.staff.id,
				termId,
				sessionId,
				subjectId,
			};
		});

		const result = await TeacherResultRepository.bulkUpsertResults(enrichedScores);

		// Compute positions for the class
		await TeacherResultRepository.computePositions(classId, subjectId, termId, sessionId);
		await TeacherResultRepository.computeOverallPositions(classId, termId, sessionId);

		return res.status(200).json({
			success: true,
			message: `Successfully entered ${enrichedScores.length} scores`,
			data: { entered: enrichedScores.length },
		});
	} catch (error) {
		return next(error);
	}
};

const getEntryStatus = async (req, res, next) => {
	try {
		const { classId, subjectId, termId, sessionId } = req.query;

		// This would query the database to get entry status
		// For now, return a basic response
		const status = {
			totalStudents: 0,
			completedEntries: 0,
			pendingEntries: 0,
			entryStatus: 'not_started',
		};

		return res.status(200).json({
			success: true,
			data: status,
		});
	} catch (error) {
		return next(error);
	}
};

const getResultsStatistics = async (req, res, next) => {
	try {
		const { termId, sessionId } = req.query;

		const prisma = require("../../lib/prisma");

		// Get total students
		const totalStudents = await prisma.student.count();

		// Get total results entered
		const totalResults = await prisma.result.count({
			where: {
				termId: termId || undefined,
				sessionId: sessionId || undefined,
			},
		});

		// Get unverified results
		const pendingVerification = await prisma.result.count({
			where: {
				isVerified: false,
				termId: termId || undefined,
				sessionId: sessionId || undefined,
			},
		});

		// Calculate completion percentage
		const completionPercentage = totalStudents > 0 
			? Math.round((totalResults / (totalStudents * 8)) * 100) // Assuming ~8 subjects per student
			: 0;

		return res.status(200).json({
			success: true,
			data: {
				totalStudents,
				totalScores: totalResults,
				pendingVerification,
				completionPercentage,
			},
		});
	} catch (error) {
		return next(error);
	}
};

const getEntryStatusByClass = async (req, res, next) => {
	try {
		const { termId, sessionId } = req.query;

		const prisma = require("../../lib/prisma");

		// Get all classes
		const classes = await prisma.class.findMany();

		// Calculate entry status for each class
		const classStatus = await Promise.all(
			classes.map(async (cls) => {
				try {
					// Get total students in this class
					const totalStudents = await prisma.enrollment.count({
						where: {
							classId: cls.id,
							status: "ACTIVE",
							...(termId && { term: termId }),
							...(sessionId && { academicYear: sessionId }),
						},
					});

					// Get students in this class for this term/session
					const enrolledStudents = await prisma.enrollment.findMany({
						where: {
							classId: cls.id,
							status: "ACTIVE",
							...(termId && { term: termId }),
							...(sessionId && { academicYear: sessionId }),
						},
						select: { studentId: true },
					});

					const studentIds = enrolledStudents.map(e => e.studentId);

					// Get subject count for this class and term
					const subjectCount = await prisma.classSubject.count({
						where: {
							classId: cls.id,
							...(termId && { termId: termId }),
						},
					});

					// Get result count for this class/term/session (only for students in this class)
					const totalResults = await prisma.result.count({
						where: {
							studentId: { in: studentIds },
							termId: termId || undefined,
							sessionId: sessionId || undefined,
						},
					});

					// Calculate completion percentage based on actual subject count
					const expectedTotal = totalStudents * subjectCount;
					const completionPercentage = expectedTotal > 0
						? Math.round((totalResults / expectedTotal) * 100)
						: 0;

					return {
						classId: cls.id,
						className: cls.name,
						totalStudents,
						subjectCount,
						totalResults,
						completionPercentage: Math.min(completionPercentage, 100),
						entryStatus: completionPercentage === 100 ? 'complete' : completionPercentage > 0 ? 'in_progress' : 'not_started',
					};
				} catch (err) {
					// If error for this class, return default status
					return {
						classId: cls.id,
						className: cls.name,
						totalStudents: 0,
						subjectCount: 0,
						totalResults: 0,
						completionPercentage: 0,
						entryStatus: 'not_started',
					};
				}
			})
		);

		return res.status(200).json({
			success: true,
			data: classStatus,
		});
	} catch (error) {
		console.error('Error in getEntryStatusByClass:', error);
		return next(error);
	}
};

const getRecentActivity = async (req, res, next) => {
	try {
		const { termId, sessionId, limit = 10 } = req.query;

		const prisma = require("../../lib/prisma");

		// Get recent results with their creation dates
		const recentResults = await prisma.result.findMany({
			where: {
				termId: termId || undefined,
				sessionId: sessionId || undefined,
			},
			include: {
				student: {
					select: { firstName: true, lastName: true, admissionNumber: true },
				},
				subject: { select: { subjectName: true } },
				staff: { select: { firstName: true, lastName: true } },
			},
			orderBy: { createdAt: 'desc' },
			take: parseInt(limit) || 10,
		});

		// Format as activity feed
	 const activities = recentResults.map((result) => ({
			type: 'entry',
			action: `Scores entered for ${result.student.firstName} ${result.student.lastName} (${result.student.admissionNumber}) - ${result.subject.subjectName}`,
			time: new Date(result.createdAt).toLocaleString(),
			studentId: result.studentId,
			subjectId: result.subjectId,
		}));

		return res.status(200).json({
			success: true,
			data: activities,
		});
	} catch (error) {
		return next(error);
	}
};

const getResultsByClass = async (req, res, next) => {
	try {
		const { classId, termId, sessionId } = req.query;

		const prisma = require("../../lib/prisma");

		// Get the term enum value from termId
		let termEnum = null;
		if (termId) {
			const termRecord = await prisma.academicTerm.findUnique({
				where: { id: termId },
				select: { term: true },
			});
			termEnum = termRecord?.term;
		}

		// Get the session name from sessionId
		let sessionName = null;
		if (sessionId) {
			const sessionRecord = await prisma.academicSession.findUnique({
				where: { id: sessionId },
				select: { session: true },
			});
			sessionName = sessionRecord?.session;
		}

		// Get students in this class for this term/session
		const enrolledStudents = await prisma.enrollment.findMany({
			where: {
				classId: classId,
				status: "ACTIVE",
				...(termEnum && { term: termEnum }),
				...(sessionName && { academicYear: sessionName }),
			},
			select: { studentId: true },
		});

		const studentIds = enrolledStudents.map(e => e.studentId);

		// Get results for these students
		const results = await prisma.result.findMany({
			where: {
				studentId: { in: studentIds },
				termId: termId || undefined,
				sessionId: sessionId || undefined,
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
		});

		// Group results by student and subject for easy frontend consumption
		const groupedResults = results.reduce((acc, result) => {
			const studentId = result.studentId;
			const subjectId = result.subjectId;
			
			if (!acc[studentId]) {
				acc[studentId] = {
					studentId: result.studentId,
					student: result.student,
					subjects: {},
				};
			}
			
			acc[studentId].subjects[subjectId] = {
				subjectId: result.subjectId,
				subject: result.subject,
				ca1Score: result.ca1Score,
				ca2Score: result.ca2Score,
				examScore: result.examScore,
				total: result.total,
				grade: result.grade,
				isComplete: result.ca1Score !== null && result.ca2Score !== null && result.examScore !== null,
			};
			
			return acc;
		}, {});

		return res.status(200).json({
			success: true,
			data: Object.values(groupedResults),
		});
	} catch (error) {
		console.error('Error in getResultsByClass:', error);
		return next(error);
	}
};

module.exports = {
	getUnverifiedResults,
	verifyResult,
	verifyAllResultsForStudent,
	verifyAllResultsForClass,
	bulkEntryScores,
	getEntryStatus,
	getResultsStatistics,
	getEntryStatusByClass,
	getRecentActivity,
	getResultsByClass,
};
