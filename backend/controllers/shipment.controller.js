/**
 * shipment.controller.js
 * API Gateway cho Chuyến hàng & Phân công (Dispatch & Assignment).
 */
const pool = require("../config/db");

// GET /api/shipments
async function getAllShipments(req, res, next) {
    try {
        const [rows] = await pool.query("CALL sp_GetAllShipments()");
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
}

// POST /api/shipments
async function createShipment(req, res, next) {
    try {
        const { departureDate, routeId } = req.body;
        const [rows] = await pool.query("CALL sp_CreateShipment(?, ?)", [
            departureDate,
            routeId,
        ]);
        return res.status(201).json({ success: true, data: rows[0][0] });
    } catch (err) {
        next(err);
    }
}

// POST /api/shipments/:id/orders  — Gộp đơn hàng vào chuyến
async function addOrderToShipment(req, res, next) {
    try {
        const { orderId, expectedDeliveryDate } = req.body;
        const [rows] = await pool.query("CALL sp_AddOrderToShipment(?, ?, ?)", [
            orderId,
            req.params.id,
            expectedDeliveryDate || null,
        ]);
        return res.status(201).json({ success: true, data: rows[0][0] });
    } catch (err) {
        next(err);
    }
}

// DELETE /api/shipments/:id/orders/:orderId  — Gỡ đơn khỏi chuyến
async function removeOrderFromShipment(req, res, next) {
    try {
        const [rows] = await pool.query("CALL sp_RemoveOrderFromShipment(?, ?)", [
            req.params.orderId,
            req.params.id,
        ]);
        return res.json({ success: true, data: rows[0][0] });
    } catch (err) {
        next(err);
    }
}

// GET /api/assignments
// Nếu role=DRIVER → chỉ trả phân công của tài xế đó
// Nếu role=STAFF  → trả toàn bộ
async function getAllAssignments(req, res, next) {
    try {
        const { role, userId } = req.mockUser;

        if (role === "DRIVER") {
            // Lọc chỉ những phân công của tài xế này
            const [rows] = await pool.query(
                "CALL sp_GetAssignmentsByDriver(?)",
                [userId]
            );
            return res.json({ success: true, data: rows[0] });
        }

        // STAFF: xem tất cả
        const [rows] = await pool.query("CALL sp_GetAllAssignments()");
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
}

// POST /api/assignments  — Phân xe + Tài xế cho chuyến
// POST /api/assignments  — Phân xe + Tài xế cho chuyến
async function createAssignment(req, res, next) {
    try {
        // TRIGGER trg_before_assignment_insert kiểm tra toàn bộ nghiệp vụ
        // (quá tải, đăng kiểm, GPLX, tài xế-xe match)
        const { shipmentId, vehicleId, driverId, assignDate } = req.body;
        
        // SỬA Ở ĐÂY: Thêm 1 dấu chấm hỏi (?) và nhét assignDate vào mảng
        const [rows] = await pool.query("CALL sp_CreateAssignment(?, ?, ?, ?)", [
            shipmentId,
            vehicleId,
            driverId,
            assignDate || null // Truyền xuống biến thứ 4
        ]);
        
        return res.status(201).json({ success: true, data: rows[0][0] });
    } catch (err) {
        next(err);
    }
}

// PATCH /api/assignments/:id/status  — Cập nhật trạng thái phân công
async function updateAssignmentStatus(req, res, next) {
    try {
        const { status } = req.body;
        const [rows] = await pool.query("CALL sp_UpdateAssignmentStatus(?, ?)", [
            req.params.id,
            status,
        ]);
        return res.json({ success: true, data: rows[0][0] });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getAllShipments,
    createShipment,
    addOrderToShipment,
    removeOrderFromShipment,
    getAllAssignments,
    createAssignment,
    updateAssignmentStatus,
};
