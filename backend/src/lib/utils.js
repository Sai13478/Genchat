import jwt from "jsonwebtoken";
import RefreshToken from "../models/refresh-token.model.js";

export const generateTokens = async (userId, res, deviceInfo = "unknown") => {
  if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    console.error('JWT secrets are not set in environment variables');
    throw new Error('Server configuration error');
  }

  // Generate Access Token (Short-lived)
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  // Generate Refresh Token (Long-lived)
  const refreshToken = jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );

  // Store Refresh Token in DB
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  await RefreshToken.create({
    user: userId,
    token: refreshToken,
    deviceInfo,
    expiresAt
  });

  // Set cookies with secure defaults
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Also set the accessToken in the response header for API clients
  res.setHeader("Authorization", `Bearer ${accessToken}`);

  return { accessToken, refreshToken };
};

// Helper to clear all auth cookies
export const clearTokens = (res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
  res.clearCookie("jwt", cookieOptions); // Clear legacy cookie
};
