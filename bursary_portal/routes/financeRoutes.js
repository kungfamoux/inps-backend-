const express = require("express");
const router = express.Router();

const {
	createBill,
	getAllBills,
	getBillById,
	updateBill,
	deleteBill,
	getFeeStructureByClass,
	createBookPrice,
	getAllBookPrices,
	updateBookPrice,
	deleteBookPrice,
	addExpense,
	getAllExpenses,
	addIncomeRecord,
	getAllIncomeRecords,
	getFinancialSummary,
	getRecentPayments,
} = require("../controller/AdminFinanceController");
const {
	getFeeCollections,
	getStats,
	generateInvoices,
	getAllClasses,
	getAllStudents,
	getAllInvoices,
	getAllSessions,
} = require("../controller/BursaryController");

const {
	authenticate,
	requireRoles,
	reportLimiter,
} = require("../../middleware");
const { validate } = require("../../middleware/validate");
const {
	createBillSchema,
	updateBillSchema,
	feeStructureByClassQuerySchema,
	getAllBillsQuerySchema,
	addExpenseSchema,
	getAllExpensesQuerySchema,
	addIncomeRecordSchema,
	getAllIncomeRecordsQuerySchema,
	getRecentPaymentsQuerySchema,
} = require("../validators/finance.validator");
const {
	generateInvoicesSchema,
	getFeeCollectionsQuerySchema,
} = require("../validators/bursary.validator");

/**
 * @swagger
 * tags:
 *   name: Finance
 *   description: Fee structure, book prices, expenses, income, and payments
 */

// BILLS / FEE STRUCTURE

