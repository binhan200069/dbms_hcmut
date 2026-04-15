function errorHandler(err, req, res, next) {
    if (err && err.sqlMessage) {
        return res.status(400).json({ message: err.sqlMessage });
    }

    if (err && err.statusCode) {
        return res.status(err.statusCode).json({ message: err.message });
    }

    console.error(err);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ." });
}

module.exports = errorHandler;
