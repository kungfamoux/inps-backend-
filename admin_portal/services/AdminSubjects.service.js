const SubjectsRepository = require("../repositories/SubjectRepository");
const ClassRepository = require("../repositories/ClassRepository");
const StaffRepository = require("../repositories/StaffRepository");
const TeacherResultRepository = require("../../shared/repositories/TeacherResultRepository");
const EnrollmentRepository = require("../repositories/EnrollmentRepository");
const logger = require("../../utils/logger");
const { computeGrade } = require("../../utils/grading");

const toMinutes = (time) => {
	const [hours, minutes] = time.split(":").map(Number);
	return hours * 60 + minutes;
};

class AdminSubjectsService {
	// SUBJECTS

	async createSubject(data) {
		const { subjectName, subjectCode, levels } = data;

		if (!subjectName || !subjectCode || !levels?.length) {
			throw new Error(
				"subjectName, subjectCode, and at least one level are required",
			);
		}

		logger.info(`Creating subject: "${subjectName}" (${subjectCode})`);

		const existing = await SubjectsRepository.findSubjectByCode(subjectCode);
		if (existing)
			throw new Error(`Subject code already exists: ${subjectCode}`);

		const subject = await SubjectsRepository.createSubject({
			subjectName,
			subjectCode,
			isActive: true,
			levels: {
				create: levels.map((level) => ({ level })),
			},
		});

		logger.info(`Subject created — id: ${subject.id}`);
		return subject;
	}

	async getAllSubjects(filters = {}) {
		logger.info(`Fetching subjects — filters: ${JSON.stringify(filters)}`);
		return SubjectsRepository.findAllSubjects(filters);
	}

	async getSubjectById(id) {
		logger.info(`Fetching subject: ${id}`);
		const subject = await SubjectsRepository.findSubjectById(id);
		if (!subject) throw new Error("Subject not found");
		return subject;
	}

	async updateSubject(id, data) {
		logger.info(`Updating subject: ${id}`);

		const subject = await SubjectsRepository.findSubjectById(id);
		if (!subject) throw new Error("Subject not found");

		const { levels, subjectCode, ...safeData } = data;

		// Update subjectCode if provided — check uniqueness first
		if (subjectCode && subjectCode !== subject.subjectCode) {
			const existing = await SubjectsRepository.findSubjectByCode(subjectCode);
			if (existing)
				throw new Error(`Subject code already exists: ${subjectCode}`);
			safeData.subjectCode = subjectCode;
		}

		const updated = await SubjectsRepository.updateSubject(id, safeData);

		// Update levels separately if provided — replace the full set
		if (levels?.length) {
			await SubjectsRepository.replaceSubjectLevels(subject.id, levels);
		}

		logger.info(`Subject updated: ${id}`);
		return SubjectsRepository.findSubjectById(id); // re-fetch to include updated levels
	}

	async deleteSubject(id) {
		logger.info(`Deleting subject: ${id}`);
		const subject = await SubjectsRepository.findSubjectById(id);
		if (!subject) throw new Error("Subject not found");
		await SubjectsRepository.deleteSubject(id);
		logger.info(`Subject deleted: ${id}`);
	}

	// Toggles isActive on/off.
	// Inactive subjects cannot be assigned to classes or teachers.
	async toggleSubjectActive(id) {
		logger.info(`Toggling active status for subject: ${id}`);
		const subject = await SubjectsRepository.findSubjectById(id);
		if (!subject) throw new Error("Subject not found");

		const updated = await SubjectsRepository.updateSubject(id, {
			isActive: !subject.isActive,
		});

		logger.info(`Subject ${id} isActive set to: ${updated.isActive}`);
		return updated;
	}

