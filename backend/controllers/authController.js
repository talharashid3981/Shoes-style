import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { sendEmail } from '../utils/sendEmail.js';
import crypto from 'crypto';
import { hashPassword, comparePassword } from '../utils/passwordUtils.js';

// ─── Cookie Helper ────────────────────────────────────────────────────────────
// ✅ Centralized cookie config — consistent across all auth endpoints
const TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};


const CLEAR_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  expires: new Date(0),
};

// ─── Register ────────────────────────────────────────────────────────────────
// @route   POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ✅ Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      emailVerificationToken,
      emailVerificationExpire,
    });

    // ✅ Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify your email — Sole Style',
      html: `
        <h2>Welcome to Sole Style!</h2>
        <p>Please verify your email address by clicking the link below.</p>
        <p>This link expires in 24 hours.</p>
        <a href="${verificationUrl}" style="
          display: inline-block;
          padding: 12px 24px;
          background: #000;
          color: #fff;
          text-decoration: none;
          border-radius: 4px;
        ">Verify Email</a>
        <p>If you didn't create this account, you can ignore this email.</p>
      `,
    });

    // ✅ FIX: Do NOT set JWT cookie at registration.
    // The user's email is unverified. Issue a lightweight "registered" response
    // so the frontend knows to show "check your email" instead of logging them in.
    res.status(201).json({
      success: true,
      message: 'Account created. Please check your email to verify your account.',
      email: user.email,
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────
// @route   POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // ✅ Generic message — don't reveal which field is wrong
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // ✅ Google-only accounts have no password
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google sign-in. Please continue with Google.',
      });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

  

    const token = generateToken(user._id);

    // ✅ Consistent, secure cookie options
    res.cookie('token', token, TOKEN_COOKIE_OPTIONS);

    
    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Logout ──────────────────────────────────────────────────────────────────
// @route   POST /api/auth/logout
export const logout = (req, res) => {
  // ✅ FIX: Must use same options as set — secure+sameSite MUST match
  // A cookie set with `secure: true` can only be cleared with `secure: true`
  res.cookie('token', '', CLEAR_COOKIE_OPTIONS);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// ─── Get Profile ─────────────────────────────────────────────────────────────
// @route   GET /api/auth/profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -emailVerificationToken -emailVerificationExpire -resetPasswordToken -resetPasswordExpire');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Update Profile ───────────────────────────────────────────────────────────
// @route   PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // ✅ Allow name update freely
    if (req.body.name) user.name = req.body.name;

    // ✅ FIX: Email change requires re-verification
    // Silently updating email could let a user claim another person's email.
    // For now we block email change via profile update.
    // If you want to allow it, add a new "change email" flow with verification.
    if (req.body.email && req.body.email.toLowerCase() !== user.email) {
      return res.status(400).json({
        success: false,
        message: 'Email cannot be changed via profile update. Contact support.',
      });
    }

    if (req.body.password) {
      if (req.body.password.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
      }
      user.password = await hashPassword(req.body.password);
    }

    if (req.body.avatar) {
      user.avatar = req.body.avatar;
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
      },
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Verify Email ─────────────────────────────────────────────────────────────
// @route   GET /api/auth/verify-email/:token
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    // ✅ FIX: Auto-login user after successful email verification
    // The whole point of clicking the link is to get into the app.
    // Returning just a JSON message forces the user to manually log in again.
    const jwtToken = generateToken(user._id);
    res.cookie('token', jwtToken, TOKEN_COOKIE_OPTIONS);

    res.json({ success: true, message: 'Email verified successfully. You are now logged in.' });

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Resend Verification Email ────────────────────────────────────────────────
// @route   POST /api/auth/resend-verification
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // ✅ Don't reveal whether email exists
      return res.json({ success: true, message: 'If this email exists, a verification link has been sent.' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified' });
    }

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify your email — Sole Style',
      html: `
        <p>Click the link below to verify your email address. This link expires in 24 hours.</p>
        <a href="${verificationUrl}">Verify Email</a>
      `,
    });

    res.json({ success: true, message: 'If this email exists, a verification link has been sent.' });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // ✅ Always return success — don't reveal whether email exists (prevents user enumeration)
    if (!user) {
      return res.json({ success: true, message: 'If this email exists, a password reset link has been sent.' });
    }

    // ✅ Google-only accounts have no password to reset
    if (!user.password && user.googleId) {
      return res.json({ success: true, message: 'If this email exists, a password reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // ✅ FIX: sendEmail now throws on failure so we can handle it properly
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset — Sole Style',
        html: `
          <h2>Password Reset Request</h2>
          <p>Click the link below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="
            display: inline-block;
            padding: 12px 24px;
            background: #000;
            color: #fff;
            text-decoration: none;
            border-radius: 4px;
          ">Reset Password</a>
          <p>If you didn't request a password reset, you can ignore this email.</p>
        `,
      });
    } catch (emailError) {
      // ✅ If email fails, clear the token so they can retry
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      console.error('Forgot password email failed:', emailError);
      return res.status(500).json({ success: false, message: 'Failed to send reset email. Please try again.' });
    }

    res.json({ success: true, message: 'If this email exists, a password reset link has been sent.' });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────────
// @route   POST /api/auth/reset-password/:token
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = await hashPassword(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // ✅ Auto-login after password reset — better UX
    const jwtToken = generateToken(user._id);
    res.cookie('token', jwtToken, TOKEN_COOKIE_OPTIONS);

    res.json({
      success: true,
      message: 'Password reset successful.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};