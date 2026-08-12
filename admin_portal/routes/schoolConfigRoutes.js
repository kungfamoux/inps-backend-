const express = require("express");
const router = express.Router();
const SchoolConfigController = require("../controller/SchoolConfigController");
const { authenticate, requireAdmin } = require("../../middleware");

// Get current school config
router.get("/current", authenticate, requireAdmin, SchoolConfigController.getCurrentConfig);

// Set current school config
router.post("/current", authenticate, requireAdmin, SchoolConfigController.setCurrentConfig);

module.exports = router;