/**
 * @swagger
 * /api/finance/bills:
 *   post:
 *     summary: Create a new fee bill
 *     description: |
 *       Each bill is one fee line item e.g. Tuition Fee, Development Fee,
 *       Sports Fee, Library Fee. A class's total fee is the sum of all
 *       bills that apply to it for a given term.
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - amount
 *               - academicYear
 *               - term
 *               - scope
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Tuition Fee"
 *               amount:
 *                 type: number
 *                 example: 45000
 *               academicYear:
 *                 type: string
 *                 example: "2024/2025"
 *               term:
 *                 type: string
 *                 enum: [FIRST_TERM, SECOND_TERM, THIRD_TERM]
 *               isCompulsory:
 *                 type: boolean
 *                 default: true
 *               scope:
 *                 type: string
 *                 enum: [ALL_STUDENTS, BY_CLASS, BY_STUDENT]
 *               intakeType:
 *                 type: string
 *                 enum: [NEW, CONTINUING]
 *                 description: Leave null to apply to both intake types
 *               classIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Required when scope is BY_CLASS
 *     responses:
 *       201:
 *         description: Bill created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Bill created successfully"
 *                 data: { id: "bill_01", name: "Tuition Fee", amount: 45000, academicYear: "2024/2025", term: FIRST_TERM, scope: ALL_STUDENTS, isCompulsory: true }
 *       400:
 *         description: Validation error
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
	"/bills",
	authenticate,
	requireRoles(["ADMIN", "BURSARY"]),
	validate(createBillSchema),
	createBill,
);

/**
 * @swagger
 * /api/finance/bills:
 *   get:
 *     summary: Get all bills (paginated)
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academicYear
 *         schema: { type: string }
 *         example: "2024/2025"
 *       - in: query
 *         name: term
 *         schema:
 *           type: string
 *           enum: [FIRST_TERM, SECOND_TERM, THIRD_TERM]
 *       - in: query
 *         name: scope
 *         schema:
 *           type: string
 *           enum: [ALL_STUDENTS, BY_CLASS, BY_STUDENT]
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated list of bills
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - id: "bill_01"
 *                     name: "Tuition Fee"
 *                     amount: 45000
 *                     academicYear: "2024/2025"
 *                     term: FIRST_TERM
 *                     scope: ALL_STUDENTS
 *                 meta: { total: 4, page: 1, limit: 20, totalPages: 1 }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/bills",
	authenticate,
	requireRoles(["ADMIN", "BURSARY"]),
	validate(getAllBillsQuerySchema, "query"),
	getAllBills,
);

// Static segment before dynamic param
/**
 * @swagger
 * /api/finance/bills/class/{classId}:
 *   get:
 *     summary: Get full fee structure for a class
 *     description: |
 *       Returns all fee line items that apply to a class for a given term,
 *       e.g. Tuition + Development + Sports + Library Fee, plus the total.
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
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
 *         schema:
 *           type: string
 *           enum: [FIRST_TERM, SECOND_TERM, THIRD_TERM]
 *     responses:
 *       200:
 *         description: Fee structure with line items and total
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   bills:
 *                     - id: "bill_01"
 *                       name: "Tuition Fee"
 *                       amount: 45000
 *                   total: 45000
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
	"/bills/class/:classId",
	authenticate,
	requireRoles(["ADMIN", "BURSARY"]),
	validate(feeStructureByClassQuerySchema, "query"),
	getFeeStructureByClass,
);

/**
 * @swagger
 * /api/finance/bills/{billId}:
 *   get:
 *     summary: Get a bill by ID
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: billId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Bill record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data: { id: "bill_01", name: "Tuition Fee", amount: 45000, academicYear: "2024/2025", term: FIRST_TERM }
 *       400:
 *         description: Bill not found
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
	"/bills/:billId",
	authenticate,
	requireRoles(["ADMIN", "BURSARY"]),
	getBillById,
);

/**
 * @swagger
 * /api/finance/bills/{billId}:
 *   patch:
 *     summary: Update a bill
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: billId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:         { type: string }
 *               amount:       { type: number }
 *               isCompulsory: { type: boolean }
 *     responses:
 *       200:
 *         description: Bill updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Bill updated successfully"
 *                 data: { id: "bill_01", name: "Tuition Fee", amount: 47500 }
 *       400:
 *         description: Bill not found
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
	"/bills/:billId",
	authenticate,
	requireRoles(["ADMIN", "BURSARY"]),
	validate(updateBillSchema),
	updateBill,
);

/**
 * @swagger
 * /api/finance/bills/{billId}:
 *   put:
 *     summary: Update a bill (PUT method for frontend compatibility)
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: billId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:         { type: string }
 *               amount:       { type: number }
 *               isCompulsory: { type: boolean }
 *     responses:
 *       200:
 *         description: Bill updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Bill updated successfully"
 *                 data: { id: "bill_01", name: "Tuition Fee", amount: 47500 }
 *       400:
 *         description: Bill not found
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
router.put(
	"/bills/:billId",
	authenticate,
	requireRoles(["ADMIN", "BURSARY"]),
	validate(updateBillSchema),
	updateBill,
);

/**
 * @swagger
 * /api/finance/bills/{billId}:
 *   delete:
 *     summary: Delete a bill
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: billId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Bill deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Bill deleted successfully"
 *       400:
 *         description: Bill not found
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
router.delete(
	"/bills/:billId",
	authenticate,
	requireRoles(["ADMIN", "BURSARY"]),
	deleteBill,
);

// // BOOK PRICES

// /**
//  * @swagger
//  * /api/finance/books:
//  *   post:
//  *     summary: Add a book price
//  *     tags: [Finance]
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - level
//  *               - bookName
//  *               - price
//  *             properties:
//  *               level:
//  *                 type: string
//  *                 enum: [DAYCARE, PRENURSERY, NURSERY_1, NURSERY_2, NURSERY_3, PRIMARY_1, PRIMARY_2, PRIMARY_3, PRIMARY_4, PRIMARY_5, PRIMARY_6]
//  *               bookName:
//  *                 type: string
//  *                 example: "New Oxford Primary Mathematics Book 1"
//  *               price:
//  *                 type: number
//  *                 example: 3500
//  *     responses:
//  *       201:
//  *         description: Book price created
//  *       400:
//  *         description: Validation error
//  *       401:
//  *         description: Unauthorized
//  *       403:
//  *         description: Forbidden — Admin or Bursary role required
//  */
// router.post(
// 	"/books",
// 	authenticate,
// 	requireRoles(["ADMIN", "BURSARY"]),
// 	createBookPrice,
// );

