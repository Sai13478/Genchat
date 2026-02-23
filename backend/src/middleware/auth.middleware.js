import passport from "passport";

export const protectRoute = (req, res, next) => {
	passport.authenticate("jwt", { session: false }, (err, user, info) => {
		if (err) {
			console.error("error in protectRoute middleware:", err);
			return res.status(500).json({ error: "Internal Server Error" });
		}

		if (!user) {
			return res.status(401).json({ error: "Unauthorized - Invalid or Expired Token" });
		}

		req.user = user;
		next();
	})(req, res, next);
};