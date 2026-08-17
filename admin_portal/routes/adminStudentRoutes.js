const express = require("express");
const router = express.Router();

const {
	createStudent,
	getAllStudents,
	getStudentByAdmissionNumber,
	updateStudent,
	deleteStudent,
	getStudentResults,
	getAllResults,
	getStudentSubjects,
	getResultsBySubject,
} = require("../controller/AdminStudentController");

const { authenticate, requireAdmin, validate } = require("../../middleware");

const { upload } = require("../../utils/uploadToCloudinary");

const {
	createStudentSchema,
	getAllStudentsQuerySchema,
	getAllResultsQuerySchema,
	getResultsBySubjectQuerySchema,
	getStudentResultsQuerySchema,
	updateStudentSchema,
} = require("../validators/adminStudent.validator");

const uploadStudentFiles = upload.fields([
	{ name: "passportPhoto", maxCount: 1 },
	{ name: "admissionDocs", maxCount: 5 },
]);

/**
 * @swagger
 * tags:
 *   name: Admin - Students
 *   description: Student registration and management (Admin only)
 */

/**
 * @swagger
 * /api/admin/students:
 *   post:
 *     summary: Register a new student
 *     description: |
 *       Multipart form-data request.
 *       - Upload passport photo as `passportPhoto` (max 1 file).
 *       - Upload supporting documents as `admissionDocs` (max 5 files).
 *       - `parentData` must be a JSON string.
 *       - Creates or reuses a Parent account using accountEmail.
 *       - Also provisions Firebase authentication automatically.
 *     tags: [Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - gender
 *               - dateOfBirth
 *               - admissionDate
 *               - accountEmail
 *               - accountPhone
 *               - parentData
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE]
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               nationality:
 *                 type: string
 *               state:
 *                 type: string
 *               lga:
 *                 type: string
 *               religion:
 *                 type: string
 *               healthInfo:
 *                 type: string
 *               sportHouse:
 *                 type: string
 *               address:
 *                 type: string
 *               intakeType:
 *                 type: string
 *                 enum: [NEW, CONTINUING]
 *               admissionDate:
 *                 type: string
 *                 format: date
 *               graduationDate:
 *                  type: string
 *                  format: date
 *               accountEmail:
 *                 type: string
 *                 format: email
 *               accountPhone:
 *                 type: string
 *               parentData:
 *                 type: string
 *                 description: JSON string of parent details (father/mother info, address, marital status)
 *               passportPhoto:
 *                 type: string
 *                 format: binary
 *                 description: Student passport photograph (max 1 file)
 *               admissionDocs:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 5
 *                 description: Supporting admission documents (max 5 files)
 *     responses:
 *       201:
 *         description: Student registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Student registered successfully"
 *                 data:
 *                   admissionNumber: "INPSE-2024-001"
 *                   firstName: "Ada"
 *                   lastName: "Obi"
 *                   gender: FEMALE
 *                   dateOfBirth: "2015-03-10T00:00:00.000Z"
 *                   status: ACTIVE
 *                   intakeType: NEW
 *                   admissionDate: "2024-09-09T00:00:00.000Z"
 *                   parent: { accountEmail: "parent@example.com", accountPhone: "08160000000" }
 *       400:
 *         description: Validation error or invalid parentData JSON
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
	requireAdmin,
	uploadStudentFiles,
	validate(createStudentSchema),
	createStudent,
);

/**
 * @swagger
 * /api/admin/students:
 *   get:
 *     summary: Get all students (paginated)
 *     tags: [Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, GRADUATED, WITHDRAWN]
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated list of students
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - admissionNumber: "INPSE-2024-001"
 *                     firstName: "Ada"
 *                     lastName: "Obi"
 *                     status: ACTIVE
 *                 meta: { total: 240, page: 1, limit: 20, totalPages: 12 }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/",
	authenticate,
	requireAdmin,
	validate(getAllStudentsQuerySchema, "query"),
	getAllStudents,
);

/**
 * @swagger
 * /api/admin/students/results:
 *   get:
 *     summary: Get all results across all students (paginated)
 *     tags: [Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sessionId
 *         schema: { type: string }
 *       - in: query
 *         name: termId
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - student: { admissionNumber: "INPSE-2024-001", firstName: "Ada", lastName: "Obi" }
 *                     subject: { subjectName: Mathematics, subjectCode: MTH }
 *                     scores: { ca1: 25, ca2: 27, exam: 35, total: 87, grade: C }
 *                 meta: { total: 340, page: 1, limit: 20, totalPages: 17 }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/results",
	authenticate,
	requireAdmin,
	validate(getAllResultsQuerySchema, "query"),
	getAllResults,
);

/**
 * @swagger
 * /api/admin/students/results/subject/{subjectCode}:
 *   get:
 *     summary: Get all results for a subject
 *     tags: [Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subjectCode
 *         required: true
 *         schema: { type: string }
 *         example: MTH
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [PRIMARY_1, PRIMARY_2, PRIMARY_3, PRIMARY_4, PRIMARY_5, PRIMARY_6]
 *       - in: query
 *         name: sessionId
 *         schema: { type: string }
 *       - in: query
 *         name: termId
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Subject results with student details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 subject: { subjectName: Mathematics, subjectCode: MTH }
 *                 data:
 *                   - student: { admissionNumber: "INPSE-2024-001", firstName: "Ada", lastName: "Obi" }
 *                     scores: { ca1: 25, ca2: 27, exam: 35, total: 87, grade: C }
 *                 meta: { total: 30, page: 1, limit: 20, totalPages: 2 }
 *       400:
 *         description: Subject not found
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
	"/results/subject/:subjectCode",
	authenticate,
	requireAdmin,
	validate(getResultsBySubjectQuerySchema, "query"),
	getResultsBySubject,
);

/**
 * @swagger
 * /api/admin/students/{admissionNumber}:
 *   get:
 *     summary: Get a student by admission number
 *     tags: [Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: admissionNumber
 *         required: true
 *         schema: { type: string }
 *         example: INPSE-2024-001
 *     responses:
 *       200:
 *         description: Student record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   admissionNumber: "INPSE-2024-001"
 *                   firstName: "Ada"
 *                   lastName: "Obi"
 *                   gender: FEMALE
 *                   status: ACTIVE
 *                   parent: { accountEmail: "parent@example.com", accountPhone: "08160000000" }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/:admissionNumber",
	authenticate,
	requireAdmin,
	getStudentByAdmissionNumber,
);

/**
 * @swagger
 * /api/admin/students/{admissionNumber}:
 *   patch:
 *     summary: Update a student record
 *     description: admissionNumber and parentId cannot be changed via this endpoint.
 *     tags: [Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: admissionNumber
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Student updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Student updated successfully"
 *                 data: { admissionNumber: "INPSE-2024-001", firstName: "Ada", lastName: "Obi", status: ACTIVE }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch(
	"/:admissionNumber",
	authenticate,
	requireAdmin,
	validate(updateStudentSchema),
	updateStudent,
);

/**
 * @swagger
 * /api/admin/students/{admissionNumber}:
 *   delete:
 *     summary: Hard-delete a student record and release admission number for reuse
 *     description: |
 *       Permanently deletes the student record and releases their admission number
 *       back to the admission number pool for reuse by new students. An audit trail
 *       is maintained tracking which staff member released the number and when.
 *     tags: [Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: admissionNumber
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Student deleted successfully and admission number released
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Student record deleted successfully"
 *       400:
 *         description: Student not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete("/:admissionNumber", authenticate, requireAdmin, deleteStudent);

/**
 * @swagger
 * /api/admin/students/{admissionNumber}/results:
 *   get:
 *     summary: Get results for a student
 *     description: |
 *       Defaults to all results across every term and session.
 *       Pass `filter=term` with `termId` and `sessionId` to scope to a specific term.
 *     tags: [Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: admissionNumber
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [all, term]
 *           default: all
 *       - in: query
 *         name: termId
 *         schema: { type: string }
 *         description: Required when filter=term
 *       - in: query
 *         name: sessionId
 *         schema: { type: string }
 *         description: Required when filter=term
 *     responses:
 *       200:
 *         description: Student results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - subject: { subjectName: Mathematics, subjectCode: MTH }
 *                     scores: { ca1: 25, ca2: 27, exam: 35, total: 87, grade: C }
 *       400:
 *         description: Invalid filter or missing termId/sessionId
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/:admissionNumber/results",
	authenticate,
	requireAdmin,
	validate(getStudentResultsQuerySchema, "query"),
	getStudentResults,
);

/**
 * @swagger
 * /api/admin/students/{admissionNumber}/subjects:
 *   get:
 *     summary: Get all subjects for a student based on their current enrollment
 *     tags: [Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: admissionNumber
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of subjects for the student's current section
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - subjectName: Mathematics
 *                     subjectCode: MTH
 *       400:
 *         description: No active enrollment or section assignment
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/:admissionNumber/subjects",
	authenticate,
	requireAdmin,
	getStudentSubjects,
);

module.exports = router;
