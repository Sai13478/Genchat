import User from "../models/user.model.js";
import RefreshToken from "../models/refresh-token.model.js";
import bcrypt from "bcryptjs";
import passport from "passport";
import jwt from "jsonwebtoken";
import { generateTokens, clearTokens } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";

// Helper function to generate a unique tag for a username
const generateUniqueTag = async (username) => {
	let tag;
	let isUnique = false;
	let attempts = 0;
	while (!isUnique && attempts < 10) {
		tag = Math.floor(1000 + Math.random() * 9000).toString();
		const existingUser = await User.findOne({ username, tag });
		if (!existingUser) {
			isUnique = true;
		}
		attempts++;
	}
	return isUnique ? tag : null;
};

export const signup = async (req, res) => {
	try {
		const { username, email, password, confirmPassword } = req.body;

		if (!username || !email || !password || !confirmPassword) {
			const missing = ["username", "email", "password", "confirmPassword"].filter(f => !req.body[f]);
			return res.status(400).json({ error: `Please provide all required fields. Missing: ${missing.join(", ")}` });
		}

		if (password !== confirmPassword) {
			return res.status(400).json({ error: "Passwords don't match" });
		}

		const existingEmail = await User.findOne({ email });
		if (existingEmail) {
			return res.status(409).json({ error: "Email already exists" });
		}

		const tag = await generateUniqueTag(username);
		if (!tag) {
			return res.status(500).json({ error: "Could not generate a unique tag." });
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		const newUser = new User({
			username,
			tag,
			email,
			password: hashedPassword,
		});

		await newUser.save();

		const deviceInfo = req.headers["user-agent"] || "unknown";
		const { accessToken, refreshToken } = await generateTokens(newUser._id, res, deviceInfo);

		res.status(201).json({
			_id: newUser._id,
			username: newUser.username,
			tag: newUser.tag,
			email: newUser.email,
			profilePic: newUser.profilePic,
			token: accessToken,
			refreshToken,
		});
	} catch (error) {
		console.error("Error in signup controller:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const login = (req, res, next) => {
	passport.authenticate("local", { session: false }, async (err, user, info) => {
		if (err) return next(err);
		if (!user) return res.status(400).json({ error: info.message || "Invalid credentials" });

		try {
			const deviceInfo = req.headers["user-agent"] || "unknown";
			const { accessToken, refreshToken } = await generateTokens(user._id, res, deviceInfo);

			res.status(200).json({
				_id: user._id,
				username: user.username,
				tag: user.tag,
				email: user.email,
				profilePic: user.profilePic,
				token: accessToken,
				refreshToken,
			});
		} catch (error) {
			console.error("Error in login controller:", error);
			res.status(500).json({ error: "Internal Server Error" });
		}
	})(req, res, next);
};

export const refreshToken = async (req, res) => {
	try {
		// Prefer body token (from localStorage) over cookie — cookies may be stale when
		// browser Tracking Prevention blocks cookie updates after rotation
		const token = req.body.refreshToken || req.cookies.refreshToken;
		if (!token) return res.status(401).json({ error: "Refresh Token required" });

		const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
		const storedToken = await RefreshToken.findOne({ token, user: payload.userId });

		if (!storedToken) {
			// Potential token reuse/leak? Revoke all tokens for this user for safety
			await RefreshToken.deleteMany({ user: payload.userId });
			clearTokens(res);
			return res.status(403).json({ error: "Token reuse detected. All sessions revoked." });
		}

		// Rotate token: Delete old one, create new one
		await RefreshToken.findByIdAndDelete(storedToken._id);

		const deviceInfo = req.headers["user-agent"] || "unknown";
		const { accessToken, refreshToken: newRefreshToken } = await generateTokens(payload.userId, res, deviceInfo);

		// Return both tokens in body so frontend can store in localStorage when cookies are blocked
		res.status(200).json({ token: accessToken, refreshToken: newRefreshToken });
	} catch (error) {
		console.error("Error in refreshToken controller:", error);
		clearTokens(res);
		res.status(401).json({ error: "Invalid or expired refresh token" });
	}
};

export const logout = async (req, res) => {
	try {
		const token = req.cookies.refreshToken;
		if (token) {
			await RefreshToken.deleteOne({ token });
		}
		clearTokens(res);
		res.status(200).json({ message: "Logged out successfully" });
	} catch (error) {
		console.error("Error in logout controller:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const logoutAllDevices = async (req, res) => {
	try {
		await RefreshToken.deleteMany({ user: req.user._id });
		clearTokens(res);
		res.status(200).json({ message: "Logged out from all devices" });
	} catch (error) {
		console.error("Error in logoutAllDevices controller:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const checkAuth = async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select("-password");
		if (!user) {
			clearTokens(res);
			return res.status(401).json({ error: "Session expired." });
		}
		res.status(200).json(user);
	} catch (error) {
		console.error("Error in checkAuth controller:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const updateProfile = async (req, res) => {
	try {
		const { profilePic, username, bio } = req.body;
		const userId = req.user._id;

		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });

		if (username) user.username = username;
		if (bio !== undefined) user.bio = bio;

		if (profilePic) {
			if (user.profilePic) {
				const publicId = user.profilePic.split("/").pop().split(".")[0];
				try {
					await cloudinary.uploader.destroy(`profile_pics/${publicId}`);
				} catch (destroyError) {
					console.error("Cloudinary destroy error:", destroyError);
				}
			}

			const uploadedResponse = await cloudinary.uploader.upload(profilePic, {
				folder: "profile_pics",
				width: 250,
				height: 250,
				crop: "fill",
			});
			user.profilePic = uploadedResponse.secure_url;
		}

		await user.save();

		const userResponse = {
			_id: user._id,
			username: user.username,
			tag: user.tag,
			email: user.email,
			profilePic: user.profilePic,
			bio: user.bio,
			settings: user.settings
		};
		res.status(200).json({ message: "Profile updated successfully", user: userResponse });
	} catch (error) {
		console.error("Error in updateProfile controller:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};
export const updateSettings = async (req, res) => {
	try {
		const { settings } = req.body;
		const userId = req.user._id;

		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });

		// Deep merge or direct assign settings
		if (settings) {
			user.settings = {
				...user.settings,
				...settings,
				accessibility: { ...user.settings.accessibility, ...settings.accessibility },
				privacy: { ...user.settings.privacy, ...settings.privacy },
				notifications: { ...user.settings.notifications, ...settings.notifications },
			};
		}

		await user.save();
		res.status(200).json({ message: "Settings updated successfully", settings: user.settings });
	} catch (error) {
		console.error("Error in updateSettings controller:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const getSessions = async (req, res) => {
	try {
		const sessions = await RefreshToken.find({ user: req.user._id });
		const formattedSessions = sessions.map(s => ({
			_id: s._id,
			device: s.device || "Unknown Device",
			location: "Unknown Location", // Placeholder as we don't store IP/Geo currently
			current: req.cookies.refreshToken === s.token,
		}));
		res.status(200).json(formattedSessions);
	} catch (error) {
		console.error("Error in getSessions controller:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};
