import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

// Local Strategy for Login
passport.use(
    new LocalStrategy(
        {
            usernameField: "email",
            passwordField: "password",
        },
        async (email, password, done) => {
            try {
                const user = await User.findOne({ email });
                if (!user) {
                    return done(null, false, { message: "Invalid credentials" });
                }

                const isPasswordCorrect = await bcrypt.compare(password, user.password);
                if (!isPasswordCorrect) {
                    return done(null, false, { message: "Invalid credentials" });
                }

                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }
    )
);

// JWT Strategy for Authorization
const jwtOptions = {
    jwtFromRequest: (req) => {
        let token = null;
        if (req && req.cookies) {
            token = req.cookies["accessToken"];
        }
        if (!token && req.headers.authorization) {
            token = req.headers.authorization.split(" ")[1];
        }
        return token;
    },
    secretOrKey: process.env.JWT_SECRET,
};

passport.use(
    new JwtStrategy(jwtOptions, async (payload, done) => {
        try {
            const user = await User.findById(payload.userId).select("-password");
            if (user) {
                return done(null, user);
            }
            return done(null, false);
        } catch (error) {
            return done(error, false);
        }
    })
);

export default passport;
