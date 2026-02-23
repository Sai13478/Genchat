import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
	try {
		let token = req.cookies.jwt;

		// Fallback to Authorization header if cookie is missing
		if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
			token = req.headers.authorization.split(" ")[1];
		}

		if (!token) {
			return res.status(401).json({ error: "Unauthorized - No Token Provided" });
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		if (!decoded) {
			return res.status(401).json({ error: "Unauthorized - Invalid Token" });
		}

		const user = await User.findById(decoded.userId).select("-password");
		if (!user) {
			res.cookie("jwt", "", { maxAge: 0 });
			return res.status(401).json({ error: "Session expired. Please log in again." });
		}

		req.user = user;
		next();
	} catch (error) {
		console.error("Error in protectRoute middleware: ", error.message);
		if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
			return res.status(401).json({ error: "Unauthorized - Invalid or Expired Token" });
		}
		res.status(500).json({ error: "Internal Server Error" });
	}
};