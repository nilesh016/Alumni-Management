import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

// ✅ Middleware to protect routes (Requires valid token)
export const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } 
  // Check for token in cookies (secure alternative)
  else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    console.warn("⚠️ Unauthorized Access: No token provided");
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      console.warn("⚠️ Unauthorized Access: User not found");
      return res.status(401).json({ message: "User not found, authorization failed" });
    }

    return next(); // Move to next middleware
  } catch (error) {
    console.error("❌ Token Error:", error.message);
    return res.status(401).json({ message: "Not authorized, token invalid or expired" });
  }
};

// ✅ Middleware to check if the user has a specific role
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized, user data missing" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied, requires role: ${roles.join(", ")}` });
    }

    return next();
  };
};
