const SchoolConfigService = require("../services/SchoolConfigService");
const logger = require("../../utils/logger");

const getCurrentConfig = async (req, res, next) => {
	try {
		const config = await SchoolConfigService.getCurrentConfig();
		return res.status(200).json({ success: true, data: config });
	} catch (error) {
		return next(error);
	}
};

const setCurrentConfig = async (req, res, next) => {
	try {
		const { sessionId, termId } = req.body;
		const userId = req.user?.id;

		if (!sessionId || !termId) {
			return res.status(400).json({
				success: false,
				message: "sessionId and termId are required",
			});
		}

		const config = await SchoolConfigService.setCurrentConfig(
			sessionId,
			termId,
			userId
		);
		return res
			.status(200)
			.json({ success: true, message: "Current config set", data: config });
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	getCurrentConfig,
	setCurrentConfig,
};