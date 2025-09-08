import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const protectRoute = async (req, res, next) => {
	try {
		const token = req.cookies.jwt;

		if (!token) {
			return res.status(401).json({ error: "Unauthorized - No Token Provided" });
		}

		// ✅ Verify token
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		// ✅ Find user
		const user = await User.findById(decoded.userId).select("-password");
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		req.user = user;
		next();
	} catch (error) {
		console.error("Error in protectRoute middleware:", error.message);
		res.status(401).json({ error: "Unauthorized - Invalid Token" });
	}
};

export default protectRoute;
