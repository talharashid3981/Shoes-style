// =====================================================================
// middleware/auth.js — FIXED (protect)
// =====================================================================

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
  let token;

  // ✅ Prefer cookie over Authorization header for browser clients.
  // Bearer token support kept for API clients (Postman, mobile apps).
  if (req.cookies?.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Select only the fields other middleware/controllers need
    // Exclude sensitive token fields that might be used in comparisons
    const user = await User.findById(decoded.id).select(
      '-password -emailVerificationToken -emailVerificationExpire -resetPasswordToken -resetPasswordExpire'
    );

    if (!user) {
      // ✅ FIX: Token is valid but user was deleted — treat as unauthorized
      return res.status(401).json({ success: false, message: 'Not authorized, account not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    // Distinguish token expiry from other errors for better frontend UX
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired, please log in again', expired: true });
    }
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

export default protect;