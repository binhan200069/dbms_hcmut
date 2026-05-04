const express = require("express");
const ctrl    = require("../controllers/shipment.controller");
const { requireRole } = require("../middlewares/mockAuth.middleware");

const router = express.Router();

// ── Shipments ────────────────────────────────────────────────────────────────
router.get("/",                              ctrl.getAllShipments);
router.post("/",    requireRole("STAFF"),    ctrl.createShipment);

// Gộp / gỡ đơn hàng khỏi chuyến
router.post("/:id/orders",   requireRole("STAFF"), ctrl.addOrderToShipment);
router.delete("/:id/orders/:orderId", requireRole("STAFF"), ctrl.removeOrderFromShipment);

// ── Assignments ──────────────────────────────────────────────────────────────
router.get("/assignments",           ctrl.getAllAssignments);
router.post("/assignments",          requireRole("STAFF"), ctrl.createAssignment);
router.patch("/assignments/:id/status", requireRole("STAFF", "DRIVER"), ctrl.updateAssignmentStatus);

module.exports = router;