	async addSubjectLevel(subjectId, level) {
		logger.info(`Adding level ${level} to subject: ${subjectId}`);
		const subject = await SubjectsRepository.findSubjectById(subjectId);
		if (!subject) throw new Error("Subject not found");

		const alreadyHasLevel = subject.levels.some((l) => l.level === level);
		if (alreadyHasLevel) throw new Error(`Subject already applies to ${level}`);

		const updated = await SubjectsRepository.addSubjectLevel(subjectId, level);
		logger.info(`Level ${level} added to subject: ${subjectId}`);
		return updated;
	}

	async removeSubjectLevel(subjectId, level) {
		logger.info(`Removing level ${level} from subject: ${subjectId}`);
		const subject = await SubjectsRepository.findSubjectById(subjectId);
		if (!subject) throw new Error("Subject not found");
		await SubjectsRepository.removeSubjectLevel(subjectId, level);
		logger.info(`Level ${level} removed from subject: ${subjectId}`);
	}

	// CLASS CURRICULUM
	// termId references AcademicTerm — curriculum is scoped per term.

	async assignSubjectToClass(classId, subjectId, termId) {
		if (!classId || !subjectId || !termId)
			throw new Error("classId, subjectId, and termId are required");

		logger.info(
			`Assigning subject ${subjectId} to class ${classId} — term: ${termId}`,
		);

		const cls = await ClassRepository.findClassById(classId);
		if (!cls) throw new Error("Class not found");

		const subject = await SubjectsRepository.findSubjectById(subjectId);
		if (!subject) throw new Error("Subject not found");
		if (!subject.isActive) {
			throw new Error(
				"Cannot assign an inactive subject to a class. Activate it first.",
			);
		}

		const existing = await SubjectsRepository.findClassSubject(
			classId,
			subjectId,
			termId,
		);
		if (existing)
			throw new Error(
				"Subject is already assigned to this class for this term",
			);

		const result = await SubjectsRepository.createClassSubject(
			classId,
			subjectId,
			termId,
		);
		logger.info(
			`Subject ${subjectId} assigned to class ${classId} — term: ${termId}`,
		);
		return result;
	}

	async removeSubjectFromClass(classId, subjectId, termId) {
		if (!classId || !subjectId || !termId)
			throw new Error("classId, subjectId, and termId are required");

		logger.info(
			`Removing subject ${subjectId} from class ${classId} — term: ${termId}`,
		);

		const existing = await SubjectsRepository.findClassSubject(
			classId,
			subjectId,
			termId,
		);
		if (!existing)
			throw new Error("Subject is not assigned to this class for this term");

		await SubjectsRepository.deleteClassSubject(classId, subjectId, termId);
		logger.info(
			`Subject ${subjectId} removed from class ${classId} — term: ${termId}`,
		);
	}

	async getSubjectsByClass(classId, termId) {
		logger.info(`Fetching subjects for class: ${classId} — term: ${termId}`);
		return SubjectsRepository.findSubjectsByClass(classId, termId);
	}

	async bulkAssignSubjectsToClass(classId, termId, subjectIds) {
		if (!classId || !termId || !subjectIds?.length) {
			throw new Error("classId, termId, and subjectIds are required");
		}

		const cls = await ClassRepository.findClassById(classId);
		if (!cls) throw new Error("Class not found");

		const uniqueIds = [...new Set(subjectIds)];
		const subjects = await SubjectsRepository.findSubjectsByIds(uniqueIds);

		const foundIds = new Set(subjects.map((s) => s.id));
		const missing = uniqueIds.filter((id) => !foundIds.has(id));
		if (missing.length) {
			throw new Error(`Subject(s) not found: ${missing.join(", ")}`);
		}

		const inactive = subjects.filter((s) => !s.isActive);
		if (inactive.length) {
			throw new Error(
				`Cannot assign inactive subject(s): ${inactive.map((s) => s.subjectName).join(", ")}`,
			);
		}

		logger.info(
			`Bulk assigning ${uniqueIds.length} subject(s) to class ${classId} — term: ${termId}`,
		);

		const result = await SubjectsRepository.bulkCreateClassSubjects(
			classId,
			uniqueIds,
			termId,
		);

		logger.info(
			`Bulk assign complete — ${result.count} new subject(s) added to class ${classId} for term ${termId}`,
		);

		const curriculum = await SubjectsRepository.findSubjectsByClass(
			classId,
			termId,
		);

		return {
			added: result.count,
			skipped: uniqueIds.length - result.count,
			curriculum,
		};
	}

