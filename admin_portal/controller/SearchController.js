// admin_portal/controller/AdminSearchController.js

const SearchService = require("../services/search.service");

const search = async (req, res, next) => {
	try {
		const { q, types } = req.query;

		// types comes in as a comma-separated string e.g. "staff,students"
		const parsedTypes = types
			? types
					.split(",")
					.map((t) => t.trim().toLowerCase())
					.filter(Boolean)
			: [];

		const data = await SearchService.search(q, parsedTypes);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return next(error);
	}
};

const searchStudents = async (req, res, next) => {
	try {
		const { q, page, limit, status, classId, academicYear, term } = req.query;
		
		const filters = {
			page,
			limit,
			status,
			classId,
			academicYear,
			term
		};

		const result = await SearchService.searchStudents(q, filters);
		return res.status(200).json({ success: true, ...result });
	} catch (error) {
		return next(error);
	}
};

const searchStaff = async (req, res, next) => {
	try {
		const { q, page, limit, status, role } = req.query;
		
		const filters = {
			page,
			limit,
			status,
			role
		};

		const result = await SearchService.searchStaff(q, filters);
		return res.status(200).json({ success: true, ...result });
	} catch (error) {
		return next(error);
	}
};

const searchParents = async (req, res, next) => {
	try {
		const { q, page, limit, status } = req.query;
		
		const filters = {
			page,
			limit,
			status
		};

		const result = await SearchService.searchParents(q, filters);
		return res.status(200).json({ success: true, ...result });
	} catch (error) {
		return next(error);
	}
};

const searchClasses = async (req, res, next) => {
	try {
		const { q, page, limit, status, level } = req.query;
		
		const filters = {
			page,
			limit,
			status,
			level
		};

		const result = await SearchService.searchClasses(q, filters);
		return res.status(200).json({ success: true, ...result });
	} catch (error) {
		return next(error);
	}
};

const searchSubjects = async (req, res, next) => {
	try {
		const { q, page, limit, status } = req.query;
		
		const filters = {
			page,
			limit,
			status
		};

		const result = await SearchService.searchSubjects(q, filters);
		return res.status(200).json({ success: true, ...result });
	} catch (error) {
		return next(error);
	}
};

module.exports = { 
	search, 
	searchStudents, 
	searchStaff, 
	searchParents, 
	searchClasses, 
	searchSubjects 
};
