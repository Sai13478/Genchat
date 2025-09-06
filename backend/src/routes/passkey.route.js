import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
	getRegistrationOptions,
	verifyRegistration,
	getLoginOptions,
	verifyLogin,
} from "../controllers/passkey.controller.js";

const router = express.Router();

// Registration requires user to be logged in
router.get("/register-options", protectRoute, getRegistrationOptions);
router.post("/verify-registration", protectRoute, verifyRegistration);

router.get("/login-options", getLoginOptions);
router.post("/verify-login", verifyLogin);

export default router;