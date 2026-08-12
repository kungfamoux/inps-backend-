const express = require("express");
const router = express.Router();

const {
	getMyAssignedSubjects,
	getMyAssignedClasses,
	getStudentsInAssignedSection,
	getSubjectsForStudent,
	uploadResultsForStudent,
	getStudentsWithResults,
	uploadResult,
	bulkUploadResults,
	recalculateResults,
	getStudentResultSheet,
	addClassTeacherRemark,
	getAllTraits,
	submitBehavioralRatings,
	getBehavioralRatings,
	getAllAssessmentItems,
	submitNurseryAssessments,
	getNurseryAssessments,
	addHeadTeacherRemark,
} = require("../controller/TeacherResultController");

const {
	authenticate,
	requireRoles,
	requireTeacher,
	validate,
} = require("../../middleware");

const {
	assignedSubjectsQuerySchema,
	studentsWithResultsQuerySchema,
	uploadResultSchema,
	bulkUploadResultsSchema,
	sectionStudentsQuerySchema,
	studentSubjectsQuerySchema,
	uploadResultsForStudentSchema,
	recalculateResultsSchema,
	studentResultSheetQuerySchema,
	academicYearTermQuerySchema,
	submitBehavioralRatingsSchema,
	submitNurseryAssessmentsSchema,
	termRemarkSchema,
} = require("../validators/teacherResult.validator");

/**
 * @swagger
 * tags:
 *   name: Teacher - Results
 *   description: Result uploads, remarks, behavioral ratings, and nursery assessments
 */

//  MARK BOOK / ASSIGNED SUBJECTS

