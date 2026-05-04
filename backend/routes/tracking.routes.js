const express = require("express");
const ctrl    = require("../controllers/tracking.controller");
const { requireRole } = require("../middlewares/mockAuth.middleware");

const router = express.Router();

router.get("/",                  ctrl.getTrackingLogs);
router.get("/order/:orderId",    ctrl.getOrderTracking);
router.post("/", requireRole("STAFF", "DRIVER"), ctrl.addTrackingLog);

module.exports = router;
