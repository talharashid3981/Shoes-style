// =====================================================================
// middleware/optionalAuth.js — FIXED
// =====================================================================
//
// Used on routes that serve BOTH logged-in users and guests.
// Examples: cart, wishlist, recently-viewed, checkout.
//
// Behaviour:
//  - Token present & valid   → sets req.user, continues
//  - Token present & expired → clears the stale cookie, continues as guest
//  - Token present & invalid → ignores token, continues as guest
//  - No token                → continues as guest (req.user stays undefined)

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const optionalAuth = async (req, res, next) => {
  let token;

  if (req.cookies?.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    // No token at all — proceed as guest, no logging needed in production
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select(
      '-password -emailVerificationToken -emailVerificationExpire -resetPasswordToken -resetPasswordExpire'
    );

    if (user) {
      req.user = user;
    }
    // If user not found (deleted account), silently proceed as guest
  } catch (error) {
    // ✅ If token is expired, proactively clear the stale cookie so the
    // browser stops sending it on every request
    if (error.name === 'TokenExpiredError') {
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      });
    }
    // All token errors are silent — guest access continues normally
  }

  next();
};

export default optionalAuth;