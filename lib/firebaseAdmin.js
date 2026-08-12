const admin = require("firebase-admin");
const logger = require("../utils/logger");

let serviceAccountRaw;

try {
	serviceAccountRaw = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);
} catch (err) {
	logger.error("Failed to parse Firebase SERVICE_ACCOUNT_KEY");
	throw err;
}

if (!admin.apps.length) {
	try {
		admin.initializeApp({
			credential: admin.credential.cert(serviceAccountRaw),
		});

		logger.info("Firebase successfully connected");
	} catch (err) {
		logger.error("Firebase initialization failed");
		logger.error(err.message);
		throw err;
	}
}

module.exports = admin;
