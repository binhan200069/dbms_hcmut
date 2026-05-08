/**
 * dashboard.controller.js
 * Thống kê tổng quan Dashboard và báo cáo.
 */
const pool = require("../config/db");

// GET /api/dashboard/stats?month=&year=
async function getDashboardStats(req, res, next) {
    try {
        const { month = null, year = null } = req.query;
        // sp_DashboardStats trả 5 result sets
        const [rows] = await pool.query("CALL sp_DashboardStats()");
        return res.json({
            success: true,
            data: {
                kpis:           rows[0][0],  // Card KPI tổng
                revenueChart:   rows[1],     // Doanh thu 6 tháng
                statusChart:    rows[2],     // Phân phối trạng thái đơn
                topCustomers:   rows[3],     // Top 5 KH
                recentOrders:   rows[4],     // 5 đơn mới nhất
            },
        });
    } catch (err) {
        next(err);
    }
}

// GET /api/dashboard/revenue?year=
async function getMonthlyRevenue(req, res, next) {
    try {
        const { year = null } = req.query;
        const [rows] = await pool.query("CALL sp_GetMonthlyRevenue(?)", [year || null]);
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
}

// GET /api/dashboard/driver-bonus/:driverId?month=&year=
async function getDriverBonus(req, res, next) {
    try {
        const { month = null, year = null } = req.query;
        const [rows] = await pool.query(
            "SELECT fn_CalculateDriverBonus(?, ?, ?) AS Bonus",
            [req.params.driverId, month || null, year || null]
        );
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
}

module.exports = { getDashboardStats, getMonthlyRevenue, getDriverBonus };