/**
 * @swagger
 * /api/teacher/results/subjects:
 *   get:
 *     summary: Get all subjects assigned to the teacher (mark book)
 *     description: |
 *       Returns every subject/section the teacher is assigned to for the term.
 *       A teacher holding both a class-teacher assignment and subject assignments sees all of them.
 *     tags: [Teacher - Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academicYear
 *         required: true
 *         schema: { type: string }
 *         example: "2024/2025"
 *       - in: query
 *         name: term
 *         required: true
 *         schema: { type: string, enum: [FIRST_TERM, SECOND_TERM, THIRD_TERM] }
 *     responses:
 *       200:
 *         description: List of subject assignments with section and class info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - id: "sa_01"
 *                     sectionId: "sec_01"
 *                     subjectId: "sub_01"
 *                     academicYear: "2024/2025"
 *                     term: FIRST_TERM
 *                     status: ACTIVE
 *                     section: { name: "Primary 5A", class: { name: "Primary 5" } }
 *                     subject: { subjectName: Mathematics, subjectCode: MTH }
 *       400:
 *         description: academicYear and term are required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/subjects",
	authenticate,
	requireTeacher,
	validate(assignedSubjectsQuerySchema, "query"),
	getMyAssignedSubjects,
);

//  STUDENT-CENTRIC UPLOAD FLOW
// Pick a class this teacher is assigned to teach in, pick a student, see
// every subject this teacher teaches that student, submit all at once.
// Separate from the mark-sheet flow above (which enters one subject for
// the whole class) — both are supported side by side.

/**
 * @swagger
 * /api/teacher/results/classes:
 *   get:
 *     summary: Get classes/sections the teacher is assigned to teach in
 *     description: |
 *       Distinct sections derived from this teacher's active subject
 *       assignments for the term, each listing the subjects they teach there,
 *       plus the teacher's classroom section (if any) even when they hold no
 *       subject assignment there. Each section is flagged `isClassTeacher` —
 *       true means this teacher may later upload every subject for a student
 *       in that section, not just their own. Use this to build the "pick a
 *       class" step before drilling into a student.
 *     tags: [Teacher - Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academicYear
 *         required: true
 *         schema: { type: string }
 *         example: "2024/2025"
 *       - in: query
 *         name: term
 *         required: true
 *         schema: { type: string, enum: [FIRST_TERM, SECOND_TERM, THIRD_TERM] }
 *     responses:
 *       200:
 *         description: List of assigned sections with the subjects taught in each
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - sectionId: "sec_01"
 *                     sectionName: "Primary 5A"
 *                     className: "Primary 5"
 *                     level: PRIMARY_5
 *                     isClassTeacher: true
 *                     subjects:
 *                       - id: "sub_01"
 *                         subjectName: Mathematics
 *                         subjectCode: MTH
 *       400:
 *         description: academicYear and term are required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/classes",
	authenticate,
	requireTeacher,
	validate(assignedSubjectsQuerySchema, "query"),
	getMyAssignedClasses,
);

/**
 * @swagger
 * /api/teacher/results/section/{sectionId}/students:
 *   get:
 *     summary: Get students in a section this teacher is assigned to
 *     description: |
 *       Requires either an active subject assignment in this section for the
 *       given term, or being the section's class (classroom) teacher.
 *       Use this for the "pick a student" step of the upload flow.
 *     tags: [Teacher - Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: academicYear
 *         required: true
 *         schema: { type: string }
 *         example: "2024/2025"
 *       - in: query
 *         name: term
 *         required: true
 *         schema: { type: string, enum: [FIRST_TERM, SECOND_TERM, THIRD_TERM] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by first name, last name, or admission number
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 30 }
 *     responses:
 *       200:
 *         description: Paginated list of students in the section
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - id: "stu_01"
 *                     admissionNumber: "INPSE-2024-001"
 *                     firstName: "Ada"
 *                     lastName: "Obi"
 *                 meta: { total: 28, page: 1, limit: 30, totalPages: 1 }
 *       400:
 *         description: >
 *           academicYear/term missing, or you are not assigned to this
 *           section for the selected term
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/section/:sectionId/students",
	authenticate,
	requireTeacher,
	validate(sectionStudentsQuerySchema, "query"),
	getStudentsInAssignedSection,
);

/**
 * @swagger
 * /api/teacher/results/section/{sectionId}/student/{studentId}/subjects:
 *   get:
 *     summary: Get subjects for one student, with existing results
 *     description: |
 *       If this teacher is the section's class (classroom) teacher, returns
 *       every subject actively assigned in the section — the class teacher
 *       may upload results for all of them. Otherwise returns only the
 *       subjects this teacher is personally assigned to teach there. Each
 *       subject includes the existing result for the term, if one has been
 *       uploaded, so the form can pre-fill. Use this to render the "enter
 *       subjects for this student" screen after picking a class and a student.
 *     tags: [Teacher - Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: academicYear
 *         required: true
 *         schema: { type: string }
 *         example: "2024/2025"
 *       - in: query
 *         name: term
 *         required: true
 *         schema: { type: string, enum: [FIRST_TERM, SECOND_TERM, THIRD_TERM] }
 *       - in: query
 *         name: termId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: sessionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Subjects for the student (scoped to class-teacher or own-subject access), with any existing result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   isClassTeacher: true
 *                   subjects:
 *                     - subject: { id: "sub_01", subjectName: Mathematics, subjectCode: MTH, isActive: true }
 *                       result: null
 *                     - subject: { id: "sub_02", subjectName: English, subjectCode: ENG, isActive: true }
 *                       result: { subjectId: "sub_02", ca1Score: 25, ca2Score: 27, examScore: 35, total: 87, grade: C, subjectTeacherRemark: "Good effort" }
 *       400:
 *         description: >
 *           Required params missing, or you are not assigned to this section
 *           for the selected term
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/section/:sectionId/student/:studentId/subjects",
	authenticate,
	requireTeacher,
	validate(studentSubjectsQuerySchema, "query"),
	getSubjectsForStudent,
);

/**
 * @swagger
 * /api/teacher/results/student/{studentId}/bulk:
 *   post:
 *     summary: Upload results for one student across multiple subjects at once
 *     description: |
 *       Submits scores for every subject the teacher is entering for this
 *       student in one call, instead of one request per subject. If the
 *       requester is the section's class (classroom) teacher, each subjectId
 *       only needs to be actively assigned to *someone* in the section —
 *       the class teacher may enter marks on behalf of any subject teacher.
 *       Otherwise, each subjectId is independently verified as an active
 *       assignment for this specific teacher in the given section/term — a
 *       subject the teacher doesn't teach cannot be smuggled in alongside a
 *       legitimate one. Same scoring rules as the single-subject endpoint
 *       (CA1 max 30, CA2 max 30, Exam max 40) and does not recalculate
 *       rankings immediately — call /api/teacher/results/recalculate per
 *       subject afterward.
 *     tags: [Teacher - Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sectionId, termId, sessionId, results]
 *             properties:
 *               sectionId: { type: string }
 *               termId:    { type: string }
 *               sessionId: { type: string }
 *               results:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [subjectId, ca1Score, ca2Score, examScore]
 *                   properties:
 *                     subjectId:  { type: string }
 *                     ca1Score:   { type: number, example: 25, description: "Max 30" }
 *                     ca2Score:   { type: number, example: 27, description: "Max 30" }
 *                     examScore:  { type: number, example: 35, description: "Max 40" }
 *                     subjectTeacherRemark: { type: string, example: "Good effort" }
 *     responses:
 *       201:
 *         description: Results uploaded for the student. Rankings are pending recalculation.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "2 result(s) uploaded for student"
 *                 data:
 *                   studentId: "stu_01"
 *                   sectionId: "sec_01"
 *                   uploaded: 2
 *                   results:
 *                     - subjectId: "sub_01"
 *                       scores: { ca1: 25, ca2: 27, exam: 35, total: 87, grade: C }
 *                       rankingsPending: true
 *                     - subjectId: "sub_02"
 *                       scores: { ca1: 28, ca2: 26, exam: 32, total: 86, grade: C }
 *                       rankingsPending: true
 *       400:
 *         description: >
 *           Missing fields, duplicate subjectId in submission, score out of
 *           range, inactive subject, teacher not assigned to this section, or
 *           (for a non-class-teacher) not assigned to one of the submitted
 *           subjects in this section
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
	"/student/:studentId/bulk",
	authenticate,
	requireTeacher,
	validate(uploadResultsForStudentSchema),
	uploadResultsForStudent,
);

/**
 * @swagger
 * /api/teacher/results/section/{sectionId}/subject/{subjectId}/students:
 *   get:
 *     summary: Get students in a section with their existing results for a subject
 *     description: |
 *       Returns all students in the section and their current scores for the subject.
 *       Teacher must be assigned to this subject in this section.
 *     tags: [Teacher - Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: termId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: sessionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Students with their result records (null if not yet uploaded)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - student: { id: "stu_01", admissionNumber: "INPSE-2024-001", firstName: "Ada", lastName: "Obi" }
 *                     result: { id: "res_01", scores: { ca1: 25, ca2: 27, exam: 35, total: 87, grade: C } }
 *                   - student: { id: "stu_02", admissionNumber: "INPSE-2024-002", firstName: "Tomi", lastName: "Ade" }
 *                     result: null
 *       400:
 *         description: termId/sessionId missing, or teacher not assigned to this subject in this section
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/section/:sectionId/subject/:subjectId/students",
	authenticate,
	requireTeacher,
	validate(studentsWithResultsQuerySchema, "query"),
	getStudentsWithResults,
);

//  UPLOAD RESULTS

/**
 * @swagger
 * /api/teacher/results:
 *   post:
 *     summary: Upload a result for one student
 *     description: |
 *       Scores: CA1 max 30, CA2 max 30, Exam max 40 = Total 100.
 *       Grade is auto-computed: A(90+), C(70-89), P(55-69), F(below 55).
 *       This endpoint returns quickly and does not recalculate rankings immediately.
 *       Call /api/teacher/results/recalculate when the teacher is done entering scores.
 *       Teacher must be assigned to the subject for this section.
 *     tags: [Teacher - Results]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, sectionId, subjectId, termId, sessionId, ca1Score, ca2Score, examScore]
 *             properties:
 *               studentId:  { type: string }
 *               sectionId:  { type: string }
 *               subjectId:  { type: string }
 *               termId:     { type: string }
 *               sessionId:  { type: string }
 *               ca1Score:   { type: number, example: 25, description: "Max 30" }
 *               ca2Score:   { type: number, example: 27, description: "Max 30" }
 *               examScore:  { type: number, example: 35, description: "Max 40" }
 *               subjectTeacherRemark: { type: string, example: "Excellent effort" }
 *     responses:
 *       201:
 *         description: Result uploaded. Rankings are pending recalculation.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Result uploaded successfully. Rankings will update after recalculation."
 *                 data:
 *                   id: "res_01"
 *                   studentId: "stu_01"
 *                   subjectId: "sub_01"
 *                   staffId: "staff_01"
 *                   termId: "term_01"
 *                   sessionId: "sess_01"
 *                   scores: { ca1: 25, ca2: 27, exam: 35, total: 87, grade: C }
 *                   subjectTeacherRemark: "Excellent effort"
 *                   rankingsPending: true
 *       400:
 *         description: Score out of range, inactive subject, or teacher not assigned to subject
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
	"/",
	authenticate,
	requireTeacher,
	validate(uploadResultSchema),
	uploadResult,
);

/**
 * @swagger
 * /api/teacher/results/bulk:
 *   post:
 *     summary: Bulk upload results for all students in a section for one subject
 *     description: |
 *       All scores are validated before any are written.
 *       If any score is invalid, nothing is saved.
 *       Positions are recomputed once after the bulk upload completes.
 *     tags: [Teacher - Results]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sectionId, subjectId, termId, sessionId, records]
 *             properties:
 *               sectionId:  { type: string }
 *               subjectId:  { type: string }
 *               termId:     { type: string }
 *               sessionId:  { type: string }
 *               records:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [studentId, ca1Score, ca2Score, examScore]
 *                   properties:
 *                     studentId: { type: string }
 *                     ca1Score:  { type: number, example: 25 }
 *                     ca2Score:  { type: number, example: 27 }
 *                     examScore: { type: number, example: 35 }
 *                     subjectTeacherRemark: { type: string }
 *     responses:
 *       201:
 *         description: Bulk upload complete
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "28 result(s) uploaded successfully"
 *                 data:
 *                   uploaded: 28
 *                   ranking: { status: READY, recalculated: true }
 *       400:
 *         description: Invalid score, inactive subject, or teacher not assigned to subject
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
	"/bulk",
	authenticate,
	requireTeacher,
	validate(bulkUploadResultsSchema),
	bulkUploadResults,
);

/**
 * @swagger
 * /api/teacher/results/recalculate:
 *   post:
 *     summary: Recalculate subject positions, class average, and overall positions
 *     description: |
 *       Use this after single result uploads are complete, for example when a teacher clicks
 *       Finalize or Recalculate. This keeps individual uploads fast while still producing
 *       accurate rankings before viewing, printing, verifying, or publishing results.
 *     tags: [Teacher - Results]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sectionId, subjectId, termId, sessionId]
 *             properties:
 *               sectionId: { type: string }
 *               subjectId: { type: string }
 *               termId:    { type: string }
 *               sessionId: { type: string }
 *     responses:
 *       200:
 *         description: Rankings recalculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Result rankings recalculated successfully"
 *                 data:
 *                   ranking:
 *                     status: READY
 *                     recalculated: true
 *                     subjectResults: [{ studentId: "stu_01", position: 1, total: 87 }]
 *                     overallStudents: [{ studentId: "stu_01", overallPosition: 1 }]
 *                     classAverage: 74.5
 *       400:
 *         description: Missing fields or teacher not assigned to subject
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
	"/recalculate",
	authenticate,
	requireTeacher,
	validate(recalculateResultsSchema),
	recalculateResults,
);

/**
 * @swagger
 * /api/teacher/results/student/{studentId}:
 *   get:
 *     summary: Get a student's full result sheet for a term (all subjects)
 *     description: |
 *       Returns per-subject results plus the student's one overall
 *       classTeacherRemark and headTeacherRemark for the term.
 *       Requires the caller to be the class teacher of one of the student's
 *       active sections, or a subject teacher with an active assignment to
 *       one of them.
 *     tags: [Teacher - Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: termId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: sessionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Per-subject results plus overall term remarks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   results:
 *                     - subject: { subjectName: Mathematics, subjectCode: MTH }
 *                       scores: { ca1: 25, ca2: 27, exam: 35, total: 87, grade: C }
 *                   classTeacherRemark: "Very hardworking student"
 *                   headTeacherRemark: "A diligent student. Keep it up."
 *       400:
 *         description: termId/sessionId missing, or you do not have access to this student's records
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/student/:studentId",
	authenticate,
	requireTeacher,
	validate(studentResultSheetQuerySchema, "query"),
	getStudentResultSheet,
);

//  BEHAVIORAL RATINGS

/**
 * @swagger
 * /api/teacher/results/traits:
 *   get:
 *     summary: Get all behavioral traits (for reference when submitting ratings)
 *     tags: [Teacher - Results]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all traits grouped by domain (SOCIAL_BEHAVIOUR, MANIPULATIVE_SKILLS)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - id: "trait_01"
 *                     name: Punctuality
 *                     domain: SOCIAL_BEHAVIOUR
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/traits", authenticate, requireTeacher, getAllTraits);

/**
 * @swagger
 * /api/teacher/results/behavioral-ratings:
 *   post:
 *     summary: Submit behavioral ratings for a student (requires a class teacher assignment)
 *     description: |
 *       Rates a student on traits like Punctuality, Neatness, Leadership etc.
 *       Score: 1-5 (5=Excellent, 4=Good, 3=Fair, 2=Poor, 1=Very Poor).
 *       Re-submitting updates existing ratings.
 *       The student must be actively enrolled in the caller's own class —
 *       the record is saved against the caller's own section regardless of
 *       the sectionId field's value.
 *     tags: [Teacher - Results]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, sectionId, academicYear, term, ratings]
 *             properties:
 *               studentId:    { type: string }
 *               sectionId:    { type: string, description: "Required by the schema but not used for authorization — the caller's own class section is used instead." }
 *               academicYear: { type: string, example: "2024/2025" }
 *               term:         { type: string, enum: [FIRST_TERM, SECOND_TERM, THIRD_TERM] }
 *               ratings:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [traitId, score]
 *                   properties:
 *                     traitId: { type: string }
 *                     score:   { type: integer, minimum: 1, maximum: 5, example: 4 }
 *     responses:
 *       200:
 *         description: Behavioral ratings saved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "3 behavioral rating(s) saved"
 *                 data: { saved: 3 }
 *       400:
 *         description: Invalid score, missing fields, or student not in your class
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
	"/behavioral-ratings",
	authenticate,
	requireTeacher,
	validate(submitBehavioralRatingsSchema),
	submitBehavioralRatings,
);

/**
 * @swagger
 * /api/teacher/results/behavioral-ratings/student/{studentId}:
 *   get:
 *     summary: Get behavioral ratings for a student in a term
 *     description: |
 *       Requires the caller to be the class teacher of one of the student's
 *       active sections, or a subject teacher with an active assignment to
 *       one of them.
 *     tags: [Teacher - Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: academicYear
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: term
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Behavioral ratings with trait details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - trait: { name: Punctuality, domain: SOCIAL_BEHAVIOUR }
 *                     score: 4
 *       400:
 *         description: academicYear/term missing, or you do not have access to this student's records
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/behavioral-ratings/student/:studentId",
	authenticate,
	requireTeacher,
	validate(academicYearTermQuerySchema, "query"),
	getBehavioralRatings,
);

//  NURSERY ASSESSMENTS

/**
 * @swagger
 * /api/teacher/results/nursery/items:
 *   get:
 *     summary: Get all nursery assessment items (for reference when submitting)
 *     description: Returns all items grouped by category (Reading, Number, Writing, Social, Intellectual).
 *     tags: [Teacher - Results]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All assessment items ordered by category and sort order
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - id: "item_01"
 *                     name: "Recognizes letters A-Z"
 *                     category: Reading
 *                     sortOrder: 1
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/nursery/items",
	authenticate,
	requireTeacher,
	getAllAssessmentItems,
);

/**
 * @swagger
 * /api/teacher/results/nursery/assessments:
 *   post:
 *     summary: Submit nursery assessments for a student (requires a class teacher assignment)
 *     description: |
 *       Rates a nursery student on developmental items using Y/N/S.
 *       Y = Yes, N = No, S = Sometimes.
 *       Re-submitting updates existing ratings.
 *       For Daycare, Pre-Nursery, and Nursery 1-3 only.
 *       The student must be actively enrolled in the caller's own class —
 *       the record is saved against the caller's own section regardless of
 *       the sectionId field's value.
 *     tags: [Teacher - Results]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, sectionId, academicYear, term, assessments]
 *             properties:
 *               studentId:    { type: string }
 *               sectionId:    { type: string, description: "Required by the schema but not used for authorization — the caller's own class section is used instead." }
 *               academicYear: { type: string, example: "2024/2025" }
 *               term:         { type: string, enum: [FIRST_TERM, SECOND_TERM, THIRD_TERM] }
 *               assessments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [itemId, rating]
 *                   properties:
 *                     itemId: { type: string }
 *                     rating: { type: string, enum: [Y, N, S], example: "Y" }
 *     responses:
 *       200:
 *         description: Nursery assessments saved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "5 nursery assessment(s) saved"
 *                 data: { saved: 5 }
 *       400:
 *         description: Invalid rating, missing fields, or student not in your class
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
	"/nursery/assessments",
	authenticate,
	requireTeacher,
	validate(submitNurseryAssessmentsSchema),
	submitNurseryAssessments,
);

/**
 * @swagger
 * /api/teacher/results/nursery/assessments/student/{studentId}:
 *   get:
 *     summary: Get nursery assessments for a student in a term
 *     description: |
 *       Requires the caller to be the class teacher of one of the student's
 *       active sections, or a subject teacher with an active assignment to
 *       one of them.
 *     tags: [Teacher - Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: academicYear
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: term
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Nursery assessments with item descriptions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - item: { name: "Recognizes letters A-Z", category: Reading }
 *                     rating: Y
 *       400:
 *         description: academicYear/term missing, or you do not have access to this student's records
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/nursery/assessments/student/:studentId",
	authenticate,
	requireTeacher,
	validate(academicYearTermQuerySchema, "query"),
	getNurseryAssessments,
);

//  CLASS TEACHER & HEAD TEACHER REMARKS
// One remark per student per term — applies across all subjects for that
// student, not per individual result.

/**
 * @swagger
 * /api/teacher/results/student/{studentId}/class-remark:
 *   patch:
 *     summary: Add one class teacher remark for a student's term
 *     description: |
 *       Applies to the student's overall term result, not a single subject.
 *       Class teachers can only remark on students in their own class.
 *     tags: [Teacher - Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [termId, sessionId, remark]
 *             properties:
 *               termId:    { type: string }
 *               sessionId: { type: string }
 *               remark:    { type: string, example: "Very hardworking student" }
 *     responses:
 *       200:
 *         description: Remark added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Class teacher remark added"
 *                 data: { studentId: "stu_01", termId: "term_01", sessionId: "sess_01", classTeacherRemark: "Very hardworking student" }
 *       400:
 *         description: Student not in your class or missing fields
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch(
	"/student/:studentId/class-remark",
	authenticate,
	requireTeacher,
	validate(termRemarkSchema),
	addClassTeacherRemark,
);

/**
 * @swagger
 * /api/teacher/results/student/{studentId}/head-remark:
 *   patch:
 *     summary: Add one head teacher remark for a student's term
 *     description: |
 *       Applies to the student's overall term result, not a single subject.
 *       Head Teacher only.
 *     tags: [Teacher - Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [termId, sessionId, remark]
 *             properties:
 *               termId:    { type: string }
 *               sessionId: { type: string }
 *               remark:    { type: string, example: "A diligent student. Keep it up." }
 *     responses:
 *       200:
 *         description: Remark added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Head teacher remark added"
 *                 data: { studentId: "stu_01", termId: "term_01", sessionId: "sess_01", headTeacherRemark: "A diligent student. Keep it up." }
 *       400:
 *         description: Not a head teacher or missing fields
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch(
	"/student/:studentId/head-remark",
	authenticate,
	requireRoles(["HEAD_TEACHER"]),
	validate(termRemarkSchema),
	addHeadTeacherRemark,
);

module.exports = router;
