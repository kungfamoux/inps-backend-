const TeacherResultRepository = require("../../shared/repositories/TeacherResultRepository");
const TeacherStudentRepository = require("../../shared/repositories/TeacherStudentRepository");
const {
	sanitizeResultResponse,
	cleanOptionalString,
} = require("../../utils/sanitizers");
const logger = require("../../utils/logger");
const { computeGrade } = require("../../utils/grading");

// Score limits from report card: CA1(30) + CA2(30) + Exam(40) = 100
const SCORE_LIMITS = { ca1: 30, ca2: 30, exam: 40 };

const toScore = (value, label, max) => {
	const score = Number(value);

	if (!Number.isFinite(score) || score < 0 || score > max) {
		throw new Error(`${label} score must be between 0 and ${max}`);
	}

	return score;
};

const normalizeScores = ({ ca1Score, ca2Score, examScore }) => {
	const normalized = {
		ca1Score: toScore(ca1Score, "CA1", SCORE_LIMITS.ca1),
		ca2Score: toScore(ca2Score, "CA2", SCORE_LIMITS.ca2),
		examScore: toScore(examScore, "Exam", SCORE_LIMITS.exam),
	};

	const total =
		normalized.ca1Score + normalized.ca2Score + normalized.examScore;

	return {
		...normalized,
		total,
		grade: computeGrade(total),
	};
};

class TeacherResultService {
	// HELPERS

	async _getTerm(termId) {
		return TeacherResultRepository.getTerm(termId);
	}

	async _verifySubjectAssignment(
		staffId,
		classId,
		subjectId,
		academicYear,
		term,
	) {
		const assignment = await TeacherResultRepository.findSubjectAssignment(
			staffId,
			classId,
			subjectId,
			academicYear,
			term,
		);

		if (!assignment) {
			throw new Error(
				"You are not assigned to teach this subject in this class for the selected term",
			);
		}

		return assignment;
	}

	// A teacher can act on a section either because they teach a subject
	// at the class level (which covers all sections in that class) or because
	// they are its class (classroom) teacher — the latter isn't term-scoped,
	// so it's checked independently of academicYear/term.
	async _verifySectionAssignment(staffId, sectionId, academicYear, term) {
		// Get the section's class information
		const section = await TeacherResultRepository.findSectionSummary(sectionId);
		if (!section) {
			throw new Error("Section not found");
		}

		const [hasSubject, isClassTeacher] = await Promise.all([
			TeacherResultRepository.hasAssignmentInClass(
				staffId,
				section.classId,
				academicYear,
				term,
			),
			TeacherResultRepository.isSectionClassTeacher(staffId, sectionId),
		]);

		if (!hasSubject && !isClassTeacher) {
			throw new Error(
				"You are not assigned to this section for the selected term",
			);
		}

		return { isClassTeacher, classId: section.classId };
	}

	async _verifyClassTeacher(staffId) {
		const classRecord =
			await TeacherResultRepository.findClassByTeacher(staffId);

		if (!classRecord) {
			throw new Error("You are not assigned as a class teacher to any class");
		}

		return classRecord;
	}

	async _verifyHeadTeacher(staffId) {
		const staff = await TeacherResultRepository.findStaffById(staffId);

		if (!staff) throw new Error("Staff member not found");
		if (staff.role !== "HEAD_TEACHER") {
			throw new Error("Only the Head Teacher can add a head teacher remark");
		}

		return staff;
	}

	// Guard — inactive subjects cannot receive result uploads
	async _verifySubjectActive(subjectId) {
		const subject = await TeacherResultRepository.findSubjectById(subjectId);
		if (!subject) throw new Error("Subject not found");
		if (!subject.isActive) {
			throw new Error(
				"Cannot upload results for an inactive subject. Contact the admin.",
			);
		}
		return subject;
	}

	// SUBJECT TEACHER - UPLOAD RESULTS

	async getMyAssignedSubjects(staffId, academicYear, term) {
		if (!academicYear || !term) {
			throw new Error("academicYear and term are required");
		}

		logger.info(
			`Fetching assigned subjects for teacher: ${staffId} - ${academicYear} ${term}`,
		);

		const assignments = await TeacherResultRepository.findAssignedSubjects(
			staffId,
			academicYear,
			term,
		);

		logger.info(`Found ${assignments.length} subject assignment(s)`);
		return assignments;
	}

