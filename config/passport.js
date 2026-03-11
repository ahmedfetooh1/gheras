const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const userModel = require('../models/user');

//Antigravity
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/users/auth/google/callback" // Updated to match Express route structure
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            // 1. Check if user already exists with this Google ID
            let user = await userModel.findOne({ googleId: profile.id });
            if (user) {
                return done(null, user);
            }

            // 2. Check if user exists with this email but signed up normally
            user = await userModel.findOne({ email: profile.emails[0].value });
            if (user) {
                user.googleId = profile.id;
                user.isVerified = true; // Mark as verified since they logged in via Google
                await user.save();
                return done(null, user);
            }

            // 3. Create a new user if not found at all
            const newUsername = profile.displayName || profile.emails[0].value.split('@')[0];
            const firstName = profile.name.givenName || profile.displayName.split(' ')[0] || "User";
            const lastName = profile.name.familyName || profile.displayName.split(' ')[1] || "Gheras";

            user = await userModel.create({
                googleId: profile.id,
                username: newUsername.substring(0, 14), // Respecting the 14 chars limit in Schema
                email: profile.emails[0].value,
                firstName: firstName,
                lastName: lastName,
                isVerified: true
            });
            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const user = await userModel.findById(id);
    done(null, user);
});
