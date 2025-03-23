import express from "express";
import { body, param, validationResult } from "express-validator"; // 🔹 Input validation
import { 
  searchAlumni, 
  sendFriendRequest, 
  cancelFriendRequest, 
  acceptFriendRequest, 
  rejectFriendRequest, 
  removeConnection 
} from "../controllers/alumniController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Middleware: Validate Request ID
const validateUserId = [
  param("id").isMongoId().withMessage("Invalid user ID"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// ✅ Search Alumni (Public)
router.get("/search", searchAlumni);

// ✅ Send Friend Request (Protected)
router.post("/connect/:id", protect, validateUserId, sendFriendRequest);

// ✅ Cancel Friend Request (Protected)
router.delete("/cancel/:id", protect, validateUserId, cancelFriendRequest);

// ✅ Accept Friend Request (Protected)
router.put("/accept/:id", protect, validateUserId, acceptFriendRequest);

// ✅ Reject Friend Request (Protected)
router.put("/reject/:id", protect, validateUserId, rejectFriendRequest);

// ✅ Remove Connection (Protected)
router.delete("/remove/:id", protect, validateUserId, removeConnection);

export default router;
