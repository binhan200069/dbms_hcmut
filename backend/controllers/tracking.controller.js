/**
 * tracking.controller.js
 * API Gateway cho Tracking — Tài xế cập nhật vị trí giao hàng.
 * userId lấy từ req.mockUser (header x-mock-user-id).
 */
const pool = require("../config/db");

// GET /api/tracking?orderId=&limit=
async function getTrackingLogs(req, res, next) {
    try {
        const { orderId = null, limit = 50 } = req.query;
        const [rows] = await pool.query("CALL sp_GetTrackingLogs(?, ?)", [
            orderId || null,
            Number(limit),
        ]);
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
}

// POST /api/tracking  — Tài xế/Staff thêm log vị trí
async function addTrackingLog(req, res, next) {
    try {
        const { orderId, currentStatus, locationId, logLocation } = req.body;
        // INSERT trực tiếp (TRIGGER trg_after_tracking_insert sẽ tự đồng bộ OrderStatus)
        const [result] = await pool.query(
            `INSERT INTO TRACKING_LOG (OrderId, CurrentStatus, Timestamp, LocationId, LogLocation)
             VALUES (?, ?, NOW(), ?, ?)`,
            [orderId, currentStatus, locationId || null, logLocation || null]
        );
        return res.status(201).json({
            success: true,
            data: {
                trackingId: result.insertId,
                message:    "Cập nhật vị trí giao hàng thành công!",
            },
        });
    } catch (err) {
        next(err);
    }
}

// GET /api/tracking/order/:orderId  — Lịch sử tracking 1 đơn
async function getOrderTracking(req, res, next) {
    try {
        const [rows] = await pool.query("CALL sp_GetTrackingLogs(?, ?)", [
            req.params.orderId,
            100,
        ]);
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
}

module.exports = { getTrackingLogs, addTrackingLog, getOrderTracking };
