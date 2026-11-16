const prisma = require("../../lib/prisma");

// Level progression for automatic promotion
const LEVEL_SEQUENCE = {
  "DAYCARE": "PRENURSERY",
  "PRENURSERY": "NURSERY_1",
  "NURSERY_1": "NURSERY_2",
  "NURSERY_2": "NURSERY_3",
  "NURSERY_3": "PRIMARY_1",
  "PRIMARY_1": "PRIMARY_2",
  "PRIMARY_2": "PRIMARY_3",
  "PRIMARY_3": "PRIMARY_4",
  "PRIMARY_4": "PRIMARY_5",
  "PRIMARY_5": null, // Skip - manual handling
  "PRIMARY_6": "GRADUATED",
};

function getNextLevel(currentLevel) {
  return LEVEL_SEQUENCE[currentLevel];
}

const enrollStudent = (data, db = prisma) => db.enrollment.create({ data });

const enrollStudentWithCount = async (data, db = prisma) => {
	return db.$transaction(async (tx) => {

		const student = await tx.student.findUnique({
			where: { 
				admissionNumber: data.studentId,
				deletedAt: null  // Only find active (non-deleted) students
			},
			select: { id: true, status: true },
		});

		if (!student) throw new Error("Student not found");
		if (student.status !== "ACTIVE")
			throw new Error("Only active students can be enrolled");

		let enrollment;
		try {
			enrollment = await tx.enrollment.create({
				data: { 
					studentId: student.id, // Use the actual database ID
					classId: data.classId,
					academicYear: data.academicYear,
					term: data.term,
					status: data.status ?? "ACTIVE" 
				},
			});
		} catch (err) {
			// Enrollment has exactly one unique constraint
			// (@@unique([studentId, academicYear, term])), so any P2002
			// from this specific call can only mean this exact duplicate.
			if (err.code === "P2002") {
				throw new Error("Student already enrolled for this term");
			}
			throw err;
		}

		// Update class enrollment count
		await tx.class.update({
			where: { id: data.classId },
			data: { currentEnrollment: { increment: 1 } },
		});

		return enrollment;
	});
};

const findActiveEnrollment = async (studentId, db = prisma) => {
	// studentId can be either admissionNumber or database ID
	// Try admissionNumber first (from frontend), fallback to ID
	const student = await db.student.findFirst({
		where: { 
			deletedAt: null,
			OR: [
				{ admissionNumber: studentId },
				{ id: studentId }
			]
		},
		select: { id: true }
	});

	if (!student) return null;

	return db.enrollment.findFirst({
		where: { studentId: student.id, status: "ACTIVE" },
		include: { class: true },
		orderBy: { createdAt: "desc" },
	});
};

const findEnrollmentsBySession = async (studentId, academicYear, db = prisma) => {
	// studentId can be either admissionNumber or database ID
	const student = await db.student.findFirst({
		where: { 
			deletedAt: null,
			OR: [
				{ admissionNumber: studentId },
				{ id: studentId }
			]
		},
		select: { id: true }
	});

	if (!student) return [];

	return db.enrollment.findMany({
		where: { studentId: student.id, academicYear },
		include: { class: true },
		orderBy: { createdAt: "asc" },
	});
};

const findEnrollmentsByClass = (
	classId,
	academicYear,
	term,
	status = "ACTIVE",
	db = prisma,
) =>
	db.enrollment.findMany({
		where: { classId, academicYear, term, status },
		include: {
			student: {
				select: {
					admissionNumber: true,
					firstName: true,
					lastName: true,
					gender: true,
					passportPhoto: true,
				},
			},
			class: true,
		},
	});

const findPendingEnrollments = (classId, db = prisma) =>
	db.enrollment.findMany({
		where: { classId, status: "PENDING" },
		include: {
			student: {
				select: {
					admissionNumber: true,
					firstName: true,
					lastName: true,
					gender: true,
				},
			},
		},
	});

const updateEnrollment = (id, data, db = prisma) =>
	db.enrollment.update({ where: { id }, data });

