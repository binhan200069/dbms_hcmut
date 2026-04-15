const db = require("../config/db");

function extractCallRows(callRows) {
    if (!Array.isArray(callRows)) {
        return [];
    }

    if (Array.isArray(callRows[0])) {
        return callRows[0];
    }

    return callRows;
}

async function getCustomerOrders(customerId, statusFilter) {
    const [callRows] = await db.query("CALL sp_GetCustomerOrders(?, ?)", [
        customerId,
        statusFilter
    ]);

    return extractCallRows(callRows);
}

async function getCustomerStats(customerId) {
    const [callRows] = await db.query("CALL sp_GetCustomerStats(?)", [customerId]);
    const rows = extractCallRows(callRows);

    return (
        rows[0] || {
            CustomerId: customerId,
            TotalOrders: 0,
            TotalFreightCost: 0
        }
    );
}

async function createOrder(customerId, pickupLocation, deliveryLocation, freightCost) {
    const [callRows] = await db.query("CALL sp_CreateOrder(?, ?, ?, ?)", [
        customerId,
        pickupLocation,
        deliveryLocation,
        freightCost
    ]);

    const rows = extractCallRows(callRows);
    return rows[0] || null;
}

async function updateOrder(orderId, pickupLocation, deliveryLocation) {
    const [callRows] = await db.query("CALL sp_UpdateOrder(?, ?, ?)", [
        orderId,
        pickupLocation,
        deliveryLocation
    ]);

    const rows = extractCallRows(callRows);
    return rows[0] || { UpdatedOrderId: orderId };
}

async function deleteOrder(orderId) {
    const [callRows] = await db.query("CALL sp_DeleteOrder(?)", [orderId]);
    const rows = extractCallRows(callRows);

    return rows[0] || { DeletedOrderId: orderId };
}

module.exports = {
    getCustomerOrders,
    getCustomerStats,
    createOrder,
    updateOrder,
    deleteOrder
};