	// SUBJECT TEACHER ASSIGNMENTS

	async assignSubjectToTeacher(data) {
		const { classId, subjectId, teacherId, academicYear, term, termId } =
			data;

		if (
			!classId ||
			!subjectId ||
			!teacherId ||
			!academicYear ||
			!term ||
			!termId
		) {
			throw new Error(
				"classId, subjectId, teacherId, academicYear, term, and termId are required",
			);
		}

		logger.info(
			`Assigning subject ${subjectId} to teacher ${teacherId} in class ${classId}`,
		);

		const cls = await ClassRepository.findClassById(classId);
		if (!cls) throw new Error("Class not found");

		const subject = await SubjectsRepository.findSubjectById(subjectId);
		if (!subject) throw new Error("Subject not found");
		if (!subject.isActive) {
			throw new Error(
				"Cannot assign an inactive subject to a teacher. Activate it first.",
			);
		}

		const teacher = await StaffRepository.findById(teacherId);
		if (!teacher) throw new Error("Teacher not found");

		const existing = await SubjectsRepository.findSubjectAssignmentByUnique(
			classId,
			subjectId,
			academicYear,
			term,
		);
		if (existing) {
			throw new Error(
				"This subject is already assigned to a teacher in this class for this term",
			);
		}

		const assignment = await SubjectsRepository.createSubjectAssignment({
			classId,
			subjectId,
			teacherId,
			academicYear,
			term,
			status: "ACTIVE",
		});

		logger.info(
			`Subject assignment created — id: ${assignment.id}, teacher: ${teacherId}`,
		);
		return assignment;
	}

	async getAssignmentsByTeacher(teacherId) {
		logger.info(`Fetching subject assignments for teacher: ${teacherId}`);
		return SubjectsRepository.findAssignmentsByTeacher(teacherId);
	}

	async getAssignmentsByClass(classId, academicYear, term) {
		logger.info(`Fetching subject assignments for class: ${classId}`);
		return SubjectsRepository.findAssignmentsByClass(
			classId,
			academicYear,
			term,
		);
	}

	async updateSubjectAssignment(id, data) {
		logger.info(`Updating subject assignment: ${id}`);
		const updated = await SubjectsRepository.updateSubjectAssignment(id, data);
		logger.info(`Subject assignment updated: ${id}`);
		return updated;
	}

	async deactivateSubjectAssignment(id) {
		logger.info(`Deactivating subject assignment: ${id}`);
		await SubjectsRepository.deactivateSubjectAssignment(id);
		logger.info(`Subject assignment deactivated: ${id}`);
	}

	async getAllSubjectAssignments(filters = {}) {
		logger.info(`Fetching all subject assignments — filters: ${JSON.stringify(filters)}`);
		return SubjectsRepository.findAllSubjectAssignments(filters);
	}

	async removeSubjectAssignment(id) {
		logger.info(`Removing subject assignment: ${id}`);
		await SubjectsRepository.deactivateSubjectAssignment(id);
		logger.info(`Subject assignment removed: ${id}`);
	}

