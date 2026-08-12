/**
 * requireRoles
 *
 * A flexible role guard that accepts a list of allowed roles.
 * Use this when a route needs to be accessible by more than one role
 * but not all staff.
 *
 * Usage:
 *   router.get("/report", authenticate, requireRoles(["ADMIN", "BURSARY"]), handler);
 *
 * @param {string[]} roles - Array of allowed StaffRole enum values
 */
const requireRoles = (roles) => (req, res, next) => {
  if (!req.staff || !roles.includes(req.staff.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Allowed roles: ${roles.join(", ")}.`,
    });
  }

  next();
};

module.exports = { requireRoles };
