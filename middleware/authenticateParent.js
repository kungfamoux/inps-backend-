const prisma = require("../lib/prisma");
const admin = require("../lib/firebaseAdmin");
const logger = require("../utils/logger");
const { TTLCache } = require("../utils/ttlCache");

// See middleware/authenticate.js for why these are cached — same rationale,
// separate cache instances since staff and parent records are unrelated.
const decodedTokenCache = new TTLCache();
const parentCache = new TTLCache();
const PARENT_CACHE_TTL_MS = 60 * 1000;
const MAX_TOKEN_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * authenticateParent
 *
 * Verifies the Firebase ID token from the Authorization header.
 * Attaches the full Prisma Parent record to req.parent.
 *
 * Expected header: Authorization: Bearer <firebase_id_token>
 */
const authenticateParent = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			logger.warn(`Parent auth failed — no token. Route: ${req.originalUrl}`);
			return res.status(401).json({
				success: false,
				message: "No token provided",
			});
		}

		const idToken = authHeader.split("Bearer ")[1];

		let decoded = decodedTokenCache.get(idToken);
		if (!decoded) {
			decoded = await admin.auth().verifyIdToken(idToken);
			const ttl = Math.min(
				MAX_TOKEN_CACHE_TTL_MS,
				decoded.exp * 1000 - Date.now(),
			);
			decodedTokenCache.set(idToken, decoded, ttl);
		}

		let parent = parentCache.get(decoded.uid);
		if (!parent) {
			parent = await prisma.parent.findFirst({
				where: { firebaseUid: decoded.uid, deletedAt: null },
			});
			if (parent) parentCache.set(decoded.uid, parent, PARENT_CACHE_TTL_MS);
		}

		if (!parent) {
			logger.warn(
				`Parent auth failed — no parent record for uid: ${decoded.uid}`,
			);
			return res.status(401).json({
				success: false,
				message: "Account not found",
			});
		}

		logger.info(`Parent authenticated: ${parent.accountEmail}`);
		req.parent = parent;
		next();
	} catch (error) {
		logger.error(`Parent token verification failed: ${error.message}`);
		return res.status(401).json({
			success: false,
			message: "Invalid or expired token",
		});
	}
};

module.exports = { authenticateParent };
