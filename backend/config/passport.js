const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const userModel = require('../models/user');

// Google OAuth can be optional for local testing.
// If env vars are missing, don't crash the whole backend.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL:
                    "http://localhost:3000/users/auth/google/callback",
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // 1) Check if user already exists with this Google ID
                    let user = await userModel.findOne({ googleId: profile.id });
                    if (user) return done(null, user);

                    // 2) Check if user exists by email
                    const email = profile.emails?.[0]?.value;
                    if (!email) return done(null, false);

                    user = await userModel.findOne({ email });
                    if (user) {
                        user.googleId = profile.id;
                        user.isVerified = true; // mark verified when logging via Google
                        await user.save();
                        return done(null, user);
                    }

                    // 3) Create a new user
                    const newUsername =
                        profile.displayName || email.split('@')[0];
                    const firstName =
                        profile.name?.givenName ||
                        profile.displayName.split(' ')[0] ||
                        'User';
                    const lastName =
                        profile.name?.familyName ||
                        profile.displayName.split(' ')[1] ||
                        'Gheras';

                    user = await userModel.create({
                        googleId: profile.id,
                        username: newUsername.substring(0, 14),
                        email,
                        firstName,
                        lastName,
                        isVerified: true,
                    });

                    return done(null, user);
                } catch (err) {
                    return done(err, null);
                }
            }
        )
    );
} else {
    console.warn(
        '[passport] GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET missing; Google OAuth disabled.'
    );
}

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const user = await userModel.findById(id);
    done(null, user);
});
