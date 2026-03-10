import jwt from "jsonwebtoken";
import cookie from "cookie";
import User from "../models/user.model.js";

/**
 * Middleware to authenticate socket connections using JWT from cookies.
 */
export const socketAuthMiddleware = async (socket, next) => {
    try {
        let token = null;

        // 1. Try to get token from cookies
        const headerCookie = socket.handshake.headers.cookie;
        if (headerCookie) {
            const cookies = cookie.parse(headerCookie);
            token = cookies.accessToken;
        }

        // 2. Fallback to Authorization header (Bearer token)
        if (!token) {
            const authHeader = socket.handshake.auth?.token || socket.handshake.headers.authorization;
            if (authHeader && authHeader.startsWith("Bearer ")) {
                token = authHeader.split(" ")[1];
            }
        }

        // 3. Optional: Verify CSRF header during handshake for non-GET-like upgrade requests
        // Note: Socket.io upgrades are usually GET, but we can check for consistency
        const csrfHeader = socket.handshake.headers["x-genchat-requested-with"];
        if (!token) {
            console.warn("⚠️ Socket connection rejected: Access token missing.");
            return next(new Error("Authentication error: Access token missing"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.userId) {
            console.warn("⚠️ Socket connection rejected: Invalid token payload.");
            return next(new Error("Authentication error: Invalid token"));
        }

        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            console.warn("⚠️ Socket connection rejected: User not found in database.");
            return next(new Error("Authentication error: User not found"));
        }

        // Attach user to socket for later use
        socket.user = user;
        next();
    } catch (error) {
        console.error("❌ Socket Authentication Middleware Error:", error.message);
        next(new Error("Authentication error: Session expired or invalid"));
    }
};
