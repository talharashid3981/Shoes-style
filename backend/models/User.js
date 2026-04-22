import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String },
    googleId: { type: String },
    avatar: { type: String, default: "" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    addresses: [
      {
        name: String,
        addressLine1: { type: String, required: true },
        addressLine2: String,
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true, default: "India" },
        phone: { type: String, required: true },
        isDefault: { type: Boolean, default: false },
      },
    ],
    newsletterPreferences: {
      subscribed: { type: Boolean, default: false },
      preferences: [String], // e.g., ['mens', 'womens', 'offers']
    },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
