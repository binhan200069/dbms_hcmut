const express = require("express");
const ctrl    = require("../controllers/vehicle.controller");
const { requireRole } = require("../middlewares/mockAuth.middleware");

const router = express.Router();

// Tra cứu — mọi role đều xem được
router.get("/",        ctrl.getAllVehicles);
router.get("/search",  ctrl.searchVehicles);
router.get("/:id",     ctrl.getVehicleById);

// Chỉ STAFF mới được thêm/sửa/xóa
router.post("/",       requireRole("STAFF"), ctrl.createVehicle);
router.put("/:id",     requireRole("STAFF"), ctrl.updateVehicle);
router.delete("/:id",  requireRole("STAFF"), ctrl.deleteVehicle);

module.exports = router;