const transferStudent = async (enrollmentId, newClassId, db = prisma) => {
	return db.$transaction(async (tx) => {
		const enrollment = await tx.enrollment.findUnique({
			where: { id: enrollmentId },
			select: { id: true, classId: true, status: true, academicYear: true, term: true },
		});

		if (!enrollment) throw new Error("Enrollment not found");
		if (enrollment.status !== "ACTIVE")
			throw new Error("Only active students can be transferred");
		if (enrollment.classId === newClassId)
			throw new Error("Student already in this class");

		const newClass = await tx.class.findUnique({
			where: { id: newClassId },
			select: { id: true },
		});

		if (!newClass) throw new Error("Class not found");

		// CROSS-TERM TRANSFER BLOCKING
		// Classes don't have direct term/session associations in the schema
		// Transfers are only allowed within the same academic year and term
		// This is enforced at the frontend level by only showing classes for the current term
		// If we need backend validation, we would need to fetch the current term from context
		// For now, we rely on the frontend to only allow same-term transfers
		logger.info(`Transfer requested: enrollment ${enrollmentId} from class ${enrollment.classId} to class ${newClassId}`);
		logger.info(`Current enrollment: academicYear=${enrollment.academicYear}, term=${enrollment.term}`);

		// Update old class enrollment count
		await tx.class.update({
			where: { id: enrollment.classId },
			data: { currentEnrollment: { decrement: 1 } },
		});

		// Update new class enrollment count
		await tx.class.update({
			where: { id: newClassId },
			data: { currentEnrollment: { increment: 1 } },
		});

		return tx.enrollment.update({
			where: { id: enrollmentId },
			data: {
				previousClassId: enrollment.classId,
				classId: newClassId,
				transferredAt: new Date(),
				transferCount: { increment: 1 },
			},
		});
	});
};

const bulkTransferStudents = async (transfers, db = prisma) => {
	return db.$transaction(async (tx) => {
		const results = [];
		
		for (const transfer of transfers) {
			try {
				const enrollment = await tx.enrollment.findUnique({
					where: { id: transfer.enrollmentId },
					select: { id: true, classId: true, status: true },
				});

				if (!enrollment) {
					results.push({
						enrollmentId: transfer.enrollmentId,
						success: false,
						error: "Enrollment not found",
					});
					continue;
				}

				if (enrollment.status !== "ACTIVE") {
					results.push({
						enrollmentId: transfer.enrollmentId,
						success: false,
						error: "Only active students can be transferred",
					});
					continue;
				}

				if (enrollment.classId === transfer.newClassId) {
					results.push({
						enrollmentId: transfer.enrollmentId,
						success: false,
						error: "Student already in this class",
					});
					continue;
				}

				const newClass = await tx.class.findUnique({
					where: { id: transfer.newClassId },
					select: { id: true },
				});

				if (!newClass) {
					results.push({
						enrollmentId: transfer.enrollmentId,
						success: false,
						error: "Class not found",
					});
					continue;
				}

				// Update old class enrollment count
				await tx.class.update({
					where: { id: enrollment.classId },
					data: { currentEnrollment: { decrement: 1 } },
				});

				// Update new class enrollment count
				await tx.class.update({
					where: { id: transfer.newClassId },
					data: { currentEnrollment: { increment: 1 } },
				});

				await tx.enrollment.update({
					where: { id: transfer.enrollmentId },
					data: {
						previousClassId: enrollment.classId,
						classId: transfer.newClassId,
						transferredAt: new Date(),
						transferCount: { increment: 1 },
					},
				});

				results.push({
					enrollmentId: transfer.enrollmentId,
					success: true,
				});
			} catch (error) {
				results.push({
					enrollmentId: transfer.enrollmentId,
					success: false,
					error: error.message,
				});
			}
		}

		return results;
	});
};

const deleteEnrollment = (id, db = prisma) =>
	db.enrollment.delete({ where: { id } });

const countEnrollments = (filters = {}, db = prisma) =>
	db.enrollment.count({ where: filters });

const countEnrollmentsByClass = (classId, db = prisma) =>
	db.enrollment.count({ where: { classId } });

const countActiveEnrollmentsByClass = (classId, db = prisma) =>
	db.enrollment.count({ where: { classId, status: "ACTIVE" } });

const countPendingEnrollmentsByClass = (classId, db = prisma) =>
	db.enrollment.count({ where: { classId, status: "PENDING" } });

const findEnrollmentById = (id, db = prisma) =>
	db.enrollment.findUnique({
		where: { id },
		include: {
			student: {
				select: {
					admissionNumber: true,
					firstName: true,
					lastName: true,
					gender: true,
				},
			},
			class: true,
		},
	});

const findEnrollmentByStudentAndTerm = (studentId, academicYear, term, db = prisma) =>
	db.enrollment.findFirst({
		where: { studentId, academicYear, term },
		include: {
			class: true,
		},
	});

// PROMOTION

const findActiveStudentsForSession = async (sessionName, db = prisma) => {
	const session = await db.academicSession.findUnique({
		where: { session: sessionName },
	});

	if (!session) return [];

	return db.student.findMany({
		where: {
			status: "ACTIVE",
			deletedAt: null,
			enrollments: {
				some: { sessionId: session.id },
			},
		},
	});
};

