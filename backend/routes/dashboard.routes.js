const express = require("express");
const ctrl    = require("../controllers/dashboard.controller");
const { requireRole } = require("../middlewares/mockAuth.middleware");

const router = express.Router();

router.get("/stats",              requireRole("STAFF"),  ctrl.getDashboardStats);
router.get("/revenue",            requireRole("STAFF"),  ctrl.getMonthlyRevenue);
router.get("/driver-bonus/:driverId", requireRole("STAFF", "DRIVER"), ctrl.getDriverBonus);

module.exports = router;