// /**
//  * @swagger
//  * /api/finance/books:
//  *   get:
//  *     summary: Get all book prices (paginated)
//  *     tags: [Finance]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: query
//  *         name: level
//  *         schema:
//  *           type: string
//  *           enum: [DAYCARE, PRENURSERY, NURSERY_1, NURSERY_2, NURSERY_3, PRIMARY_1, PRIMARY_2, PRIMARY_3, PRIMARY_4, PRIMARY_5, PRIMARY_6]
//  *       - in: query
//  *         name: page
//  *         schema: { type: integer, default: 1 }
//  *       - in: query
//  *         name: limit
//  *         schema: { type: integer, default: 20 }
//  *     responses:
//  *       200:
//  *         description: Paginated list of book prices
//  *       401:
//  *         description: Unauthorized
//  *       403:
//  *         description: Forbidden — Admin or Bursary role required
//  */
// router.get(
// 	"/books",
// 	authenticate,
// 	requireRoles(["ADMIN", "BURSARY"]),
// 	getAllBookPrices,
// );

// /**
//  * @swagger
//  * /api/finance/books/{bookId}:
//  *   patch:
//  *     summary: Update a book price
//  *     tags: [Finance]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: bookId
//  *         required: true
//  *         schema: { type: string }
//  *     requestBody:
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               bookName: { type: string }
//  *               price:    { type: number }
//  *               level:    { type: string }
//  *     responses:
//  *       200:
//  *         description: Book price updated
//  *       401:
//  *         description: Unauthorized
//  *       403:
//  *         description: Forbidden — Admin or Bursary role required
//  *       404:
//  *         description: Book price not found
//  */
// router.patch(
// 	"/books/:bookId",
// 	authenticate,
// 	requireRoles(["ADMIN", "BURSARY"]),
// 	updateBookPrice,
// );

// /**
//  * @swagger
//  * /api/finance/books/{bookId}:
//  *   delete:
//  *     summary: Delete a book price
//  *     tags: [Finance]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: bookId
//  *         required: true
//  *         schema: { type: string }
//  *     responses:
//  *       200:
//  *         description: Book price deleted
//  *       401:
//  *         description: Unauthorized
//  *       403:
//  *         description: Forbidden — Admin or Bursary role required
//  *       404:
//  *         description: Book price not found
//  */
// router.delete(
// 	"/books/:bookId",
// 	authenticate,
// 	requireRoles(["ADMIN", "BURSARY"]),
// 	deleteBookPrice,
// );

// EXPENSES

