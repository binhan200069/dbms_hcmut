/**
 * error.middleware.js
 * Global error handler — bắt lỗi từ MySQL (SIGNAL SQLSTATE '45000')
 * và trả nguyên văn MESSAGE_TEXT tiếng Việt về Frontend.
 */
function errorHandler(err, req, res, next) {
    // Lỗi từ MySQL SIGNAL SQLSTATE '45000'
    const mysqlMsg = err.sqlMessage || err.message || "Đã xảy ra lỗi không xác định.";

    // MySQL error code ER_SIGNAL_EXCEPTION = 1644 (SQLSTATE 45000)
    const isMysqlSignal = err.errno === 1644 || err.sqlState === "45000";

    if (isMysqlSignal) {
        return res.status(400).json({
            success: false,
            message: mysqlMsg,
        });
    }

    // Lỗi kết nối / syntax MySQL
    if (err.code && err.code.startsWith("ER_")) {
        return res.status(500).json({
            success: false,
            message: `Lỗi cơ sở dữ liệu: ${mysqlMsg}`,
        });
    }

    // Lỗi chung
    console.error("[ERROR]", err);
    return res.status(500).json({
        success: false,
        message: mysqlMsg,
    });
}

module.exports = errorHandler;