	async bulkAssignSubjectToTeacher(data) {
		const { classIds, subjectId, teacherId, academicYear, term, termId } = data;

		if (!classIds?.length || !subjectId || !teacherId || !academicYear || !term || !termId) {
			throw new Error("classIds, subjectId, teacherId, academicYear, term, and termId are required");
		}

		logger.info(`Bulk assigning subject ${subjectId} to teacher ${teacherId} for ${classIds.length} classes`);

		const subject = await SubjectsRepository.findSubjectById(subjectId);
		if (!subject) throw new Error("Subject not found");
		if (!subject.isActive) {
			throw new Error("Cannot assign an inactive subject to a teacher. Activate it first.");
		}

		const teacher = await StaffRepository.findById(teacherId);
		if (!teacher) throw new Error("Teacher not found");

		const results = [];
		for (const classId of classIds) {
			const cls = await ClassRepository.findClassById(classId);
			if (!cls) throw new Error(`Class not found: ${classId}`);

			const existing = await SubjectsRepository.findSubjectAssignmentByUnique(
				classId,
				subjectId,
				academicYear,
				term,
			);
			if (existing) {
				logger.info(`Skipping duplicate assignment for class ${classId}`);
				continue;
			}

			const assignment = await SubjectsRepository.createSubjectAssignment({
				classId,
				subjectId,
				teacherId,
				academicYear,
				term,
				status: "ACTIVE",
			});
			results.push(assignment);
		}

		logger.info(`Bulk assignment complete — ${results.length} assignments created`);
		return results;
	}

	// CLASS TEACHER ASSIGNMENTS

	async assignClassTeacher(classId, staffId) {
		logger.info(
			`Assigning class teacher ${staffId} to class ${classId}`,
		);

		const staff = await StaffRepository.findById(staffId);
		if (!staff) throw new Error("Staff not found");

		const existingAssignment =
			await SubjectsRepository.findClassByClassTeacherId(staffId);
		if (existingAssignment && existingAssignment.id !== classId) {
			throw new Error(
				`${staff.firstName} ${staff.lastName} is already the class teacher of ${existingAssignment.name}. Remove them from that class first.`,
			);
		}

		const updated = await SubjectsRepository.assignClassTeacher(
			classId,
			staffId,
		);
		logger.info(
			`Class teacher assigned — class: ${classId}, teacher: ${staffId}`,
		);
		return updated;
	}

	async assignAssistantTeacher(classId, staffId) {
		logger.info(
			`Assigning assistant teacher ${staffId} to class ${classId}`,
		);

		const staff = await StaffRepository.findById(staffId);
		if (!staff) throw new Error("Staff not found");

		const existingAssignment =
			await SubjectsRepository.findClassByAssistantTeacherId(staffId);
		if (existingAssignment && existingAssignment.id !== classId) {
			throw new Error(
				`${staff.firstName} ${staff.lastName} is already the assistant teacher of ${existingAssignment.name}. Remove them from that class first.`,
			);
		}

		const updated = await SubjectsRepository.assignAssistantTeacher(
			classId,
			staffId,
		);
		logger.info(
			`Assistant teacher assigned — class: ${classId}, teacher: ${staffId}`,
		);
		return updated;
	}

	async removeClassTeacher(classId) {
		logger.info(
			`Removing class teacher from class ${classId}`,
		);
		const updated = await SubjectsRepository.removeClassTeacher(classId);
		logger.info(`Class teacher removed from class: ${classId}`);
		return updated;
	}

	async removeAssistantTeacher(classId) {
		logger.info(
			`Removing assistant teacher from class ${classId}`,
		);
		const updated = await SubjectsRepository.removeAssistantTeacher(classId);
		logger.info(`Assistant teacher removed from class: ${classId}`);
		return updated;
	}

	// SCHEDULES

