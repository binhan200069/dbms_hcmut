const express = require("express");
const ctrl    = require("../controllers/order.controller");
const { requireRole } = require("../middlewares/mockAuth.middleware");

const router = express.Router();

// Tìm kiếm/lọc đơn hàng (STAFF xem tất cả, CUSTOMER xem đơn mình)
router.get("/",           ctrl.getAllOrders);
router.get("/search",     ctrl.searchOrders);
router.get("/:id",        ctrl.getOrderById);

// Tạo đơn: CUSTOMER hoặc STAFF đều được tạo
router.post("/",          requireRole("STAFF", "CUSTOMER"), ctrl.createOrder);

// Sửa đơn: chỉ STAFF
router.put("/:id",        requireRole("STAFF"), ctrl.updateOrder);

// Xóa đơn: chỉ STAFF
router.delete("/:id",     requireRole("STAFF"), ctrl.deleteOrder);

// Hủy đơn: STAFF hoặc CUSTOMER
router.patch("/:id/cancel",    requireRole("STAFF", "CUSTOMER"), ctrl.cancelOrder);

// Thêm hàng hóa vào đơn
router.post("/:id/items", requireRole("STAFF", "CUSTOMER"), ctrl.addItemToOrder);

module.exports = router;
