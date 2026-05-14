/**
 * warehouse.controller.js
 * API Gateway — CHỈ gọi Stored Procedures để truy vấn dữ liệu.
 * Dùng cho trang hiển thị danh sách kho và tồn kho của khách hàng.
 */
const pool = require("../config/db");

// GET /api/warehouses
// Lấy danh sách tất cả các kho để hiển thị các bảng
async function getAllWarehouses(req, res, next) {
    try {
        // Gọi Procedure lấy thông tin cơ bản của các kho
        const [rows] = await pool.query("CALL sp_GetAllWarehouses()");
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
}

// GET /api/warehouses/:id/items
// Lấy danh sách chi tiết các Item và số lượng tồn trong một kho cụ thể
async function getInventoryByWarehouse(req, res, next) {
    try {
        // Gọi Procedure sp_GetItemsByWarehouse bạn vừa tạo ở bước trước
        const [rows] = await pool.query("CALL sp_GetItemsByWarehouse(?)", [req.params.id]);
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getAllWarehouses,
    getInventoryByWarehouse,
};