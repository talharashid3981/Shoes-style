// =====================================================================
// utils/generateToken.js — FIXED
// =====================================================================
import jwt from 'jsonwebtoken';

export const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};