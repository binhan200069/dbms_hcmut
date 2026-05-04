/**
 * lookup.controller.js
 * Các API tra cứu dữ liệu nền: Location, Route, Item, Driver, Customer, Staff
 * Dùng cho dropdown trong các form của Frontend.
 */
const pool = require("../config/db");

// GET /api/lookup/locations
async function getLocations(req, res, next) {
    try {
        const [rows] = await pool.query(
            "SELECT LocationId, LocationName, Address, LocationType, Latitude, Longitude FROM LOCATION ORDER BY LocationName"
        );
        return res.json({ success: true, data: rows });
    } catch (err) { next(err); }
}

// GET /api/lookup/routes
async function getRoutes(req, res, next) {
    try {
        const [rows] = await pool.query(
            "SELECT RouteId, RouteName, RouteType, TransitTime FROM ROUTE ORDER BY RouteName"
        );
        return res.json({ success: true, data: rows });
    } catch (err) { next(err); }
}

// GET /api/lookup/items
async function getItems(req, res, next) {
    try {
        const [rows] = await pool.query(
            "SELECT ItemId, Description, Weight, Unit FROM ITEM ORDER BY Description"
        );
        return res.json({ success: true, data: rows });
    } catch (err) { next(err); }
}

// GET /api/lookup/drivers
async function getDrivers(req, res, next) {
    try {
        const [rows] = await pool.query(
            `SELECT d.UserId, u.Name, d.LicenseNumber, d.LicenseClass, d.LicenseExpiryDate,
                    IF(d.LicenseExpiryDate >= CURDATE(), 'Còn hạn', 'Hết hạn') AS LicenseStatus
             FROM DRIVER d
             INNER JOIN \`USER\` u ON d.UserId = u.UserId
             WHERE u.Status = 1
             ORDER BY u.Name`
        );
        return res.json({ success: true, data: rows });
    } catch (err) { next(err); }
}

// GET /api/lookup/customers
async function getCustomers(req, res, next) {
    try {
        const [rows] = await pool.query(
            `SELECT c.UserId, u.Name, u.Email, c.CustomerType, c.PayTerm, c.CreditLimit
             FROM CUSTOMER c
             INNER JOIN \`USER\` u ON c.UserId = u.UserId
             WHERE u.Status = 1
             ORDER BY u.Name`
        );
        return res.json({ success: true, data: rows });
    } catch (err) { next(err); }
}

// GET /api/lookup/staff
async function getStaff(req, res, next) {
    try {
        const [rows] = await pool.query(
            `SELECT s.UserId, u.Name, s.Position, s.Department
             FROM STAFF s
             INNER JOIN \`USER\` u ON s.UserId = u.UserId
             WHERE u.Status = 1
             ORDER BY u.Name`
        );
        return res.json({ success: true, data: rows });
    } catch (err) { next(err); }
}

// GET /api/lookup/warehouses
async function getWarehouses(req, res, next) {
    try {
        const [rows] = await pool.query(
            `SELECT w.WarehouseId, w.WarehouseName, w.WarehouseType, w.Capacity,
                    l.LocationName, l.Address
             FROM WAREHOUSE w
             INNER JOIN LOCATION l ON w.LocationId = l.LocationId
             ORDER BY w.WarehouseName`
        );
        return res.json({ success: true, data: rows });
    } catch (err) { next(err); }
}

module.exports = {
    getLocations, getRoutes, getItems,
    getDrivers, getCustomers, getStaff, getWarehouses,
};
