/**
 * mockAuth.middleware.js
 * Đọc mock user từ request headers.
 * Frontend truyền: x-mock-user-id và x-mock-role
 * KHÔNG có JWT, KHÔNG có mật khẩu.
 */

// Map cứng role → userId mặc định (khớp seed data)
const ROLE_DEFAULTS = {
    STAFF:    { userId: 1,  name: "Nguyễn Văn A" },
    CUSTOMER: { userId: 6,  name: "Công ty TNHH ABC" },
    DRIVER:   { userId: 11, name: "Cường Vong" },
};

const VALID_ROLES = ["STAFF", "CUSTOMER", "DRIVER"];

/**
 * Gắn req.mockUser = { userId, role, name } vào mọi request.
 * Nếu header không hợp lệ → default về STAFF.
 */
function mockAuthMiddleware(req, res, next) {
    const rawRole   = (req.headers["x-mock-role"]    || "STAFF").toUpperCase();
    const rawUserId =  req.headers["x-mock-user-id"];

    const role = VALID_ROLES.includes(rawRole) ? rawRole : "STAFF";
    const defaults = ROLE_DEFAULTS[role];

    // Nếu frontend truyền userId cụ thể thì dùng, ngược lại dùng default
    const userId = rawUserId && !isNaN(Number(rawUserId))
        ? Number(rawUserId)
        : defaults.userId;

    req.mockUser = { userId, role, name: defaults.name };
    next();
}

/**
 * requireRole(...roles) — Middleware bảo vệ route theo role.
 * Ví dụ: router.delete("/", requireRole("STAFF"), controller)
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.mockUser) {
            return res.status(401).json({
                success: false,
                message: "Lỗi xác thực: Không tìm thấy thông tin người dùng.",
            });
        }
        if (!allowedRoles.includes(req.mockUser.role)) {
            return res.status(403).json({
                success: false,
                message: `Lỗi phân quyền: Vai trò "${req.mockUser.role}" không được phép thực hiện thao tác này. Chỉ dành cho: ${allowedRoles.join(", ")}.`,
            });
        }
        next();
    };
}

module.exports = { mockAuthMiddleware, requireRole };