	// STUDENT-CENTRIC UPLOAD FLOW
	// Pick a class the teacher is assigned to teach in → pick a student →
	// see every subject this teacher teaches that student → submit all at once.
	// Deliberately separate from the subject-centric mark-sheet flow above
	// (getMyAssignedSubjects / getStudentsWithResults / uploadResult /
	// bulkUploadResults) rather than replacing it — that flow is still the
	// right shape for "enter one subject for the whole class."

	async getMyAssignedClasses(staffId, academicYear, term) {
		if (!academicYear || !term) {
			throw new Error("academicYear and term are required");
		}

		const [assignments, classroom] = await Promise.all([
			TeacherResultRepository.findAssignedSections(staffId, academicYear, term),
			TeacherResultRepository.findClassByTeacher(staffId),
		]);

		const bySection = new Map();
		for (const a of assignments) {
			if (!bySection.has(a.sectionId)) {
				bySection.set(a.sectionId, {
					sectionId: a.sectionId,
					sectionName: a.section.name,
					className: a.section.class.name,
					level: a.section.class.level,
					isClassTeacher: false,
					subjects: [],
				});
			}
			bySection.get(a.sectionId).subjects.push({
				id: a.subject.id,
				subjectName: a.subject.subjectName,
				subjectCode: a.subject.subjectCode,
			});
		}

		// Surface the teacher's classroom section even when they hold no
		// subject assignment there, so a class teacher can still reach the
		// "upload all subjects for this student" flow for their own class.
		if (classroom) {
			if (bySection.has(classroom.id)) {
				bySection.get(classroom.id).isClassTeacher = true;
			} else {
				const section = await TeacherResultRepository.findSectionSummary(
					classroom.id,
				);
				if (section) {
					bySection.set(section.id, {
						sectionId: section.id,
						sectionName: section.name,
						className: section.class.name,
						level: section.class.level,
						isClassTeacher: true,
						subjects: [],
					});
				}
			}
		}

		return [...bySection.values()];
	}

	async getStudentsInAssignedSection(staffId, sectionId, filters = {}) {
		const { academicYear, term } = filters;
		if (!academicYear || !term) {
			throw new Error("academicYear and term are required");
		}

		await this._verifySectionAssignment(staffId, sectionId, academicYear, term);

		return TeacherStudentRepository.findStudentsInSection(sectionId, filters);
	}

	async getSubjectsForStudent(staffId, sectionId, studentId, filters = {}) {
		const { academicYear, term, termId, sessionId } = filters;
		if (!academicYear || !term || !termId || !sessionId) {
			throw new Error("academicYear, term, termId, and sessionId are required");
		}

		const { isClassTeacher, classId } = await this._verifySectionAssignment(
			staffId,
			sectionId,
			academicYear,
			term,
		);

		const subjects = await TeacherResultRepository.findSubjectsForStudentByTeacher(
			staffId,
			classId,
			studentId,
			academicYear,
			term,
			termId,
			sessionId,
			isClassTeacher,
		);

		return { isClassTeacher, subjects };
	}

