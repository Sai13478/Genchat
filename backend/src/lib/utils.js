import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set in environment variables');
    throw new Error('Server configuration error');
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Set cookie with secure defaults
  const cookieOptions = {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };

  // Set the cookie
  res.cookie("jwt", token, cookieOptions);

  // Also set the token in the response header for API clients
  res.setHeader("Authorization", `Bearer ${token}`);

  return token;
};

// Helper to clear the JWT cookie
export const clearToken = (res) => {
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
};
