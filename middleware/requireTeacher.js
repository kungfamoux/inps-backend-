/**
 * requireTeacher
 *
 * Restricts access to teaching staff only.
 * Whether a given teacher is actually a class teacher, a subject teacher, or
 * both is a matter of their Section/SubjectAssignment records, not the role
 * itself — that ownership check happens in the service layer.
 * Must be used after the authenticate middleware.
 */
const requireTeacher = (req, res, next) => {
	if (!req.staff || req.staff.role !== "TEACHER") {
		return res.status(403).json({
			success: false,
			message: "Access denied. Teaching staff only.",
		});
	}

	next();
};

module.exports = { requireTeacher };