	// Uploads scores for one student across every subject submitted in a
	// single call. A class (classroom) teacher for the section may submit any
	// subject actively assigned there, since their remit covers the whole
	// student; any other teacher may only submit subjects they are personally
	// assigned to teach in this section/term — a teacher cannot smuggle in a
	// subject they don't teach just because one other subject in the same
	// request is legitimate.
	async uploadResultsForStudent(staffId, studentId, data) {
		const { sectionId, termId, sessionId, results } = data;

		if (!sectionId || !termId || !sessionId || !results?.length) {
			throw new Error("Fill all required fields");
		}

		const subjectIds = results.map((r) => r.subjectId);
		if (new Set(subjectIds).size !== subjectIds.length) {
			throw new Error("Duplicate subjectId in submission");
		}

		const term = await this._getTerm(termId);
		const { isClassTeacher, classId } = await this._verifySectionAssignment(
			staffId,
			sectionId,
			term.session.session,
			term.term,
		);

		const records = [];
		for (const entry of results) {
			await this._verifySubjectActive(entry.subjectId);

			if (isClassTeacher) {
				const assignment =
					await TeacherResultRepository.findAnySubjectAssignmentInClass(
						classId,
						entry.subjectId,
						term.session.session,
						term.term,
					);
				if (!assignment) {
					throw new Error(
						"This subject is not assigned to this section for the selected term",
					);
				}
			} else {
				await this._verifySubjectAssignment(
					staffId,
					classId,
					entry.subjectId,
					term.session.session,
					term.term,
				);
			}

			records.push({
				studentId,
				subjectId: entry.subjectId,
				staffId,
				termId,
				sessionId,
				...normalizeScores(entry),
				subjectTeacherRemark: cleanOptionalString(entry.subjectTeacherRemark) ?? null,
			});
		}

		logger.info(
			`Uploading ${records.length} subject result(s) for student: ${studentId}`,
		);

		const uploaded = await TeacherResultRepository.bulkUpsertResults(records);

		return {
			studentId,
			sectionId,
			uploaded: uploaded.length,
			results: uploaded.map((r) =>
				sanitizeResultResponse(r, { rankingsPending: true }),
			),
		};
	}

	async getStudentsWithResults(
		staffId,
		sectionId,
		subjectId,
		termId,
		sessionId,
	) {
		logger.info(
			`Fetching students with results - section: ${sectionId}, subject: ${subjectId}`,
		);

		const term = await this._getTerm(termId);

		await this._verifySubjectAssignment(
			staffId,
			sectionId,
			subjectId,
			term.session.session,
			term.term,
		);

		return TeacherResultRepository.findStudentsWithResults(
			sectionId,
			subjectId,
			termId,
			sessionId,
		);
	}

	// Upload scores for one student.
	// subjectTeacherRemark is optional — only the subject teacher can set it here.
	async uploadResult(staffId, data) {
		const {
			studentId,
			sectionId,
			subjectId,
			termId,
			sessionId,
			subjectTeacherRemark,
		} = data;

		if (!studentId || !sectionId || !subjectId || !termId || !sessionId) {
			throw new Error("Fill all required fields");
		}

		const scores = normalizeScores(data);

		// Guard — inactive subjects cannot receive result uploads
		await this._verifySubjectActive(subjectId);

		const term = await this._getTerm(termId);

		await this._verifySubjectAssignment(
			staffId,
			sectionId,
			subjectId,
			term.session.session,
			term.term,
		);

		logger.info(
			`Uploading result - student: ${studentId}, subject: ${subjectId}, total: ${scores.total}`,
		);

		const result = await TeacherResultRepository.upsertResult({
			studentId,
			subjectId,
			staffId,
			termId,
			sessionId,
			...scores,
			subjectTeacherRemark: cleanOptionalString(subjectTeacherRemark),
		});

		logger.info(`Result uploaded - id: ${result.id}`);
		return sanitizeResultResponse(result, { rankingsPending: true });
	}

	// Bulk upload — subjectTeacherRemark per student is optional.
	async bulkUploadResults(staffId, data) {
		const { sectionId, subjectId, termId, sessionId, records } = data;

		if (!sectionId || !subjectId || !termId || !sessionId || !records?.length) {
			throw new Error("Fill all required fields");
		}

		// Guard — inactive subjects cannot receive result uploads
		await this._verifySubjectActive(subjectId);

		const term = await this._getTerm(termId);

		await this._verifySubjectAssignment(
			staffId,
			sectionId,
			subjectId,
			term.session.session,
			term.term,
		);

		logger.info(
			`Bulk uploading results - subject: ${subjectId}, section: ${sectionId}, records: ${records.length}`,
		);

		const resultRecords = records.map((record) => ({
			studentId: record.studentId,
			subjectId,
			staffId,
			termId,
			sessionId,
			...normalizeScores(record),
			subjectTeacherRemark:
				cleanOptionalString(record.subjectTeacherRemark) ?? null,
		}));

		const results =
			await TeacherResultRepository.bulkUpsertResults(resultRecords);

		await TeacherResultRepository.computePositions(
			sectionId,
			subjectId,
			termId,
			sessionId,
		);
		await TeacherResultRepository.computeClassAverage(
			sectionId,
			subjectId,
			termId,
			sessionId,
		);
		await TeacherResultRepository.computeOverallPositions(
			sectionId,
			termId,
			sessionId,
		);

		logger.info(`Bulk upload complete - ${results.length} result(s) saved`);
		return {
			uploaded: results.length,
			ranking: {
				status: "READY",
				recalculated: true,
			},
		};
	}

