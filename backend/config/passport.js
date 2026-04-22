import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
} from "./env.js";

// ✅ Only initialize if credentials exist
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;

          if (!email) {
            return done(new Error("No email found in Google profile"), null);
          }

          let user = await User.findOne({ email });

          if (!user) {
            user = await User.create({
              name: profile.displayName,
              email,
              googleId: profile.id,
              avatar: profile.photos?.[0]?.value || "",
              isEmailVerified: true,
            });
          } else if (!user.googleId) {
            user.googleId = profile.id;
            if (!user.avatar && profile.photos?.[0]?.value) {
              user.avatar = profile.photos[0].value;
            }
            user.isEmailVerified = true;
            await user.save();
          }

          const token = generateToken(user._id);

          return done(null, {
            userId: user._id,
            token,
          });
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
} else {
  console.warn("⚠️ Google OAuth not initialized (missing credentials)");
}

// ✅ NOTE: serializeUser/deserializeUser are only needed for session-based auth
// Since this app uses JWT tokens in cookies (stateless), these are not used
// Keeping commented for reference if session auth is needed in future
//
// passport.serializeUser((data, done) => done(null, data));
// passport.deserializeUser((data, done) => done(null, data));

export default passport;