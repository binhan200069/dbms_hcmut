const express = require("express");
const vehicleRoutes   = require("./vehicle.routes");
const orderRoutes     = require("./order.routes");
const shipmentRoutes  = require("./shipment.routes");
const trackingRoutes  = require("./tracking.routes");
const dashboardRoutes = require("./dashboard.routes");
const lookupRoutes    = require("./lookup.routes");
const userRoutes      = require("./user.routes");
const staffRoutes     = require("./staff.routes");

const router = express.Router();

router.use("/vehicles",   vehicleRoutes);
router.use("/orders",     orderRoutes);
router.use("/shipments",  shipmentRoutes);
router.use("/tracking",   trackingRoutes);
router.use("/dashboard",  dashboardRoutes);
router.use("/lookup",     lookupRoutes);
router.use("/users",      userRoutes);
router.use("/staff",      staffRoutes);

module.exports = router;
