import User from "../models/user.model.js";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import base64url from "base64url";
import generateTokenAndSetCookie from "../utils/generateToken.js";

const rpName = "GenChat";
const loginChallenges = new Map();

// Helper to get RP ID and Origin dynamically based on request
const getRpConfig = (req) => {
  if (process.env.NODE_ENV === "production") {
    const host = req.get("host"); // get current frontend domain
    return {
      rpID: host,
      origin: `https://${host}`,
    };
  } else {
    return {
      rpID: "localhost",
      origin: "http://localhost:5173",
    };
  }
};

export const getRegistrationOptions = async (req, res) => {
  try {
    const { rpID, origin } = getRpConfig(req);
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const options = generateRegistrationOptions({
      rpName,
      rpID,
      userID: Buffer.from(user._id.toString(), "utf-8"),
      userName: user.username || user.email,
      userDisplayName: user.fullName,
      excludeCredentials: (user.authenticators || []).map((auth) => ({
        id: auth.credentialID,
        type: "public-key",
        transports: auth.transports,
      })),
    });

    await User.findByIdAndUpdate(req.user._id, { currentChallenge: options.challenge });

    res.status(200).json(options);
  } catch (error) {
    console.error("Error in getRegistrationOptions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const verifyRegistration = async (req, res) => {
  try {
    const { rpID, origin } = getRpConfig(req);
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
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
      user.currentChallenge = undefined;
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
    const { rpID, origin } = getRpConfig(req);
    const options = generateAuthenticationOptions({ rpID, allowCredentials: [] });
    loginChallenges.set(options.challenge, true);
    setTimeout(() => loginChallenges.delete(options.challenge), 5 * 60 * 1000);
    res.status(200).json(options);
  } catch (error) {
    console.error("Error in getLoginOptions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const verifyLogin = async (req, res) => {
  try {
    const { rpID, origin } = getRpConfig(req);
    const response = req.body;
    const credentialID = base64url.toBuffer(response.id);
    const user = await User.findOne({ "authenticators.credentialID": credentialID });
    if (!user) return res.status(404).json({ error: "User with this passkey not found." });

    const authenticator = user.authenticators.find((auth) => auth.credentialID.equals(credentialID));
    if (!authenticator) return res.status(400).json({ error: "Authenticator not found." });

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: (challenge) => {
        if (loginChallenges.has(challenge)) {
          loginChallenges.delete(challenge);
          return true;
        }
        return false;
      },
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: authenticator.credentialID,
        credentialPublicKey: authenticator.publicKey,
        counter: authenticator.counter,
        transports: authenticator.transports,
      },
    });

    if (verification.verified) {
      authenticator.counter = verification.authenticationInfo.newCounter;
      await user.save();
      generateTokenAndSetCookie(user._id, res);
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
