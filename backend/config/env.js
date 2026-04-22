import { config } from "dotenv";

// ✅ Load correct env file
config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});

// ✅ Fallback to .env if above not found
config();

export const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL = "http://localhost:8000/api/auth/google/callback",
  FRONTEND_URL = "http://localhost:5173",
} = process.env;

// ✅ Debug log (optional)
if (!GOOGLE_CLIENT_ID) {
  console.warn("❌ GOOGLE_CLIENT_ID is missing");
}
if (!GOOGLE_CLIENT_SECRET) {
  console.warn("❌ GOOGLE_CLIENT_SECRET is missing");
}
if (!FRONTEND_URL) {
  console.warn("❌ FRONTEND_URL is missing");
}