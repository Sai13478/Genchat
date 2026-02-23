import express from "express";
import { signup, login, logout, checkAuth, updateProfile, refreshToken, logoutAllDevices } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refreshToken);

// Protected routes (require a valid JWT)
router.get("/check", protectRoute, checkAuth);
router.post("/logout-all", protectRoute, logoutAllDevices);
router.put("/update-profile", protectRoute, updateProfile);

export default router;