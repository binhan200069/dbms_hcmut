const express = require("express");
const router = express.Router();
const warehouseController = require("../controllers/warehouse.controller");

// GET /api/warehouses -> Lấy danh sách tất cả kho
router.get("/", warehouseController.getAllWarehouses);

// GET /api/warehouses/:id/items -> Lấy item trong 1 kho cụ thể
router.get("/:id/items", warehouseController.getInventoryByWarehouse);

module.exports = router;