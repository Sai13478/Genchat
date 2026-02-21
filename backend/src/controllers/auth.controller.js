import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js"; // Assuming cloudinary config is in lib/cloudinary.js

export const signup = async (req, res) => {
	try {
		const { fullName, username, email, password, confirmPassword } = req.body;

		if (!fullName || !username || !email || !password || !confirmPassword) {
			const missing = ["fullName", "username", "email", "password", "confirmPassword"].filter(f => !req.body[f]);
			// Return a 400 Bad Request with a clear error message
			return res.status(400).json({ error: `Please provide all required fields. Missing: ${missing.join(", ")}` });
		}

		if (password !== confirmPassword) {
			return res.status(400).json({ error: "Passwords don't match" });
		}

		// Check if user already exists to provide a better error message upfront
		const user = await User.findOne({ $or: [{ username }, { email }] });
		if (user) {
			// Use 409 Conflict for existing resources
			return res.status(409).json({ error: "Username or email already exists" });
		}

		// HASH PASSWORD
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		const newUser = new User({
			fullName,
			username,
			email,
			password: hashedPassword,
		});

		await newUser.save();

		// Generate JWT token and set cookie
		generateToken(newUser._id, res);

		// Return user data without the password
		res.status(201).json({
			_id: newUser._id,
			fullName: newUser.fullName,
			username: newUser.username,
			email: newUser.email,
			profilePic: newUser.profilePic,
		});
	} catch (error) {
		// Log the full error for better debugging on the server
		console.error("Error in signup controller:", error);

		// Handle specific MongoDB duplicate key error
		if (error.code === 11000) {
			const field = Object.keys(error.keyPattern)[0];
			return res.status(409).json({ error: `An account with that ${field} already exists.` });
		}

		// Generic internal server error for all other cases
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const login = async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json({ error: "Invalid credentials" });
		}

		const isPasswordCorrect = await bcrypt.compare(password, user.password);

		if (!isPasswordCorrect) {
			return res.status(400).json({ error: "Invalid credentials" });
		}

		generateToken(user._id, res);

		res.status(200).json({
			_id: user._id,
			fullName: user.fullName,
			username: user.username,
			email: user.email,
			profilePic: user.profilePic,
		});
	} catch (error) {
		console.error("Error in login controller:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const logout = (req, res) => {
	try {
		res.cookie("jwt", "", { maxAge: 0 });
		res.status(200).json({ message: "Logged out successfully" });
	} catch (error) {
		console.error("Error in logout controller:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const checkAuth = async (req, res) => {
	try {
		// req.user is attached by the protectRoute middleware
		const user = await User.findById(req.user._id).select("-password");
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}
		res.status(200).json(user);
	} catch (error) {
		console.error("Error in checkAuth controller:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const updateProfile = async (req, res) => {
	try {
		const { profilePic } = req.body;
		const userId = req.user._id; // From protectRoute middleware

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// If user already has a profile pic, delete the old one from Cloudinary
		if (user.profilePic) {
			// Extract public_id from the URL
			const publicId = user.profilePic.split("/").pop().split(".")[0];
			await cloudinary.uploader.destroy(`profile_pics/${publicId}`);
		}

		// Upload the new image to Cloudinary
		const uploadedResponse = await cloudinary.uploader.upload(profilePic, {
			folder: "profile_pics",
			width: 250,
			height: 250,
			crop: "fill",
		});

		user.profilePic = uploadedResponse.secure_url;
		await user.save();

		// Return a consistent user object
		const userResponse = { _id: user._id, fullName: user.fullName, username: user.username, email: user.email, profilePic: user.profilePic };
		res.status(200).json({ message: "Profile updated successfully", user: userResponse });
	} catch (error) {
		console.error("Error in updateProfile controller:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};