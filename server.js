require("dotenv").config({ override: true });
require("./config/validateEnv")();
const prisma = require("./lib/prisma.js");
const logger = require("./utils/logger");
const app = require("./app.js");
const { startDbKeepAlive } = require("./utils/dbKeepAlive");
const { startRateLimitCleanup } = require("./utils/rateLimitCleanup");

const PORT = process.env.PORT || 3000;
let keepAliveInterval;
let rateLimitCleanupInterval;
let server;

prisma
	.$connect()
	.then(() => {
		logger.info("Database connected");
		keepAliveInterval = startDbKeepAlive(prisma);
		rateLimitCleanupInterval = startRateLimitCleanup(prisma);
		server = app.listen(PORT, () => {
			logger.info(`Server is running on port ${PORT}`);
			logger.info(
				`Swagger docs available at http://localhost:${PORT}/api-docs`,
			);
		});
	})
	.catch((err) => {
		logger.error(`Database connection failed: ${err.message}`);
		process.exit(1);
	});

// Stops accepting new connections but lets in-flight requests finish before
// disconnecting Prisma and exiting — without this, a deploy/restart (which
// sends SIGTERM) can cut off a request mid-response.
const shutdown = (signal) => {
	logger.info(`${signal} received, shutting down gracefully`);
	clearInterval(keepAliveInterval);
	clearInterval(rateLimitCleanupInterval);

	if (!server) {
		process.exit(0);
		return;
	}

	server.close(async () => {
		await prisma.$disconnect();
		process.exit(0);
	});

	// Safety net in case some request never finishes.
	setTimeout(() => {
		logger.error(
			"Forced shutdown after timeout — some in-flight requests may not have completed",
		);
		process.exit(1);
	}, 10000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Last-resort safety net: without these, an error Express never sees (a
// fire-and-forget promise, a timer callback, etc.) crashes the process
// abruptly with no log line and no cleanup. Logging first at least makes
// the failure traceable before Node terminates the process.
process.on("uncaughtException", (err) => {
	logger.error(`Uncaught exception: ${err.message}`, { stack: err.stack });
	process.exit(1);
});

process.on("unhandledRejection", (reason) => {
	const message = reason instanceof Error ? reason.message : String(reason);
	const stack = reason instanceof Error ? reason.stack : undefined;
	logger.error(`Unhandled rejection: ${message}`, { stack });
	process.exit(1);
});