	async recalculateResults(staffId, data) {
		const { sectionId, subjectId, termId, sessionId } = data;

		if (!sectionId || !subjectId || !termId || !sessionId) {
			throw new Error("Fill all required fields");
		}

		const term = await this._getTerm(termId);

		await this._verifySubjectAssignment(
			staffId,
			sectionId,
			subjectId,
			term.session.session,
			term.term,
		);

		const [positioned, classAverage, overallPositioned] = await Promise.all([
			TeacherResultRepository.computePositions(
				classId,
				subjectId,
				termId,
				sessionId,
			),
			TeacherResultRepository.computeClassAverage(
				classId,
				subjectId,
				termId,
				sessionId,
			),
			TeacherResultRepository.computeOverallPositions(
				classId,
				termId,
				sessionId,
			),
		]);

		return {
			ranking: {
				status: "READY",
				recalculated: true,
				subjectResults: positioned,
				overallStudents: overallPositioned,
				classAverage,
			},
		};
	}

	async getStudentResultSheet(staffId, studentId, termId, sessionId) {
		logger.info(`Fetching result sheet for student: ${studentId}`);

		const allowed = await TeacherResultRepository.hasTeachingRelationship(
			staffId,
			studentId,
		);
		if (!allowed) {
			throw new Error("You do not have access to this student's records");
		}

		const [results, termRemark] = await Promise.all([
			TeacherResultRepository.findStudentResultSheet(
				studentId,
				termId,
				sessionId,
			),
			TeacherResultRepository.findTermRemark(studentId, termId, sessionId),
		]);

		return {
			results,
			classTeacherRemark: termRemark?.classTeacherRemark ?? null,
			headTeacherRemark: termRemark?.headTeacherRemark ?? null,
		};
	}

	// CLASS TEACHER - REMARKS
	// One remark per student per term — applies across all subjects.

	async addClassTeacherRemark(staffId, studentId, termId, sessionId, remark) {
		if (!remark) throw new Error("remark is required");

		logger.info(
			`Class teacher ${staffId} adding remark for student: ${studentId}`,
		);

		const student =
			await TeacherResultRepository.findStudentWithEnrollments(studentId);

		if (!student) throw new Error("Student not found");

		const classRecord = await this._verifyClassTeacher(staffId);
		const inClass = student.enrollments.some(
			(enrollment) =>
				enrollment.sectionId === classRecord.id &&
				enrollment.status === "ACTIVE",
		);

		if (!inClass) throw new Error("This student is not in your class");

		const updated = await TeacherResultRepository.upsertClassTeacherRemark(
			studentId,
			termId,
			sessionId,
			remark,
		);

		logger.info(`Class teacher remark added for student: ${studentId}`);
		return updated;
	}

	// CLASS TEACHER - BEHAVIORAL RATINGS (Primary)

	async getAllTraits() {
		logger.info("Fetching all behavioral traits");
		return TeacherResultRepository.findAllTraits();
	}