/**
 * @swagger
 * /api/finance/expenses:
 *   post:
 *     summary: Add an expense record
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - description
 *               - category
 *               - amount
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-10-15"
 *               description:
 *                 type: string
 *                 example: "Generator fuel refill"
 *               category:
 *                 type: string
 *                 enum: [SALARIES, UTILITIES, SUPPLIES, MAINTENANCE, OTHER]
 *               amount:
 *                 type: number
 *                 example: 25000
 *     responses:
 *       201:
 *         description: Expense added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Expense added successfully"
 *                 data: { id: "exp_01", date: "2024-10-15T00:00:00.000Z", description: "Generator fuel refill", category: UTILITIES, amount: 25000 }
 *       400:
 *         description: Validation error
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
	"/expenses",
	authenticate,
	requireRoles(["ADMIN", "BURSARY"]),
	validate(addExpenseSchema),
	addExpense,
);

/**
 * @swagger
 * /api/finance/expenses:
 *   get:
 *     summary: Get all expenses (paginated)
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [SALARIES, UTILITIES, SUPPLIES, MAINTENANCE, OTHER]
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated list of expenses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - id: "exp_01"
 *                     date: "2024-10-15T00:00:00.000Z"
 *                     description: "Generator fuel refill"
 *                     category: UTILITIES
 *                     amount: 25000
 *                 meta: { total: 12, page: 1, limit: 20, totalPages: 1 }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/expenses",
	authenticate,
	requireRoles(["ADMIN", "BURSARY"]),
	validate(getAllExpensesQuerySchema, "query"),
	getAllExpenses,
);

// INCOME RECORDS

/**
 * @swagger
 * /api/finance/income:
 *   post:
 *     summary: Add an income record
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - description
 *               - category
 *               - amount
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-10-01"
 *               description:
 *                 type: string
 *                 example: "PTA donation"
 *               category:
 *                 type: string
 *                 enum: [FEES, DONATIONS, BOOKS, LEVY]
 *               amount:
 *                 type: number
 *                 example: 100000
 *     responses:
 *       201:
 *         description: Income record added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Income record added successfully"
 *                 data: { id: "inc_01", date: "2024-10-01T00:00:00.000Z", description: "PTA donation", category: DONATIONS, amount: 100000 }
 *       400:
 *         description: Validation error
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
	"/income",
	authenticate,
	requireRoles(["ADMIN", "BURSARY"]),
	validate(addIncomeRecordSchema),
	addIncomeRecord,
);

/**
 * @swagger
 * /api/finance/income:
 *   get:
 *     summary: Get all income records (paginated)
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [FEES, DONATIONS, BOOKS, LEVY]
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated list of income records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - id: "inc_01"
 *                     date: "2024-10-01T00:00:00.000Z"
 *                     description: "PTA donation"
 *                     category: DONATIONS
 *                     amount: 100000
 *                 meta: { total: 6, page: 1, limit: 20, totalPages: 1 }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/income",
	authenticate,
	requireRoles(["ADMIN", "BURSARY"]),
	validate(getAllIncomeRecordsQuerySchema, "query"),
	getAllIncomeRecords,
);

// FINANCIAL SUMMARY

/**
 * @swagger
 * /api/finance/summary:
 *   get:
 *     summary: Get financial summary
 *     description: |
 *       Returns total income (fee payments + other income),
 *       total expenses, and net balance.
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Financial summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   totalIncome: 1250000
 *                   totalExpenses: 480000
 *                   netBalance: 770000
 *                   totalFeePayments: 1150000
 *                   totalOtherIncome: 100000
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/summary",
	authenticate,
	requireRoles(["ADMIN", "BURSARY"]),
	reportLimiter,
	getFinancialSummary,
);

// PAYMENTS

/**
 * @swagger
 * /api/finance/payments:
 *   get:
 *     summary: Get recent payments (paginated)
 *     description: Shows all payments from Paystack and manual entries.
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED, REFUNDED]
 *         description: Filter by payment status
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated list of payments with student and invoice details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - id: "pay_01"
 *                     amount: 75000
 *                     status: COMPLETED
 *                     student: { admissionNumber: "INPSE-2024-001", firstName: "Ada", lastName: "Obi" }
 *                     invoice: { id: "inv_01", status: PAID }
 *                 meta: { total: 84, page: 1, limit: 20, totalPages: 5 }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/payments",
	authenticate,
	requireRoles(["ADMIN", "BURSARY"]),
	validate(getRecentPaymentsQuerySchema, "query"),
	getRecentPayments,
);

// BURSARY DASHBOARD (stats, collections, debtors, invoice generation)
// Merged from the former /api/bursary router — same resource domain,
// same ["ADMIN", "BURSARY"] role guard, so it lives under one prefix.

/**
 * @swagger
 * /api/finance/stats:
 *   get:
 *     summary: Get bursary dashboard stats
 *     description: |
 *       Returns total receipts, transactions this month, total collected,
 *       total outstanding, and number of students owing.
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bursary stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   totalReceipts: 340
 *                   transactionsThisMonth: 28
 *                   totalCollected: 1150000
 *                   totalOutstanding: 320000
 *                   studentsOwing: 14
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/stats",
	authenticate,
	requireRoles(["ADMIN", "BURSARY"]),
	reportLimiter,
	getStats,
);

/**
 * @swagger
 * /api/finance/collections:
 *   get:
 *     summary: Get invoices (paginated) — also covers the "debtors" view
 *     description: |
 *       Returns invoices with student identity and parent contact fields.
 *       Filter by status to scope the view — e.g. status=PAID for completed
 *       collections, or status=PENDING,PARTIAL,OVERDUE for outstanding debtors.
 *       Omit status to see all invoices regardless of status.
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: >
 *           One or more comma-separated values from PENDING, PARTIAL, PAID, OVERDUE.
 *           Example: status=PENDING,PARTIAL,OVERDUE for the debtors view.
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by invoice number or student first/last name
 *       - in: query
 *         name: academicYear
 *         schema: { type: string }
 *         example: "2024/2025"
 *       - in: query
 *         name: term
 *         schema:
 *           type: string
 *           enum: [FIRST_TERM, SECOND_TERM, THIRD_TERM]
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [paymentDate, amount, createdAt] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated list of invoices with parent contact info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Fee collections retrieved successfully"
 *                 data:
 *                   - id: "inv_01"
 *                     status: PARTIAL
 *                     amount: 45000
 *                     amountPaid: 20000
 *                     student: { admissionNumber: "INPSE-2024-001", firstName: "Ada", lastName: "Obi" }
 *                     parent: { accountEmail: "parent@example.com", accountPhone: "08160000000" }
 *                 pagination: { total: 62, page: 1, limit: 20, totalPages: 4 }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/collections",
	authenticate,
	requireRoles(["ADMIN", "BURSARY"]),
	reportLimiter,
	validate(getFeeCollectionsQuerySchema, "query"),
	getFeeCollections,
);

/**
 * @swagger
 * /api/finance/invoices/generate:
 *   post:
 *     summary: Generate invoices for all eligible students for a term
 *     description: |
 *       Creates invoices from Bills for the given academic year and term.
 *       Skips students who already have an invoice for a given bill (idempotent).
 *       Run this at the start of each term after bills have been created.
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - academicYear
 *               - term
 *             properties:
 *               academicYear:
 *                 type: string
 *                 example: "2024/2025"
 *               term:
 *                 type: string
 *                 enum: [FIRST_TERM, SECOND_TERM, THIRD_TERM]
 *     responses:
 *       201:
 *         description: Invoices generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Invoices generated successfully"
 *                 data:
 *                   academicYear: "2024/2025"
 *                   term: FIRST_TERM
 *                   billsProcessed: 4
 *                   created: 236
 *                   skipped: 12
 *       400:
 *         description: academicYear and term are required or no bills found
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
	"/invoices/generate",
	authenticate,
	requireRoles(["ADMIN", "BURSARY"]),
	validate(generateInvoicesSchema),
	generateInvoices,
);

// INVOICES LIST
/**
 * @swagger
 * /api/finance/invoices:
 *   get:
 *     summary: Get all invoices (for bursary use)
 *     description: Returns paginated list of invoices with filtering support
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: Filter by academic year
 *       - in: query
 *         name: term
 *         schema:
 *           type: string
 *         description: Filter by term
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PARTIAL, PAID, OVERDUE]
 *         description: Filter by invoice status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated list of invoices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - id: "invoice_1"
 *                     invoiceNumber: "INV-2024-001"
 *                     studentId: "student_1"
 *                     student:
 *                       firstName: "John"
 *                       lastName: "Doe"
 *                     amount: 45000
 *                     amountPaid: 0
 *                     balance: 45000
 *                     status: "PENDING"
 *                     dueDate: "2024-10-15"
 *                 pagination:
 *                   total: 100
 *                   page: 1
 *                   limit: 20
 *                   totalPages: 5
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/invoices",
	authenticate,
	requireRoles(["ADMIN", "BURSARY"]),
	getAllInvoices,
);

// CLASSES (for bill scope selection)
/**
 * @swagger
 * /api/finance/classes:
 *   get:
 *     summary: Get all classes (for bursary use)
 *     description: Returns list of all classes for bill scope selection
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of classes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - id: "class_1"
 *                     name: "JSS 1A"
 *                   - id: "class_2"
 *                     name: "JSS 1B"
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
	requireRoles(["ADMIN", "BURSARY"]),
	getAllClasses,
);

// STUDENTS (for bill scope selection)
/**
 * @swagger
 * /api/finance/students:
 *   get:
 *     summary: Get all students (for bursary use)
 *     description: Returns list of students for bill scope selection with search support
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or admission number
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
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
 *                   - id: "student_1"
 *                     firstName: "John"
 *                     lastName: "Doe"
 *                     admissionNumber: "2024/001"
 *                 pagination:
 *                   total: 500
 *                   page: 1
 *                   limit: 20
 *                   totalPages: 25
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/students",
	authenticate,
	requireRoles(["ADMIN", "BURSARY"]),
	getAllStudents,
);

// SESSIONS (for invoice generation dropdown)
/**
 * @swagger
 * /api/finance/sessions:
 *   get:
 *     summary: Get all academic sessions (for bursary use)
 *     description: Returns list of academic sessions for invoice generation
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 data:
 *                   - id: "sess_01"
 *                     session: "2024/2025"
 *                     status: "CURRENT"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
	"/sessions",
	authenticate,
	requireRoles(["ADMIN", "BURSARY"]),
	getAllSessions,
);

module.exports = router;
