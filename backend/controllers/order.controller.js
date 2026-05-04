/**
 * order.controller.js
 * API Gateway cho đơn hàng — chỉ gọi Stored Procedures.
 */
const pool = require("../config/db");

// GET /api/orders
async function getAllOrders(req, res, next) {
    try {
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

        const { pickupLocation, deliveryLocation, freightFactor, freightCost, staffId } = req.body;

        const [rows] = await pool.query("CALL sp_CreateOrder(?, ?, ?, ?, ?, ?)", [
            customerId,
            pickupLocation,
            deliveryLocation,
            freightFactor ?? 1.0,
            freightCost   ?? 0,
            staffId       ?? req.mockUser.userId,
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
        const [rows] = await pool.query("CALL sp_CancelOrder(?)", [req.params.id]);
        return res.json({ success: true, data: rows[0][0] });
    } catch (err) {
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
