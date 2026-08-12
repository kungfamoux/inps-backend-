const logger = require("./logger");

// Expired rate-limit windows are never deleted by the store itself (a key
// that stops making requests just sits there), so this sweeps them out
// periodically to keep the table from growing unbounded.
const DEFAULT_INTERVAL_MS = 10 * 60 * 1000;

const startRateLimitCleanup = (prisma, intervalMs = DEFAULT_INTERVAL_MS) => {
	const interval = setInterval(() => {
		prisma.rateLimitHit
			.deleteMany({ where: { resetTime: { lte: new Date() } } })
			.catch((err) => {
				logger.warn(`Rate limit cleanup sweep failed: ${err.message}`);
			});
	}, intervalMs);

	interval.unref();
	return interval;
};

module.exports = { startRateLimitCleanup };
