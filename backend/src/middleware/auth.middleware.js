import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
	try {
		let token = null;

		// 1. Prioritize Authorization header (Bearer token)
		if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
			token = req.headers.authorization.split(" ")[1];
		}

		// 2. Fallback to cookie if Bearer token is missing
		if (!token && req.cookies && req.cookies.jwt) {
			token = req.cookies.jwt;
		}

		if (!token) {
			return res.status(401).json({ error: "Unauthorized - No Token Provided" });
		}

		try {
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			if (!decoded) {
				return res.status(401).json({ error: "Unauthorized - Invalid Token" });
			}

			const user = await User.findById(decoded.userId).select("-password");
			if (!user) {
				// User not found, clear potentially stale cookie
				res.cookie("jwt", "", { maxAge: 0 });
				return res.status(401).json({ error: "Session expired. Please log in again." });
			}

			req.user = user;
			next();
		} catch (verifyError) {
			// Token verification failed (expired or invalid)
			console.error("JWT Verification Error:", verifyError.message);

			// Clear the cookie if verification fails to prevent loops
			res.cookie("jwt", "", { maxAge: 0 });

			if (verifyError.name === "TokenExpiredError") {
				return res.status(401).json({ error: "Unauthorized - Token Expired" });
			}
			return res.status(401).json({ error: "Unauthorized - Invalid Token" });
		}
	} catch (error) {
		console.error("Error in protectRoute middleware: ", error.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
};