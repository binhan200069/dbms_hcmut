/**
 * vehicle.controller.js
 * API Gateway — CHỈ gọi Stored Procedures, bắt lỗi DB và trả về Frontend.
 */
const pool = require("../config/db");

// GET /api/vehicles
async function getAllVehicles(req, res, next) {
    try {
        const [rows] = await pool.query("CALL sp_GetAllVehicles()");
        // Dữ liệu từ SP thường nằm ở rows[0]
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
}

// GET /api/vehicles/:id
async function getVehicleById(req, res, next) {
    try {
        const [rows] = await pool.query("CALL sp_GetVehicleById(?)", [req.params.id]);
        return res.json({ success: true, data: rows[0][0] });
    } catch (err) {
        next(err);
    }
}

// GET /api/vehicles/search?license_plate=&vehicle_type=
async function searchVehicles(req, res, next) {
    try {
        const { license_plate = null, vehicle_type = null } = req.query;
        const [rows] = await pool.query("CALL sp_SearchVehicles(?, ?)", [
            license_plate || null,
            vehicle_type  || null,
        ]);
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
}

// POST /api/vehicles
async function createVehicle(req, res, next) {
    try {
        // Lấy đủ 5 trường từ form UI
        const { license_plate, vehicle_type, capacity_kg, status, notes } = req.body;
        const defaultExpiryDate = '2030-12-31';

        // Gọi SP với 6 tham số (có thêm status và notes)
        const [rows] = await pool.query("CALL sp_CreateVehicle(?, ?, ?, ?, ?, ?)", [
            license_plate,
            vehicle_type,
            defaultExpiryDate,
            capacity_kg,
            status || 'Sẵn sàng',
            notes || null
        ]);
        return res.status(201).json({ success: true, data: rows[0][0] });
    } catch (err) {
        next(err);
    }
}

// PUT /api/vehicles/:id
async function updateVehicle(req, res, next) {
    try {
        const { license_plate, vehicle_type, capacity_kg, status, notes } = req.body;
        const defaultExpiryDate = '2030-12-31';

        // Gọi SP với 7 tham số (id + 6 trường data)
        const [rows] = await pool.query("CALL sp_UpdateVehicle(?, ?, ?, ?, ?, ?, ?)", [
            req.params.id,
            license_plate,
            vehicle_type,
            defaultExpiryDate,
            capacity_kg,
            status || 'Sẵn sàng',
            notes || null
        ]);
        return res.json({ success: true, data: rows[0][0] });
    } catch (err) {
        next(err);
    }
}

// DELETE /api/vehicles/:id
async function deleteVehicle(req, res, next) {
    try {
        const [rows] = await pool.query("CALL sp_DeleteVehicle(?)", [req.params.id]);
        return res.json({ success: true, data: rows[0][0] });
    } catch (err) {
        // Nếu DB quăng lỗi bằng lệnh SIGNAL SQLSTATE '45000', nó sẽ chui vào đây
        // Chuyển thẳng lỗi này sang middleware xử lý lỗi tổng
        next(err);
    }
}

module.exports = {
    getAllVehicles,
    getVehicleById,
    searchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
};