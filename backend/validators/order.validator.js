function parsePositiveInt(value, fieldName) {
    const parsed = Number.parseInt(value, 10);

    if (!Number.isInteger(parsed) || parsed <= 0) {
        const error = new Error(`Lỗi: ${fieldName} không hợp lệ!`);
        error.statusCode = 400;
        throw error;
    }

    return parsed;
}

function parseStatusFilter(value) {
    if (typeof value !== "string") {
        return "ALL";
    }

    const normalized = value.trim();
    return normalized === "" ? "ALL" : normalized;
}

function requireNonEmptyText(value, message) {
    const normalized = String(value || "").trim();

    if (!normalized) {
        const error = new Error(message);
        error.statusCode = 400;
        throw error;
    }

    return normalized;
}

function parseFreightCost(value) {
    const freightCost = Number(value);

    if (!Number.isFinite(freightCost)) {
        const error = new Error("Lỗi: Chi phí vận chuyển không hợp lệ!");
        error.statusCode = 400;
        throw error;
    }

    return freightCost;
}

module.exports = {
    parsePositiveInt,
    parseStatusFilter,
    requireNonEmptyText,
    parseFreightCost
};
