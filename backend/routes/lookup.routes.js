const express = require("express");
const ctrl    = require("../controllers/lookup.controller");

const router = express.Router();

// Tất cả lookup đều public (dùng cho dropdown trong form)
router.get("/locations",   ctrl.getLocations);
router.get("/routes",      ctrl.getRoutes);
router.get("/items",       ctrl.getItems);
router.get("/drivers",     ctrl.getDrivers);
router.get("/customers",   ctrl.getCustomers);
router.get("/staff",       ctrl.getStaff);
router.get("/warehouses",  ctrl.getWarehouses);

module.exports = router;
