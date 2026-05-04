/**
 * vehicle.controller.js
 * API Gateway — CHỈ gọi Stored Procedures, bắt lỗi DB và trả về Frontend.
 * KHÔNG có logic validate hoặc IF/ELSE nghiệp vụ trong file này.
 */
const pool = require("../config/db");

// GET /api/vehicles
async function getAllVehicles(req, res, next) {
    try {
        const [rows] = await pool.query("CALL sp_GetAllVehicles()");
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

// GET /api/vehicles/search?licensePlate=&vehicleType=
async function searchVehicles(req, res, next) {
    try {
        const { licensePlate = null, vehicleType = null } = req.query;
        const [rows] = await pool.query("CALL sp_SearchVehicles(?, ?)", [
            licensePlate || null,
            vehicleType  || null,
        ]);
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
}

// POST /api/vehicles
async function createVehicle(req, res, next) {
    try {
        const { licensePlate, vehicleType, licenseExpiryDate, maxWeightCapacity } = req.body;
        const [rows] = await pool.query("CALL sp_CreateVehicle(?, ?, ?, ?)", [
            licensePlate,
            vehicleType,
            licenseExpiryDate,
            maxWeightCapacity,
        ]);
        return res.status(201).json({ success: true, data: rows[0][0] });
    } catch (err) {
        next(err);
    }
}

// PUT /api/vehicles/:id
async function updateVehicle(req, res, next) {
    try {
        const { licensePlate, vehicleType, licenseExpiryDate, maxWeightCapacity } = req.body;
        const [rows] = await pool.query("CALL sp_UpdateVehicle(?, ?, ?, ?, ?)", [
            req.params.id,
            licensePlate,
            vehicleType,
            licenseExpiryDate,
            maxWeightCapacity,
        ]);
        return res.json({ success: true, data: rows[0][0] });
    } catch (err) {
        next(err);
    }
}

// DELETE /api/vehicles/:id
async function deleteVehicle(req, res, next) {
    try {
        // sp_DeleteVehicle chặn xóa nếu đã có ASSIGNMENT — lỗi được throw tự động
        const [rows] = await pool.query("CALL sp_DeleteVehicle(?)", [req.params.id]);
        return res.json({ success: true, data: rows[0][0] });
    } catch (err) {
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
