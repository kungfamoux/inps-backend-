const AdminCommunicationService = require("../services/AdminCommunication.service");

const create = async (req, res, next) => {
	try {
		const communication = await AdminCommunicationService.create(req.body);
		res.status(201).json({ success: true, data: communication });
	} catch (err) {
		return next(err);
	}
};

const update = async (req, res, next) => {
	try {
		const communication = await AdminCommunicationService.update(
			req.params.id,
			req.body,
		);
		res.json({ success: true, data: communication });
	} catch (err) {
		return next(err);
	}
};

const getAll = async (req, res, next) => {
	try {
		const result = await AdminCommunicationService.getAll(req.query);
		res.json({ success: true, ...result });
	} catch (err) {
		return next(err);
	}
};

const getById = async (req, res, next) => {
	try {
		const communication = await AdminCommunicationService.getById(
			req.params.id,
		);
		res.json({ success: true, data: communication });
	} catch (err) {
		return next(err);
	}
};

const deleteOne = async (req, res, next) => {
	try {
		await AdminCommunicationService.deleteOne(req.params.id);
		res.json({ success: true, message: "Communication deleted" });
	} catch (err) {
		return next(err);
	}
};

const publish = async (req, res, next) => {
	try {
		const communication = await AdminCommunicationService.publish(
			req.params.id,
		);
		res.json({ success: true, data: communication });
	} catch (err) {
		return next(err);
	}
};

const send = async (req, res, next) => {
	try {
		const communication = await AdminCommunicationService.send(req.params.id);
		res.json({ success: true, data: communication });
	} catch (err) {
		return next(err);
	}
};

module.exports = { create, update, getAll, getById, deleteOne, publish, send };
