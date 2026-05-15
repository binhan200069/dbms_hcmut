const pool = require('../config/db');

const vehicleService = {
  // Lấy danh sách tất cả xe
  getAllVehicles: async () => {
    const [rows] = await pool.execute(
      `SELECT vehicle_id, license_plate, vehicle_type, capacity_kg, status, notes 
       FROM VEHICLE 
       ORDER BY vehicle_id DESC`
    );
    return rows;
  },

  // Thêm xe mới
  createVehicle: async (data) => {
    const { license_plate, vehicle_type, capacity_kg, status, notes } = data;
    const [result] = await pool.execute(
      `INSERT INTO VEHICLE (license_plate, vehicle_type, capacity_kg, status, notes) 
       VALUES (?, ?, ?, ?, ?)`,
      [license_plate, vehicle_type, capacity_kg, status, notes]
    );
    return result.insertId;
  },

  // Cập nhật thông tin xe (Không cho sửa biển số theo logic UI)
  updateVehicle: async (id, data) => {
    const { vehicle_type, capacity_kg, status, notes } = data;
    const [result] = await pool.execute(
      `UPDATE VEHICLE 
       SET vehicle_type = ?, capacity_kg = ?, status = ?, notes = ? 
       WHERE vehicle_id = ?`,
      [vehicle_type, capacity_kg, status, notes, id]
    );
    return result.affectedRows;
  },

  // Xóa xe
  deleteVehicle: async (id) => {
    // Nếu DB có Trigger chặn xóa (ví dụ: xe đang có trong bảng ASSIGNMENT hoặc SHIPMENT)
    // Lệnh execute này sẽ văng ra lỗi (catch error) thẳng về Controller
    const [result] = await pool.execute(
      `DELETE FROM VEHICLE WHERE vehicle_id = ?`,
      [id]
    );
    return result.affectedRows;
  }
};

module.exports = vehicleService;