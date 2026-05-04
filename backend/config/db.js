const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host:     process.env.DB_HOST     || "localhost",
    port:     process.env.DB_PORT     || 3306,
    user:     process.env.DB_USER     || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME     || "logistics_db",
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
    timezone:           "+07:00",
    charset:            "utf8mb4",
});

// Test connection on startup
pool.getConnection()
    .then(conn => {
        console.log("✅ Kết nối MySQL thành công — logistics_db");
        conn.release();
    })
    .catch(err => {
        console.error("❌ Kết nối MySQL thất bại:", err.message);
    });

module.exports = pool;
