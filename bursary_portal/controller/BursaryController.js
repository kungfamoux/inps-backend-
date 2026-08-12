const BursaryStudentService = require("../services/BursaryStudent.service");
const AdminClassController = require("../../admin_portal/controller/AdminClassController");
const AdminStudentController = require("../../admin_portal/controller/AdminStudentController");
const AdminSchoolConfigController = require("../../admin_portal/controller/AdminSchoolConfigController");
const AdminFinanceService = require("../services/AdminFinance.service");
const { sanitizeQueryParams } = require("../../utils/sanitizers");
const { parsePagination } = require("../../utils/pagination");

const getFeeCollections = async (req, res, next) => {
	try {
		const query = sanitizeQueryParams(req.query);
		const pagination = parsePagination(query);

		const ALLOWED_SORT_FIELDS = ["dueDate", "amount", "createdAt"];

		// Handle status filter - convert comma-separated string to array
		let statusFilter = null;
		if (query.status) {
			statusFilter = query.status.split(',').map(s => s.trim());
		}

		const filters = {
			...pagination,
			status: statusFilter,
			search: query.search || null,
			academicYear: query.academicYear || null,
			term: query.term || null,
			startDate: query.startDate || null,
			endDate: query.endDate || null,
			sortBy: ALLOWED_SORT_FIELDS.includes(query.sortBy)
				? query.sortBy
				: "dueDate",
			order: query.order?.toLowerCase() === "asc" ? "asc" : "desc",
		};

		const result = await BursaryStudentService.getFeeCollections(filters);

		return res.status(200).json({
			success: true,
			message: "Fee collections retrieved successfully",
			data: result.data,
			pagination: result.pagination,
		});
	} catch (error) {
		return next(error);
	}
};
const getStats = async (req, res, next) => {
	try {
		const stats = await BursaryStudentService.getStats();
		return res.status(200).json({ success: true, data: stats });
	} catch (error) {
		return next(error);
	}
};

const generateInvoices = async (req, res, next) => {
	try {
		const { academicYear, term, billIds } = req.body;
		const result = await BursaryStudentService.generateInvoices(
			academicYear,
			term,
			billIds,
		);
		return res.status(201).json({
			success: true,
			message: "Invoices generated successfully",
			data: result,
		});
	} catch (error) {
		return next(error);
	}
};

// Classes endpoint for bursary users
const getAllClasses = async (req, res, next) => {
	try {
		// Reuse the admin class controller method
		return AdminClassController.getAllClasses(req, res, next);
	} catch (error) {
		return next(error);
	}
};

// Students endpoint for bursary users
const getAllStudents = async (req, res, next) => {
	try {
		// Reuse the admin student controller method
		return AdminStudentController.getAllStudents(req, res, next);
	} catch (error) {
		return next(error);
	}
};

// Invoices endpoint for bursary users
const getAllInvoices = async (req, res, next) => {
	try {
		const query = sanitizeQueryParams(req.query);
		const pagination = parsePagination(query);

		const filters = {
			...pagination,
			academicYear: query.academicYear || null,
			term: query.term || null,
			status: query.status || null,
		};

		const result = await AdminFinanceService.getAllInvoices(filters);

		return res.status(200).json({
			success: true,
			message: "Invoices retrieved successfully",
			data: result.data,
			pagination: result.meta,
		});
	} catch (error) {
		return next(error);
	}
};

// Sessions endpoint for bursary users
const getAllSessions = async (req, res, next) => {
	try {
		// Reuse the admin school config controller method
		return AdminSchoolConfigController.getAllSessions(req, res, next);
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	getFeeCollections,
	getStats,
	generateInvoices,
	getAllClasses,
	getAllStudents,
	getAllInvoices,
	getAllSessions,
};
