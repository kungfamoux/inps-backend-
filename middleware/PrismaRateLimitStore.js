const prisma = require("../lib/prisma");
const logger = require("../utils/logger");

/**
 * A Postgres-backed store implementing express-rate-limit's Store interface,
 * so limits are enforced correctly across multiple server instances instead
 * of each process keeping its own separate in-memory counters.
 *
 * `prefix` must be unique per limiter instance — express-rate-limit's default
 * keyGenerator only uses the client IP, so without a prefix two differently
 * configured limiters (e.g. the global API limiter and the login limiter)
 * would collide on the same row for the same client.
 */
class PrismaRateLimitStore {
	constructor(prefix) {
		if (!prefix) throw new Error("PrismaRateLimitStore requires a prefix");
		this.prefix = prefix;
		this.windowMs = 60 * 1000;
	}

	init(options) {
		this.windowMs = options.windowMs;
	}

	_key(key) {
		return `${this.prefix}:${key}`;
	}

	// Single atomic statement — a plain read-then-write would race under
	// concurrent requests from the same client and undercount hits.
	async increment(key) {
		const now = new Date();
		const resetTime = new Date(now.getTime() + this.windowMs);

		const rows = await prisma.$queryRaw`
			INSERT INTO "RateLimitHit" AS r ("key", "totalHits", "resetTime")
			VALUES (${this._key(key)}, 1, ${resetTime})
			ON CONFLICT ("key") DO UPDATE SET
				"totalHits" = CASE
					WHEN r."resetTime" <= ${now} THEN 1
					ELSE r."totalHits" + 1
				END,
				"resetTime" = CASE
					WHEN r."resetTime" <= ${now} THEN ${resetTime}
					ELSE r."resetTime"
				END
			RETURNING "totalHits", "resetTime"
		`;

		const row = rows[0];
		return { totalHits: row.totalHits, resetTime: row.resetTime };
	}

	async decrement(key) {
		try {
			await prisma.rateLimitHit.updateMany({
				where: { key: this._key(key), totalHits: { gt: 0 } },
				data: { totalHits: { decrement: 1 } },
			});
		} catch (err) {
			logger.warn(`Rate limit store decrement failed: ${err.message}`);
		}
	}

	async resetKey(key) {
		try {
			await prisma.rateLimitHit.deleteMany({ where: { key: this._key(key) } });
		} catch (err) {
			logger.warn(`Rate limit store resetKey failed: ${err.message}`);
		}
	}
}

module.exports = { PrismaRateLimitStore };
