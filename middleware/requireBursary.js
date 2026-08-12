/**
 * requireBursary
 *
 * Restricts access to BURSARY role only.
 * Used for fee configuration, invoice, and payment routes.
 * Must be used after the authenticate middleware.
 */
const requireBursary = (req, res, next) => {
  if (!req.staff || req.staff.role !== "BURSARY") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Bursary staff only.",
    });
  }

  next();
};

module.exports = { requireBursary };
