const express = require("express");
const staffController = require("../controllers/staff.controller");

const router = express.Router();

router.get("/", staffController.getAllStaff);
router.get("/:id", staffController.getStaffById);
router.post("/", staffController.createStaff);
router.put("/:id", staffController.updateStaff);
router.delete("/:id", staffController.deleteStaff);

module.exports = router;