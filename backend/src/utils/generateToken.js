import jwt from "jsonwebtoken";

const generateTokenAndSetCookie = (userId, res) => {
	const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
		expiresIn: "7d",
	});

	res.cookie("jwt", token, {
		maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in MS
		httpOnly: true, // prevent XSS attacks (cross-site scripting)
		sameSite: "None", // CSRF attacks (cross-site request forgery)
		secure: process.env.NODE_ENV === "production",
	});
};

export default generateTokenAndSetCookie;