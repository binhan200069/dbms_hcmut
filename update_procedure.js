const mysql = require('mysql2/promise');
const fs = require('fs');

async function updateProcedure() {
  try {
    const pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'logistics_db',
      multipleStatements: true
    });

    const sql = fs.readFileSync('./update_dashboard_procedure.sql', 'utf8');
    await pool.query(sql);

    console.log('✅ Đã cập nhật stored procedure sp_DashboardStats');

    // Test lại
    const [rows] = await pool.query('CALL sp_DashboardStats()');
    console.log('KPI result sau khi update:', JSON.stringify(rows[0][0], null, 2));

    pool.end();
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  }
}

updateProcedure();