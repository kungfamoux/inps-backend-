const logger = require("../utils/logger");

/**
 * errorHandler
 *
 * Global error handling middleware.
 * Must be registered last in your Express app (after all routes).
 *
 * Usage in app.js:
 *   app.use(errorHandler);
 */
const errorHandler = (err, req, res, next) => {
	// requestId/method/path are injected automatically by utils/logger.js
	// via the async-local request context set up in middleware/requestId.js.
	logger.error(err.message, { stack: err.stack });

	// Prisma known request errors (e.g. unique constraint violation)
	if (err.code === "P2002") {
		return res.status(409).json({
			success: false,
			message: "A record with this value already exists.",
			field: err.meta?.target,
		});
	}

	// Prisma record not found
	if (err.code === "P2025") {
		return res.status(404).json({
			success: false,
			message: "Record not found.",
		});
	}

	// Firebase auth errors
	if (err.code?.startsWith("auth/")) {
		return res.status(401).json({
			success: false,
			message: err.message,
		});
	}

	// Every deliberate business-rule throw in this codebase uses plain
	// `new Error("...")` (e.g. "Student not found") — those messages are
	// safe to show verbatim. Anything else (TypeError, ReferenceError, or
	// any other built-in subclass) is an unexpected bug, not a business
	// rule — its message can leak internal implementation details (file/
	// method names), so mask it behind a generic 500. Full detail is
	// already logged above with the stack trace.
	if (err.constructor !== Error) {
		return res.status(500).json({
			success: false,
			message: "Internal server error.",
		});
	}

	// Default — matches the status controllers historically hardcoded for
	// unclassified business-logic errors (e.g. "Student not found").
	// Errors with an explicit err.status still override this.
	return res.status(err.status ?? 400).json({
		success: false,
		message: err.message ?? "Bad request.",
	});
};

module.exports = { errorHandler };
