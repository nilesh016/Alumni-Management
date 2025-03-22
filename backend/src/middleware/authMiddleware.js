import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

// ✅ Middleware to protect routes (Requires valid token)
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User not found, authorization failed" });
      }

      return next(); // Move to next middleware
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token invalid or expired" });
    }
  }

  return res.status(401).json({ message: "Not authorized, no token provided" });
};

// ✅ Middleware to check if the user is an admin
export const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    return next();
  }
  return res.status(403).json({ message: "Not authorized as admin" });
};
