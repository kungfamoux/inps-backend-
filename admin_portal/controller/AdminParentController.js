const AdminParentService = require("../services/AdminParent.service");

const STRIP_FIELDS = new Set([
	"firebaseUid",
	"deletedAt",
	"parentId",
	"studentId",
	"enrollments",
	"sections",
]);

const sanitize = (data) => {
	if (Array.isArray(data)) return data.map(sanitize);

	if (data !== null && typeof data === "object" && !(data instanceof Date)) {
		const clean = {};
		for (const [key, value] of Object.entries(data)) {
			// Always strip enrollments and sections fields at any level
			if (key === 'enrollments' || key === 'sections') {
				continue;
			}
			// Preserve 'class' field as it's the flattened enrollment class info
			if (key === 'class') {
				clean[key] = value;
				continue;
			}
			// Preserve guardian fields
			if (key === 'primaryGuardian' || key === 'secondaryGuardian') {
				clean[key] = value;
				continue;
			}
			// Strip other sensitive fields
			if (STRIP_FIELDS.has(key)) continue;
			clean[key] = sanitize(value);
		}
		return clean;
	}

	return data;
};

const getAllParents = async (req, res, next) => {
	try {
		const { search, page, limit } = req.query;
		const result = await AdminParentService.getAllParents({
			search,
			page,
			limit,
		});
		return res.status(200).json({
			success: true,
			data: sanitize(result.data),
			meta: result.meta,
		});
	} catch (error) {
		return next(error);
	}
};

const getParentById = async (req, res, next) => {
	try {
		const parent = await AdminParentService.getParentById(req.params.id);
		return res.status(200).json({ success: true, data: sanitize(parent) });
	} catch (error) {
		return next(error);
	}
};

const createParent = async (req, res, next) => {
	try {
		const parent = await AdminParentService.createParent(req.body);
		return res.status(201).json({
			success: true,
			message: "Parent created successfully",
			data: sanitize(parent),
		});
	} catch (error) {
		return next(error);
	}
};

const updateParent = async (req, res, next) => {
	try {
		const parent = await AdminParentService.updateParent(req.params.id, req.body);
		return res.status(200).json({
			success: true,
			message: "Parent updated successfully",
			data: sanitize(parent),
		});
	} catch (error) {
		return next(error);
	}
};

const deleteParent = async (req, res, next) => {
	try {
		const result = await AdminParentService.deleteParent(req.params.id);
		return res.status(200).json({
			success: true,
			message: result.message,
		});
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	getAllParents,
	getParentById,
	createParent,
	updateParent,
	deleteParent,
};
