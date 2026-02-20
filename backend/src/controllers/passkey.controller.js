import User from "../models/user.model.js";
import {
	generateRegistrationOptions,
	verifyRegistrationResponse,
	generateAuthenticationOptions,
	verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import base64url from "base64url";
import { generateToken } from "../lib/utils.js";

// Relying Party (your application)
const rpName = "GenChat";
// Use host from request if RP_ID is not set
const getRpID = (req) => process.env.RP_ID || req.get('host').split(':')[0];
const getOrigin = (req) => {
	if (process.env.NODE_ENV === "production" && process.env.ORIGIN) return process.env.ORIGIN;
	const protocol = req.protocol;
	const host = req.get('host');
	return `${protocol}://${host}`;
};

// In-memory store for challenges. In a real-world scenario, use a more robust
// store like Redis or a temporary database collection.
const loginChallenges = new Map();

export const getRegistrationOptions = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);
		if (!user) return res.status(404).json({ error: "User not found" });

		const options = await generateRegistrationOptions({
			rpName,
			rpID: getRpID(req),
			userID: Buffer.from(user._id.toString(), "utf-8"),
			userName: user.username || user.email, // Fallback to email if username is missing
			userDisplayName: user.fullName,
			// Don't show authenticators that are already registered
			excludeCredentials: (user.authenticators || []).map((auth) => ({
				id: auth.credentialID,
				type: "public-key",
				transports: auth.transports,
			})),
		});

		// Store the challenge on the user document
		await User.findByIdAndUpdate(req.user._id, { currentChallenge: options.challenge });

		res.status(200).json(options);
	} catch (error) {
		console.error("Error in getRegistrationOptions:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const verifyRegistration = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);
		if (!user) return res.status(404).json({ error: "User not found" });

		const verification = await verifyRegistrationResponse({
			response: req.body,
			expectedChallenge: user.currentChallenge,
			expectedOrigin: getOrigin(req),
			expectedRPID: getRpID(req),
		});

		if (verification.verified && verification.registrationInfo) {
			const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;

			const newAuthenticator = {
				publicKey: Buffer.from(credentialPublicKey),
				credentialID: Buffer.from(credentialID),
				counter,
				transports: req.body.response.transports || [],
			};

			user.authenticators.push(newAuthenticator);
			user.currentChallenge = undefined; // Clear challenge
			await user.save();

			return res.status(200).json({ message: "Passkey registered successfully." });
		}

		res.status(400).json({ error: "Passkey verification failed." });
	} catch (error) {
		console.error("Error in verifyRegistration:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const getLoginOptions = async (req, res) => {
	try {
		const options = await generateAuthenticationOptions({
			rpID: getRpID(req),
			allowCredentials: [], // Allow any registered passkey
		});

		// Store challenge temporarily
		loginChallenges.set(options.challenge, true);
		setTimeout(() => loginChallenges.delete(options.challenge), 5 * 60 * 1000); // Challenge expires in 5 mins

		res.status(200).json(options);
	} catch (error) {
		console.error("Error in getLoginOptions:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const verifyLogin = async (req, res) => {
	try {
		const response = req.body;

		// Find user by credentialID
		const credentialID = base64url.toBuffer(response.id);
		const user = await User.findOne({ "authenticators.credentialID": credentialID });

		if (!user) {
			return res.status(404).json({ error: "User with this passkey not found." });
		}

		const authenticator = user.authenticators.find((auth) => auth.credentialID.equals(credentialID));

		if (!authenticator) {
			return res.status(400).json({ error: "Authenticator not found." });
		}

		// Verify the authentication response
		const verification = await verifyAuthenticationResponse({
			response,
			expectedChallenge: (challenge) => {
				// Check if the challenge is valid and has not expired
				if (loginChallenges.has(challenge)) {
					loginChallenges.delete(challenge);
					return true;
				}
				return false;
			},
			expectedOrigin: getOrigin(req),
			expectedRPID: getRpID(req),
			authenticator: {
				// Pass the authenticator properties to the verifier
				credentialID: authenticator.credentialID,
				credentialPublicKey: authenticator.publicKey,
				counter: authenticator.counter,
				transports: authenticator.transports,
			},
		});

		if (verification.verified) {
			// Update the authenticator's counter
			authenticator.counter = verification.authenticationInfo.newCounter;
			await user.save();

			// Generate token and log the user in
			generateToken(user._id, res);

			res.status(200).json({
				_id: user._id,
				fullName: user.fullName,
				username: user.username,
				email: user.email,
				profilePic: user.profilePic,
			});
		} else {
			res.status(400).json({ error: "Passkey verification failed." });
		}
	} catch (error) {
		console.error("Error in verifyLogin:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};