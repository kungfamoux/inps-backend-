/**
 * Middleware barrel export
 * Import all middleware from this single file:
 *
 * const { authenticate, requireAdmin, requireRoles } = require("../middleware");
 */

const { authenticate } = require("./authenticate");
const { authenticateParent } = require("./authenticateParent");
const { requireAdmin } = require("./requireAdmin");
const { requireTeacher } = require("./requireTeacher");
const { requireBursary } = require("./requireBursary");
const { requireStorekeeper } = require("./requireStorekeeper");
const { requireRoles } = require("./requireRoles");
const { errorHandler } = require("./errorHandler");
const { notFound } = require("./notFound");
const { loginLimiter } = require("./loginLimiter");
const { apiLimiter, webhookLimiter, reportLimiter } = require("./rateLimiter");
const { verifyPaystackSignature } = require("./verifyPaystackSignature");
const { validate } = require("./validate");

module.exports = {
	authenticate,
	requireAdmin,
	requireTeacher,
	requireBursary,
	requireStorekeeper,
	requireRoles,
	errorHandler,
	notFound,
	loginLimiter,
	apiLimiter,
	webhookLimiter,
	reportLimiter,
	verifyPaystackSignature,
	authenticateParent,
	validate,
};
