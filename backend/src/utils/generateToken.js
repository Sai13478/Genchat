import jwt from "jsonwebtoken";

const generateTokenAndSetCookie = (userId, res) => {
	try {
		// ✅ Create JWT
		const token = jwt.sign(
			{ userId }, // payload
			process.env.JWT_SECRET, // secret key
			{ expiresIn: "7d" } // options
		);

		// ✅ Set as cookie
		res.cookie("jwt", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		});

		// Optional: log to confirm
		console.log("JWT generated for user:", userId);
	} catch (err) {
		console.error("Error generating token:", err);
	}
};

export default generateTokenAndSetCookie;
