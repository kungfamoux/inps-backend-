const TeacherStudentRepository = require("../shared/repositories/TeacherStudentRepository");
const logger = require("./logger");

/**
 * SECTION RESOLUTION FOR A TEACHER
 *
 * There is a single TEACHER role, so whether a given teacher is a class
 * (classroom) teacher, a subject teacher, or both is purely a matter of
 * which Section.classTeacherId/assistantTeacherId and SubjectAssignment
 * rows actually reference them — not anything encoded in the role. Both
 * lookups always run and the resulting booleans reflect real assignments.
 *
 * Returns:
 * {
 *   role: string,
 *   section: <section> | null,
 *   classSection: <section> | null,
 *   subjectSection: <section> | null,
 *   isClassTeacher: boolean,
 *   isSubjectTeacher: boolean,
 *   classAssigned: boolean,
 * }
 */
async function resolveTeacherSection(staffId, role) {
	try {
		const { classSection, subjectAssignment } =
			await TeacherStudentRepository.resolveClassAndSubjectRecords(staffId, {
				isClassTeacher: true,
				isSubjectTeacher: true,
			});

		const subjectSection = subjectAssignment?.section ?? null;

		const isClassTeacher = !!classSection;
		const isSubjectTeacher = !!subjectSection;

		if (!isClassTeacher && !isSubjectTeacher) {
			return null;
		}

		const section = classSection ?? subjectSection;

		return {
			role,
			section,
			classSection,
			subjectSection,
			isClassTeacher,
			isSubjectTeacher,
			classAssigned: isClassTeacher,
		};
	} catch (err) {
		logger.warn(`Section resolution failed for ${staffId}: ${err.message}`);
		return null;
	}
}

module.exports = { resolveTeacherSection };
