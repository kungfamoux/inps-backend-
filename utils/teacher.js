const TeacherStudentRepository = require("../shared/repositories/TeacherStudentRepository");
const logger = require("./logger");

/**
 * CLASS RESOLUTION FOR A TEACHER
 *
 * There is a single TEACHER role, so whether a given teacher is a class
 * (classroom) teacher, a subject teacher, or both is purely a matter of
 * which Class.classTeacherId/assistantTeacherId and SubjectAssignment
 * rows actually reference them — not anything encoded in the role. Both
 * lookups always run and the resulting booleans reflect real assignments.
 *
 * Returns:
 * {
 *   role: string,
 *   class: <class> | null,
 *   classRecord: <class> | null,
 *   subjectAssignment: <subjectAssignment> | null,
 *   isClassTeacher: boolean,
 *   isSubjectTeacher: boolean,
 *   classAssigned: boolean,
 * }
 */
async function resolveTeacherSection(staffId, role) {
	try {
		const { classRecord, subjectAssignment } =
			await TeacherStudentRepository.resolveClassAndSubjectRecords(staffId, {
				isClassTeacher: true,
				isSubjectTeacher: true,
			});

		const subjectClass = subjectAssignment?.class ?? null;

		const isClassTeacher = !!classRecord;
		const isSubjectTeacher = !!subjectAssignment;

		if (!isClassTeacher && !isSubjectTeacher) {
			return null;
		}

		const classData = classRecord ?? subjectClass;

		return {
			role,
			class: classData,
			classSection: classData, // Keep for backward compatibility
			classRecord,
			subjectAssignment,
			isClassTeacher,
			isSubjectTeacher,
			classAssigned: isClassTeacher,
		};
	} catch (err) {
		logger.warn(`Class resolution failed for ${staffId}: ${err.message}`);
		return null;
	}
}

module.exports = { resolveTeacherSection };
