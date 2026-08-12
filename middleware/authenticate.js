const prisma = require("../lib/prisma");
const AuthRepository = require("../shared/repositories/AuthRepository");
const { TTLCache } = require("../utils/ttlCache");

// Firebase token verification and the staff lookup are both network
// round-trips that would otherwise repeat on every single request from
// the same logged-in user. A token stays valid ~1hr and is reused as-is
// by the client, so caching its verification result (bounded by the
// token's own expiry) and the resulting staff record for a short window
// avoids paying that cost on every request in a burst (e.g. one page
// load hitting several endpoints).
const decodedTokenCache = new TTLCache();
const staffCache = new TTLCache();
const STAFF_CACHE_TTL_MS = 60 * 1000;
const MAX_TOKEN_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * authenticate
 *
 * Verifies the Firebase ID token from the Authorization header.
 * Attaches the full Prisma Staff record to req.staff.
 *
 * Expected header: Authorization: Bearer <firebase_id_token>
 */
const authenticate = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({
				success: false,
				message: "No token provided",
			});
		}

		const idToken = authHeader.split("Bearer ")[1];

		let decoded = decodedTokenCache.get(idToken);
		if (!decoded) {
			decoded = await AuthRepository.verifyIdToken(idToken);
			const ttl = Math.min(
				MAX_TOKEN_CACHE_TTL_MS,
				decoded.exp * 1000 - Date.now(),
			);
			decodedTokenCache.set(idToken, decoded, ttl);
		}

		// Fetch the full staff record from Prisma using the Firebase UID
		let staff = staffCache.get(decoded.uid);
		if (!staff) {
			staff = await prisma.staff.findUnique({
				where: { firebaseUid: decoded.uid },
			});
			if (staff) staffCache.set(decoded.uid, staff, STAFF_CACHE_TTL_MS);
		}

		if (!staff) {
			return res.status(401).json({
				success: false,
				message: "Account not found",
			});
		}

		if (staff.deletedAt) {
			return res.status(403).json({
				success: false,
				message: "This account has been deactivated",
			});
		}

		req.staff = staff;
		next();
	} catch (error) {
		return res.status(401).json({
			success: false,
			message: "Invalid or expired token",
		});
	}
};

module.exports = { authenticate };
