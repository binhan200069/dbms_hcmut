const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes");
const errorHandler = require("./middlewares/error.middleware");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
    return res.status(200).json({ message: "API Logistics đang hoạt động." });
});

app.use("/api", apiRoutes);

app.use((req, res) => {
    return res.status(404).json({ message: "Không tìm thấy endpoint." });
});

app.use(errorHandler);

module.exports = app;
