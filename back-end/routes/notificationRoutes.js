const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

router.get("/:userId", notificationController.getNotifications);
router.put("/read/:notificationId", notificationController.markAsRead);
router.put("/mark-all-read/:userId", notificationController.markAllAsRead);
module.exports = router;