const findResultsByStudentIdsAndSession = async (studentIds, sessionId, db = prisma) => {
	const results = await db.result.findMany({
		where: {
			studentId: { in: studentIds },
			sessionId,
		},
	});

	const resultsByStudent = new Map();
	for (const result of results) {
		if (!resultsByStudent.has(result.studentId)) {
			resultsByStudent.set(result.studentId, []);
		}
		resultsByStudent.get(result.studentId).push(result);
	}
	return resultsByStudent;
};

const findPromotionRunBySession = (sessionId, db = prisma) =>
	db.promotionRun.findUnique({
		where: { sessionId },
	});

const promoteStudentsToNextSession = async (sessionId, staffId) => {
	return prisma.$transaction(async (tx) => {
		// Get session with next session year
		const session = await tx.academicSession.findUnique({
			where: { id: sessionId },
			include: { terms: true },
		});

		if (!session) throw new Error("Session not found");

		// Calculate next session year (e.g., 2024/2025 → 2025/2026)
		const [startYear] = session.session.split('/');
		const nextSessionYear = `${parseInt(startYear) + 1}/${parseInt(startYear) + 2}`;

		// Check if next session exists, create if not
		let nextSession = await tx.academicSession.findUnique({
			where: { session: nextSessionYear },
		});

		if (!nextSession) {
			nextSession = await tx.academicSession.create({
				data: {
					session: nextSessionYear,
					status: "UPCOMING",
				},
			});
		}

		// Create promotion run
		const promotionRun = await tx.promotionRun.create({
			data: {
				sessionId,
				staffId,
				status: "COMPLETED",
				completedAt: new Date(),
			},
		});

		// Get all active students with their current enrollments
		const students = await tx.student.findMany({
			where: { status: "ACTIVE", deletedAt: null },
			include: {
				enrollments: {
					where: { sessionId },
					include: { class: true },
				},
			},
		});

		let promotedCount = 0;
		let graduatedCount = 0;
		let skippedCount = 0;

		for (const student of students) {
			const currentEnrollment = student.enrollments[0];
			const currentLevel = currentEnrollment?.class?.level;

			if (!currentLevel) continue;

			const nextLevel = getNextLevel(currentLevel);

			// Skip Primary 5 for manual handling
			if (currentLevel === "PRIMARY_5") {
				skippedCount++;
				await tx.promotionLog.create({
					data: {
						promotionRunId: promotionRun.id,
						studentId: student.id,
						fromLevel: currentLevel,
						toLevel: currentLevel,
						promoted: false,
						reason: "Manual handling required",
					},
				});
				continue;
			}

			// Graduate Primary 6
			if (nextLevel === "GRADUATED") {
				await tx.student.update({
					where: { id: student.id },
					data: { status: "GRADUATED" },
				});

				await tx.promotionLog.create({
					data: {
						promotionRunId: promotionRun.id,
						studentId: student.id,
						fromLevel: currentLevel,
						toLevel: "GRADUATED",
						promoted: true,
					},
				});

				graduatedCount++;
				continue;
			}

			// Normal promotion - find next class
			const nextClass = await tx.class.findFirst({
				where: { level: nextLevel, status: "ACTIVE" },
			});

			if (!nextClass) {
				await tx.promotionLog.create({
					data: {
						promotionRunId: promotionRun.id,
						studentId: student.id,
						fromLevel: currentLevel,
						toLevel: nextLevel,
						promoted: false,
						reason: "No active class found for next level",
					},
				});
				continue;
			}

			// Create new enrollment for next session
			await tx.enrollment.create({
				data: {
					studentId: student.id,
					classId: nextClass.id,
					academicYear: nextSessionYear,
					term: "FIRST_TERM",
					status: "PENDING",
				},
			});

			// Update class enrollment count
			await tx.class.update({
				where: { id: nextClass.id },
				data: { currentEnrollment: { increment: 1 } },
			});

			await tx.promotionLog.create({
				data: {
					promotionRunId: promotionRun.id,
					studentId: student.id,
					fromLevel: currentLevel,
					toLevel: nextLevel,
					promoted: true,
				},
			});

			promotedCount++;
		}

		return {
			promoted: promotedCount,
			graduated: graduatedCount,
			skipped: skippedCount,
			total: students.length,
		};
	});
};

module.exports = {
	enrollStudent,
	enrollStudentWithCount,
	findActiveEnrollment,
	findEnrollmentsBySession,
	findEnrollmentsByClass,
	findPendingEnrollments,
	updateEnrollment,
	transferStudent,
	bulkTransferStudents,
	deleteEnrollment,
	countEnrollments,
	countEnrollmentsByClass,
	countActiveEnrollmentsByClass,
	countPendingEnrollmentsByClass,
	findEnrollmentById,
	findEnrollmentByStudentAndTerm,
	findActiveStudentsForSession,
	findResultsByStudentIdsAndSession,
	findPromotionRunBySession,
	promoteStudentsToNextSession,
};
