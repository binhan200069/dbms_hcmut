const express = require("express");
const orderRoutes = require("./order.routes");
const userRoutes = require("./user.routes");

const router = express.Router();

router.use("/orders", orderRoutes);
router.use("/users", userRoutes);

module.exports = router;
