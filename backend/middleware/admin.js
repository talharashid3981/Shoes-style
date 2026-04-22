// =====================================================================
// middleware/admin.js — FIXED
// =====================================================================
//
// ✅ FIX: Original middleware only checked req.user.role but never
// guarded against req.user being undefined — if this middleware runs
// without `protect` before it, it would either crash or silently 403.
//
// The correct pattern is: always use protect THEN admin.
// We add a defensive check anyway for safety.

const admin = (req, res, next) => {
  if (!req.user) {
    // This should never happen if routes use protect → admin correctly,
    // but if admin middleware is used standalone, return 401 not 403
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized as admin' });
  }

  next();
};

export default admin;