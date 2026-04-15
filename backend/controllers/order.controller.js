const orderService = require("../services/order.service");
const {
    parsePositiveInt,
    parseStatusFilter,
    requireNonEmptyText,
    parseFreightCost
} = require("../validators/order.validator");

async function getCustomerOrders(req, res, next) {
    try {
        const customerId = parsePositiveInt(req.query.customerId, "customerId");
        const statusFilter = parseStatusFilter(req.query.status);
        const orders = await orderService.getCustomerOrders(customerId, statusFilter);

        return res.status(200).json({ data: orders });
    } catch (err) {
        return next(err);
    }
}

async function getCustomerStats(req, res, next) {
    try {
        const customerId = parsePositiveInt(req.query.customerId, "customerId");
        const stats = await orderService.getCustomerStats(customerId);

        return res.status(200).json({ data: stats });
    } catch (err) {
        return next(err);
    }
}

async function createOrder(req, res, next) {
    try {
        const customerId = parsePositiveInt(req.body.customerId, "customerId");
        const pickupLocation = requireNonEmptyText(
            req.body.pickupLocation,
            "Lỗi: Điểm lấy hàng không được để trống!"
        );
        const deliveryLocation = requireNonEmptyText(
            req.body.deliveryLocation,
            "Lỗi: Điểm giao hàng không được để trống!"
        );
        const freightCost = parseFreightCost(req.body.freightCost);

        const created = await orderService.createOrder(
            customerId,
            pickupLocation,
            deliveryLocation,
            freightCost
        );

        return res.status(201).json({
            message: "Tạo đơn hàng thành công!",
            data: created
        });
    } catch (err) {
        return next(err);
    }
}

async function updateOrder(req, res, next) {
    try {
        const orderId = parsePositiveInt(req.params.id, "orderId");
        const pickupLocation = requireNonEmptyText(
            req.body.pickupLocation,
            "Lỗi: Điểm lấy hàng không được để trống!"
        );
        const deliveryLocation = requireNonEmptyText(
            req.body.deliveryLocation,
            "Lỗi: Điểm giao hàng không được để trống!"
        );

        const updated = await orderService.updateOrder(
            orderId,
            pickupLocation,
            deliveryLocation
        );

        return res.status(200).json({
            message: "Cập nhật đơn hàng thành công!",
            data: updated
        });
    } catch (err) {
        return next(err);
    }
}

async function deleteOrder(req, res, next) {
    try {
        const orderId = parsePositiveInt(req.params.id, "orderId");
        const deleted = await orderService.deleteOrder(orderId);

        return res.status(200).json({
            message: "Xóa đơn hàng thành công!",
            data: deleted
        });
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    getCustomerOrders,
    getCustomerStats,
    createOrder,
    updateOrder,
    deleteOrder
};