	async createSchedule(data) {
		const { classId, subjectId, staffId, dayOfWeek, startTime, endTime } =
			data;

		if (
			!classId ||
			!subjectId ||
			!staffId ||
			!dayOfWeek ||
			!startTime ||
			!endTime
		) {
			throw new Error(
				"classId, subjectId, staffId, dayOfWeek, startTime, and endTime are required",
			);
		}

		logger.info(
			`Creating schedule — class: ${classId}, subject: ${subjectId}, day: ${dayOfWeek}`,
		);

		const assignment = await SubjectsRepository.findActiveSubjectAssignment(
			classId,
			subjectId,
			staffId,
		);
		if (!assignment) {
			throw new Error(
				"Teacher must be assigned to this subject in this class before a schedule can be created",
			);
		}

		const newStart = toMinutes(startTime);
		const newEnd = toMinutes(endTime);

		// Check 1 — class clash
		const classSchedules = await SubjectsRepository.findSchedulesByDay(
			classId,
			dayOfWeek,
		);

		const classClash = classSchedules.find((s) => {
			return toMinutes(s.startTime) < newEnd && toMinutes(s.endTime) > newStart;
		});

		if (classClash) {
			throw new Error(
				`Time slot clashes with an existing schedule in this class: ${classClash.subject?.subjectName ?? classClash.subjectId} (${classClash.startTime} – ${classClash.endTime})`,
			);
		}

		// Check 2 — teacher clash across all classes
		const teacherSchedules =
			await SubjectsRepository.findSchedulesByStaffAndDay(staffId, dayOfWeek);

		const teacherClash = teacherSchedules.find((s) => {
			return toMinutes(s.startTime) < newEnd && toMinutes(s.endTime) > newStart;
		});

		if (teacherClash) {
			throw new Error(
				`Teacher is already scheduled in another class at this time: ${teacherClash.class?.name ?? teacherClash.classId} — ${teacherClash.subject?.subjectName ?? teacherClash.subjectId} (${teacherClash.startTime} – ${teacherClash.endTime})`,
			);
		}

		const schedule = await SubjectsRepository.createSchedule({
			classId,
			subjectId,
			staffId,
			dayOfWeek,
			startTime,
			endTime,
		});

		logger.info(`Schedule created — id: ${schedule.id}`);
		return schedule;
	}

	async getSchedulesByClass(classId) {
		logger.info(`Fetching schedules for class: ${classId}`);
		return SubjectsRepository.findSchedulesByClass(classId);
	}

	async getSchedulesByTeacher(staffId) {
		logger.info(`Fetching schedules for teacher: ${staffId}`);
		return SubjectsRepository.findSchedulesByTeacher(staffId);
	}

	async deleteSchedule(scheduleId) {
		logger.info(`Deleting schedule: ${scheduleId}`);
		await SubjectsRepository.deleteSchedule(scheduleId);
		logger.info(`Schedule deleted: ${scheduleId}`);
	}

	// RESULT VERIFICATION

	async getUnverifiedResults(filters = {}) {
		const { termId, sessionId, page, limit } = filters;
		logger.info(
			`Fetching unverified results — term: ${termId}, session: ${sessionId}`,
		);

		const results = await TeacherResultRepository.findAllResults({
			termId,
			sessionId,
			page,
			limit,
		});

		const unverified = results.data.filter((r) => !r.isVerified);

		return {
			total: results.meta.total,
			unverified: unverified.length,
			data: unverified,
			meta: results.meta,
		};
	}

	async verifyResult(resultId, staffId) {
		logger.info(`Verifying result: ${resultId} by staff: ${staffId}`);
		const result = await TeacherResultRepository.verifyResult(
			resultId,
			staffId,
		);
		logger.info(`Result verified: ${resultId}`);
		return result;
	}

	async verifyAllResultsForStudent(studentId, termId, sessionId, staffId) {
		logger.info(
			`Verifying all results for student: ${studentId} — term: ${termId}, session: ${sessionId}`,
		);

		const verified = await TeacherResultRepository.verifyAllResultsForStudent(
			studentId,
			termId,
			sessionId,
			staffId,
		);

		logger.info(`Verified ${verified} results for student: ${studentId}`);
		return { verified };
	}

	async verifyAllResultsForClass(classId, termId, sessionId, staffId) {
		logger.info(
			`Verifying all results for class: ${classId} — term: ${termId}, session: ${sessionId}`,
		);

		const verified = await TeacherResultRepository.verifyAllResultsForClass(
			classId,
			termId,
			sessionId,
			staffId,
		);

		logger.info(`Verified results for class: ${classId}`);
		return { verified };
	}

	computeGrade(total) {
		return computeGrade(total);
	}
}

module.exports = new AdminSubjectsService();
