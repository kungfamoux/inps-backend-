const ClassRepository = require("../repositories/ClassRepository");
const StaffRepository = require("../repositories/StaffRepository");
const { sanitizeClass } = require("../../utils/sanitizers");
const logger = require("../../utils/logger");

class AdminClassService {
	//  Classes

	async createClass(data) {
		const { name, color, roomNumber } = data;

		if (!name) {
			throw new Error("name is required");
		}

		logger.info(`Creating class: ${name}`);

		const existing = await ClassRepository.findClassByName(name);
		if (existing) throw new Error(`A class with this name already exists: ${name}`);

		const created = await ClassRepository.createClass({ name, color, roomNumber });

		logger.info(`Class created — id: ${created.id}`);
		return sanitizeClass(created);
	}

	async getAllClasses(filters = {}) {
		logger.info(`Fetching all classes — filters: ${JSON.stringify(filters)}`);
		const classes = await ClassRepository.findAllClasses(filters);
		return classes.map(sanitizeClass);
	}

	async getClassById(id) {
		logger.info(`Fetching class: ${id}`);
		const cls = await ClassRepository.findClassById(id);
		if (!cls) throw new Error("Class not found");
		return sanitizeClass(cls);
	}

	async getClassByName(name) {
		logger.info(`Fetching class by name: ${name}`);
		const cls = await ClassRepository.findClassByName(name);
		if (!cls) throw new Error("Class not found");
		return sanitizeClass(cls);
	}

	async updateClass(id, data) {
		logger.info(`Updating class: ${id}`);

		const cls = await ClassRepository.findClassById(id);
		if (!cls) throw new Error("Class not found");

		// name is the unique identifier — strip it to prevent accidental mutation
		const { name: _name, ...safeData } = data;

		// Validate teacher assignments if provided
		const teacherFields = ["classTeacherId", "assistantTeacherId"];
		for (const field of teacherFields) {
			if (safeData[field]) {
				const teacher = await StaffRepository.findById(safeData[field]);
				if (!teacher) {
					throw new Error(`Teacher not found for ${field}: ${safeData[field]}`);
				}
			}
		}

		// If renaming, check the new name doesn't clash
		if (safeData.name && safeData.name !== cls.name) {
			const clash = await ClassRepository.findClassByName(safeData.name);
			if (clash) {
				throw new Error(
					`A class with this name already exists: ${safeData.name}`,
				);
			}
		}

		const updated = await ClassRepository.updateClass(id, safeData);
		logger.info(`Class updated: ${id}`);
		return sanitizeClass(updated);
	}

	async deleteClass(id) {
		logger.info(`Deleting class: ${id}`);

		const cls = await ClassRepository.findClassById(id);
		if (!cls) throw new Error("Class not found");

		if (cls.currentEnrollment > 0) {
			throw new Error(
				"Cannot delete a class that has enrolled students. Remove enrollments first.",
			);
		}

		const dependents = await ClassRepository.countClassDependents(id);
		if (dependents.total > 0) {
			const parts = [];
			if (dependents.classSubjects) parts.push(`${dependents.classSubjects} class-subject link(s)`);
			if (dependents.enrollments) parts.push(`${dependents.enrollments} enrollment(s)`);
			if (dependents.billClasses) parts.push(`${dependents.billClasses} bill assignment(s)`);
			if (dependents.subjectAssignments) parts.push(`${dependents.subjectAssignments} subject assignment(s)`);
			if (dependents.schedules) parts.push(`${dependents.schedules} schedule(s)`);
			if (dependents.attendance) parts.push(`${dependents.attendance} attendance record(s)`);
			if (dependents.behavioralRatings) parts.push(`${dependents.behavioralRatings} behavioral rating(s)`);
			if (dependents.nurseryAssessments) parts.push(`${dependents.nurseryAssessments} nursery assessment(s)`);
			if (dependents.communications) parts.push(`${dependents.communications} communication(s)`);
			throw new Error(
				`Cannot delete a class with existing history: ${parts.join(", ")}. Remove these first.`,
			);
		}

		await ClassRepository.deleteClass(id);
		logger.info(`Class deleted: ${id}`);
	}

	async getStudentsByClass(classId, filters = {}) {
		logger.info(`Fetching students for class: ${classId}`);
		const students = await ClassRepository.getStudentsByClass(classId, filters);
		return students;
	}

	async assignClassTeacher(classId, teacherId) {
		logger.info(`Assigning class teacher: ${teacherId} to class: ${classId}`);

		const cls = await ClassRepository.findClassById(classId);
		if (!cls) throw new Error("Class not found");

		const teacher = await StaffRepository.findById(teacherId);
		if (!teacher) throw new Error("Teacher not found");

		const updated = await ClassRepository.assignClassTeacher(classId, teacherId);
		logger.info(`Class teacher assigned: ${teacherId} to class: ${classId}`);
		return sanitizeClass(updated);
	}

	async assignAssistantTeacher(classId, teacherId) {
		logger.info(`Assigning assistant teacher: ${teacherId} to class: ${classId}`);

		const cls = await ClassRepository.findClassById(classId);
		if (!cls) throw new Error("Class not found");

		const teacher = await StaffRepository.findById(teacherId);
		if (!teacher) throw new Error("Teacher not found");

		const updated = await ClassRepository.assignAssistantTeacher(classId, teacherId);
		logger.info(`Assistant teacher assigned: ${teacherId} to class: ${classId}`);
		return sanitizeClass(updated);
	}

	async removeClassTeacher(classId) {
		logger.info(`Removing class teacher from class: ${classId}`);

		const cls = await ClassRepository.findClassById(classId);
		if (!cls) throw new Error("Class not found");

		await ClassRepository.removeClassTeacher(classId);
		logger.info(`Class teacher removed from class: ${classId}`);
	}

	async removeAssistantTeacher(classId) {
		logger.info(`Removing assistant teacher from class: ${classId}`);

		const cls = await ClassRepository.findClassById(classId);
		if (!cls) throw new Error("Class not found");

		await ClassRepository.removeAssistantTeacher(classId);
		logger.info(`Assistant teacher removed from class: ${classId}`);
	}
}

module.exports = new AdminClassService();
