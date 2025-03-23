import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { param } from "express-validator"; // ✅ Validate request parameters
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeConnection,
} from "../controllers/friendController.js";

const router = express.Router();

// ✅ Send Friend Request
router.post(
  "/send/:id",
  protect,
  param("id").isMongoId().withMessage("Invalid user ID"), // ✅ Validate ID
  sendFriendRequest
);

// ✅ Accept Friend Request
router.post(
  "/accept/:id",
  protect,
  param("id").isMongoId().withMessage("Invalid user ID"), // ✅ Validate ID
  acceptFriendRequest
);

// ✅ Reject Friend Request
router.post(
  "/reject/:id",
  protect,
  param("id").isMongoId().withMessage("Invalid user ID"), // ✅ Validate ID
  rejectFriendRequest
);

// ✅ Remove Connection (Unfriend)
router.delete(
  "/remove/:id",
  protect,
  param("id").isMongoId().withMessage("Invalid user ID"), // ✅ Validate ID
  removeConnection
);

export default router;
