const pool = require("../config/db");

// GET /api/staff - Lấy tất cả staff
async function getAllStaff(req, res, next) {
    try {
        const [rows] = await pool.query("CALL sp_GetAllStaff()");
        return res.json({ success: true, data: rows[0] });
    }
    catch (err) {
        next(err);
    }
}

// GET /api/staff/:id - Lấy staff theo ID
async function getStaffById(req, res, next) {
    try {
        const staffId = Number.parseInt(req.params.id, 10);
        if (!staffId || staffId <= 0) {
            return res.status(400).json({ message: "Invalid staff id." });
        }

        const [rows] = await pool.query("CALL sp_GetStaffById(?)", [staffId]);
        if (!rows[0] || rows[0].length === 0) {
            return res.status(404).json({ message: "Staff not found." });
        }

        return res.json({ success: true, data: rows[0][0] });
    } catch (err) {
        next(err);
    }
}

// POST /api/staff - Tạo staff mới
async function createStaff(req, res, next) {
    try {
        const {name, account, email, address, position, department, phone} = req.body;
        
        if (!name || !email) {
            return res.status(400).json({ message: "Name and email are required." });
        }
        await pool.query("CALL sp_CreateStaff(?, ?, ?, ?, ?, ?, ?)", 
            [name, account, email, address, position, department, phone]);
        return res.status(201).json({ success: true, message: "Staff created successfully." });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: "Account already exists."
            })
        }
        next(err);
    }
}

// PUT /api/staff/:id - Cập nhật staff
async function updateStaff(req, res, next) {
    console.log(req.body);
    try {
        const staffId = Number.parseInt(req.params.id, 10);
        const {name, address, position, department, phone} = req.body;

        if (!staffId || staffId <= 0) {
            return res.status(400).json({ message: "Invalid staff id." });
        }

        await pool.query("CALL sp_UpdateStaff(?, ?, ?, ?, ?, ?)", 
            [staffId, name, address, position, department, phone]);
        return res.json({ success: true, message: "Staff updated successfully." });
    } catch (err) {
        next(err);
    }
}

// DELETE /api/staff/:id - Xóa staff
async function deleteStaff(req, res, next) {
    try {
        const staffId = parseInt(req.params.id);
        if (!staffId || isNaN(staffId)) {
            return res.status(400).json({ message: "Invalid staff id." });
        }

        await pool.query("CALL sp_DeleteStaff(?)", [staffId]);
        return res.json({ success: true, message: "Deleted Staff Successfully." });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getAllStaff,
    getStaffById,
    createStaff,
    updateStaff,
    deleteStaff
};