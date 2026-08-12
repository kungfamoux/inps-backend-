/**
 * requireAdmin
 *
 * Restricts access to staff with role ADMIN or HEAD_TEACHER only.
 * Must be used after the authenticate middleware (depends on req.staff).
 */
const requireAdmin = (req, res, next) => {
	const allowedRoles = ["ADMIN", "HEAD_TEACHER"];

	if (!req.staff || !allowedRoles.includes(req.staff.role)) {
		return res.status(403).json({
			success: false,
			message: "Access denied. Admin or Head teacher role required.",
		});
	}

	next();
};

module.exports = { requireAdmin };