	async submitBehavioralRatings(staffId, data) {
		const { studentId, academicYear, term, ratings } = data;

		if (!studentId || !academicYear || !term || !ratings?.length) {
			throw new Error("Fill all required fields");
		}

		const classRecord = await this._verifyClassTeacher(staffId);
		const student =
			await TeacherResultRepository.findStudentWithEnrollments(studentId);

		if (!student) throw new Error("Student not found");

		const inClass = student.enrollments.some(
			(enrollment) =>
				enrollment.sectionId === classRecord.id &&
				enrollment.status === "ACTIVE",
		);

		if (!inClass) throw new Error("This student is not in your class");

		logger.info(
			`Submitting behavioral ratings for student: ${studentId} - ${ratings.length} trait(s)`,
		);

		const records = ratings.map((rating) => {
			const score = Number(rating.score);

			if (!Number.isInteger(score) || score < 1 || score > 5) {
				throw new Error(
					`Score for trait ${rating.traitId} must be between 1 and 5`,
				);
			}

			return {
				studentId,
				sectionId: classRecord.id,
				traitId: rating.traitId,
				staffId,
				academicYear,
				term,
				score,
			};
		});

		const results =
			await TeacherResultRepository.bulkUpsertBehavioralRatings(records);

		logger.info(`${results.length} behavioral rating(s) saved`);
		return { saved: results.length };
	}

	async getBehavioralRatings(staffId, studentId, academicYear, term) {
		logger.info(`Fetching behavioral ratings for student: ${studentId}`);

		const allowed = await TeacherResultRepository.hasTeachingRelationship(
			staffId,
			studentId,
		);
		if (!allowed) {
			throw new Error("You do not have access to this student's records");
		}

		return TeacherResultRepository.findBehavioralRatings(
			studentId,
			academicYear,
			term,
		);
	}

	// CLASS TEACHER - NURSERY ASSESSMENTS (Y/N/S)

	async getAllAssessmentItems() {
		logger.info("Fetching all nursery assessment items");
		return TeacherResultRepository.findAllAssessmentItems();
	}

	async submitNurseryAssessments(staffId, data) {
		const { studentId, academicYear, term, assessments } = data;

		if (!studentId || !academicYear || !term || !assessments?.length) {
			throw new Error("Fill all required fields");
		}

		const classRecord = await this._verifyClassTeacher(staffId);
		const student =
			await TeacherResultRepository.findStudentWithEnrollments(studentId);

		if (!student) throw new Error("Student not found");

		const inClass = student.enrollments.some(
			(enrollment) =>
				enrollment.sectionId === classRecord.id &&
				enrollment.status === "ACTIVE",
		);

		if (!inClass) throw new Error("This student is not in your class");

		logger.info(
			`Submitting nursery assessments for student: ${studentId} - ${assessments.length} item(s)`,
		);

		const validRatings = new Set(["Y", "N", "S"]);
		const records = assessments.map((assessment) => {
			if (!validRatings.has(assessment.rating)) {
				throw new Error(
					`Invalid rating "${assessment.rating}" for item ${assessment.itemId}. Must be Y, N, or S`,
				);
			}

			return {
				studentId,
				sectionId: classRecord.id,
				itemId: assessment.itemId,
				staffId,
				academicYear,
				term,
				rating: assessment.rating,
			};
		});

		const results =
			await TeacherResultRepository.bulkUpsertNurseryAssessments(records);

		logger.info(`${results.length} nursery assessment(s) saved`);
		return { saved: results.length };
	}

	async getNurseryAssessments(staffId, studentId, academicYear, term) {
		logger.info(`Fetching nursery assessments for student: ${studentId}`);

		const allowed = await TeacherResultRepository.hasTeachingRelationship(
			staffId,
			studentId,
		);
		if (!allowed) {
			throw new Error("You do not have access to this student's records");
		}

		return TeacherResultRepository.findNurseryAssessments(
			studentId,
			academicYear,
			term,
		);
	}

	// HEAD TEACHER - REMARKS
	// Only the head teacher can write headTeacherRemark.
	// One remark per student per term — added after subject teachers upload
	// scores and the class teacher fills behavioral/nursery sections, before
	// results are verified and released to parents.

	async addHeadTeacherRemark(staffId, studentId, termId, sessionId, remark) {
		if (!remark) throw new Error("remark is required");

		await this._verifyHeadTeacher(staffId);

		logger.info(
			`Head teacher ${staffId} adding remark for student: ${studentId}`,
		);

		const updated = await TeacherResultRepository.upsertHeadTeacherRemark(
			studentId,
			termId,
			sessionId,
			remark,
		);

		logger.info(`Head teacher remark added for student: ${studentId}`);
		return updated;
	}
}

module.exports = new TeacherResultService();
