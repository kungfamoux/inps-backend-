const logger = require("./logger");

// Prisma Postgres scales compute to zero after a period of inactivity;
// the next query then pays a "wake up the database" cost that can run
// into multiple seconds. A periodic no-op query keeps the connection
// active so real requests don't get stuck paying that cost.
const DEFAULT_INTERVAL_MS = 4 * 60 * 1000;

const startDbKeepAlive = (prisma, intervalMs = DEFAULT_INTERVAL_MS) => {
	const interval = setInterval(() => {
		prisma.$queryRaw`SELECT 1`.catch((err) => {
			logger.warn(`DB keep-alive ping failed: ${err.message}`);
		});
	}, intervalMs);

	interval.unref();
	return interval;
};

module.exports = { startDbKeepAlive };
