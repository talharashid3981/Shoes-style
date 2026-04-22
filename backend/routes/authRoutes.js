import express from 'express';
import {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import protect from '../middleware/auth.js';
import passport from 'passport';

const router = express.Router();

// ─── Standard Auth ────────────────────────────────────────────────────────────
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// ─── Email Verification ───────────────────────────────────────────────────────
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

// ─── Password Reset ───────────────────────────────────────────────────────────
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);



// ─── Google OAuth ─────────────────────────────────────────────────────────────

// Step 1: Redirect user to Google consent screen
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

// Step 2: Google redirects back here after user consents
router.get(
  '/google/callback',
  // ✅ FIX: failureRedirect must go to FRONTEND, not backend
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
  }),
  (req, res) => {
    // ✅ CRITICAL FIX: NEVER put the token in the redirect URL.
    // Tokens in URLs are stored in:
    //   - Browser history
    //   - Server access logs
    //   - HTTP Referer headers on next navigation
    //   - Monitoring/analytics tools
    //
    // The correct pattern: set the httpOnly cookie, redirect to frontend.
    // The frontend then calls GET /api/auth/profile (with credentials) to
    // retrieve the logged-in user's data.

    const { token } = req.user; // token was set in passport.js strategy

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // ✅ Redirect to frontend — no token in URL
    res.redirect(`${process.env.FRONTEND_URL}/auth/success`);
  }
);

export default router;