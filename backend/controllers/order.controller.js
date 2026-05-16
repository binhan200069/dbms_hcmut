/**
 * order.controller.js
 * API Gateway cho đơn hàng — chỉ gọi Stored Procedures.
 */
const pool = require("../config/db");

// GET /api/orders
// Nếu role=CUSTOMER → chỉ trả đơn hàng của họ (lọc theo UserId)
// Nếu role=STAFF    → trả toàn bộ đơn hàng
async function getAllOrders(req, res, next) {
    try {
        const { role, userId } = req.mockUser;

        if (role === "CUSTOMER") {
            // Dùng sp_SearchOrders với customerId để lọc đúng khách hàng
            const [rows] = await pool.query(
                "CALL sp_SearchOrders(?, ?, ?, ?)",
                [null, null, null, userId]
            );
            return res.json({ success: true, data: rows[0] });
        }

        // STAFF: xem tất cả
        const [rows] = await pool.query("CALL sp_GetAllOrders()");
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
}

// GET /api/orders/search?fromDate=&toDate=&status=&customerId=
async function searchOrders(req, res, next) {
    try {
        const { fromDate = null, toDate = null, status = null, customerId = null } = req.query;
        const [rows] = await pool.query("CALL sp_SearchOrders(?, ?, ?, ?)", [
            fromDate   || null,
            toDate     || null,
            status     || null,
            customerId || null,
        ]);
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
}

// GET /api/orders/:id
async function getOrderById(req, res, next) {
    try {
        const [rows] = await pool.query("CALL sp_GetOrderById(?)", [req.params.id]);
        // sp_GetOrderById trả 2 result sets: [orderInfo, itemList]
        return res.json({
            success: true,
            data:  { order: rows[0][0], items: rows[1] },
        });
    } catch (err) {
        next(err);
    }
}

// POST /api/orders
async function createOrder(req, res, next) {
    try {
        // CustomerId: lấy từ mockUser nếu role=CUSTOMER, hoặc body nếu STAFF tạo giúp
        const customerId = req.mockUser.role === "CUSTOMER"
            ? req.mockUser.userId
            : req.body.customerId;

        const {pickupLocation, deliveryLocation, freightFactor, freightCost, PaymentTerm} = req.body;

        const [rows] = await pool.query("CALL sp_CreateOrder(?, ?, ?, ?, ?, ?)", [
            customerId,
            pickupLocation,
            deliveryLocation,
            freightFactor ?? 1.0,
            freightCost ?? 5000,
            PaymentTerm,
        ]);
        return res.status(201).json({ success: true, data: rows[0][0] });
    } catch (err) {
        next(err);
    }
}

// PUT /api/orders/:id
async function updateOrder(req, res, next) {
    try {
        const { pickupLocation, deliveryLocation, freightFactor, freightCost, staffId } = req.body;
        const [rows] = await pool.query("CALL sp_UpdateOrder(?, ?, ?, ?, ?, ?)", [
            req.params.id,
            pickupLocation,
            deliveryLocation,
            freightFactor,
            freightCost,
            staffId,
        ]);
        return res.json({ success: true, data: rows[0][0] });
    } catch (err) {
        next(err);
    }
}

// DELETE /api/orders/:id
async function deleteOrder(req, res, next) {
    try {
        const [rows] = await pool.query("CALL sp_DeleteOrder(?)", [req.params.id]);
        return res.json({ success: true, data: rows[0][0] });
    } catch (err) {
        next(err);
    }
}

// PATCH /api/orders/:id/cancel
async function cancelOrder(req, res, next) {
    try {
        const orderId = req.params.id;

        const [result] = await pool.query("CALL sp_CancelOrder(?)", [orderId]);

        const updatedData = (result && result[0] && result[0][0]) ? result[0][0] : null;

        return res.json({ 
            success: true, 
            message: "Đơn hàng đã được hủy.",
            data: updatedData
        });
    } catch (err) {
        if (err.sqlState === '45000') {
            return res.status(400).json({ 
                success: false, 
                message: err.message || err.sqlMessage
            });
        }
        next(err);
    }
}

// POST /api/orders/:id/items
async function addItemToOrder(req, res, next) {
    try {
        const { itemId, orderQuantity } = req.body;
        const [rows] = await pool.query("CALL sp_AddItemToOrder(?, ?, ?)", [
            req.params.id,
            itemId,
            orderQuantity,
        ]);
        return res.status(201).json({ success: true, data: rows[0][0] });
    } catch (err) {
        if (err.sqlState === '45000') {
            return res.status(400).json({ 
                success: false, 
                message: err.sqlMessage
            });
        }
        next(err);
    }
}

module.exports = {
    getAllOrders,
    searchOrders,
    getOrderById,
    createOrder,
    updateOrder,
    deleteOrder,
    cancelOrder,
    addItemToOrder,
};
