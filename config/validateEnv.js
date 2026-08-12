const logger = require("../utils/logger");

const REQUIRED_VARS = [
	"DATABASE_URL",
	"SERVICE_ACCOUNT_KEY",
	"FIREBASE_API_KEY",
];

const RECOMMENDED_VARS = [
	"PAYSTACK_SECRET_KEY",
	"RESEND_API_KEY",
	"CLOUDINARY_CLOUD_NAME",
	"CLOUDINARY_API_KEY",
	"CLOUDINARY_API_SECRET",
];

const validateEnv = () => {
	const missingRequired = REQUIRED_VARS.filter((key) => !process.env[key]);

	if (missingRequired.length) {
		logger.error(
			`Missing required environment variable(s): ${missingRequired.join(", ")}. The server cannot start without these — check your .env file.`,
		);
		process.exit(1);
	}

	const missingRecommended = RECOMMENDED_VARS.filter(
		(key) => !process.env[key],
	);

	if (missingRecommended.length) {
		logger.warn(
			`Missing environment variable(s): ${missingRecommended.join(", ")}. Related features (payments/email/uploads) will fail until these are set.`,
		);
	}

	if (!process.env.CORS_ORIGIN) {
		logger.warn(
			"CORS_ORIGIN is not set — the API will accept requests from any origin (*). Set it to your frontend's domain in production.",
		);
	}
};

module.exports = validateEnv;
