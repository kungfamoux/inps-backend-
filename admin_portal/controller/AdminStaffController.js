const AdminStaffService = require("../services/AdminStaff.service");

const createStaffAccount = async (req, res, next) => {
	try {
		const staff = await AdminStaffService.createStaffAccount(req.body);
		return res.status(201).json({
			success: true,
			message: "Staff account created successfully",
			data: staff,
		});
	} catch (error) {
		return next(error);
	}
};

const getAllStaff = async (req, res, next) => {
	try {
		const { role, type, page, limit, includeDeleted } = req.query;

		const result = await AdminStaffService.getAllStaff({
			role,
			type,
			page,
			limit,
			includeDeleted,
		});

		return res.status(200).json({ success: true, ...result });
	} catch (error) {
		return next(error);
	}
};
const getActiveStaff = async (req, res, next) => {
	try {
		const { role, type, page, limit } = req.query;
		const result = await AdminStaffService.getActiveStaff({
			role,
			type,
			page,
			limit,
		});
		return res.status(200).json({ success: true, ...result });
	} catch (error) {
		return next(error);
	}
};

const getStaffById = async (req, res, next) => {
	try {
		const staff = await AdminStaffService.getStaffById(req.params.staffId);
		return res.status(200).json({ success: true, data: staff });
	} catch (error) {
		return next(error);
	}
};

const updateStaff = async (req, res, next) => {
	try {
		const staff = await AdminStaffService.updateStaff(
			req.params.staffId,
			req.body,
		);
		return res.status(200).json({
			success: true,
			message: "Staff updated successfully",
			data: staff,
		});
	} catch (error) {
		return next(error);
	}
};

const resetPasswordToDefault = async (req, res, next) => {
	try {
		const performedByName = req.staff
			? `${req.staff.firstName ?? ""} ${req.staff.lastName ?? ""}`.trim()
			: undefined;
		await AdminStaffService.resetPasswordToDefault(
			req.params.staffId,
			performedByName,
		);
		return res.status(200).json({
			success: true,
			message: "Password reset to default (phone number) successfully",
		});
	} catch (error) {
		return next(error);
	}
};

const deactivateStaffAccount = async (req, res, next) => {
	try {
		await AdminStaffService.deactivateStaffAccount(req.params.staffId);
		return res.status(200).json({
			success: true,
			message: "Staff account deactivated successfully",
		});
	} catch (error) {
		return next(error);
	}
};

const reactivateStaffAccount = async (req, res, next) => {
	try {
		await AdminStaffService.reactivateStaffAccount(req.params.staffId);
		return res.status(200).json({
			success: true,
			message: "Staff account reactivated successfully",
		});
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	getActiveStaff,
	createStaffAccount,
	getAllStaff,

	getStaffById,
	updateStaff,
	resetPasswordToDefault,
	deactivateStaffAccount,
	reactivateStaffAccount,
};
