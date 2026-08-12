/**
 * requireStorekeeper
 *
 * Restricts access to STOREKEEPER role only.
 * Used for inventory, stock-in, and stock-out routes.
 * Must be used after the authenticate middleware.
 */
const requireStorekeeper = (req, res, next) => {
  if (!req.staff || req.staff.role !== "STOREKEEPER") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Storekeeper only.",
    });
  }

  next();
};

module.exports = { requireStorekeeper };
