const prisma = require("../../lib/prisma");

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
			select: { id: true, classId: true, status: true },
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
};
