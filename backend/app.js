const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes");
const errorHandler = require("./middlewares/error.middleware");
const { mockAuthMiddleware } = require("./middlewares/mockAuth.middleware");

const app = express();

// ── CORS: cho phép Frontend dev server gọi API ─────────────────────────────
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-mock-user-id", "x-mock-role", "x-user-role"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Mock Auth: gắn req.mockUser vào mọi request ────────────────────────────
app.use(mockAuthMiddleware);

// ── Root endpoint ──────────────────────────────────────────────────────────
app.get("/", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Logistics API Server",
        version: "1.0.0",
        health: "ok",
        endpoints: {
            health: "GET /api/health",
            vehicles: "GET /api/vehicles",
            orders: "GET /api/orders",
            shipments: "GET /api/shipments",
            tracking: "GET /api/tracking",
            dashboard: "GET /api/dashboard",
            lookup: "GET /api/lookup",
        },
    });
});

// ── Health check ───────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Logistics API đang hoạt động ✅",
        mockUser: req.mockUser,
        timestamp: new Date().toISOString(),
    });
});

// ── API Routes ─────────────────────────────────────────────────────────────
app.use("/api", apiRoutes);

// ── 404 ────────────────────────────────────────────────────────────────────
app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: `Không tìm thấy endpoint: ${req.method} ${req.originalUrl}`,
    });
});

// ── Global Error Handler (bắt lỗi MySQL SIGNAL) ────────────────────────────
app.use(errorHandler);

module.exports = app;
