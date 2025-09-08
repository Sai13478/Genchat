import jwt from "jsonwebtoken";

export default function generateTokenAndSetCookie(userId, res) {
  // You might want to add more details to the JWT payload, like user role
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d", // Token expiry set to 7 days
  });

  // Set the token in a cookie with proper security settings
  res.cookie("token", token, {
    httpOnly: true, // Ensures cookie cannot be accessed via JavaScript
    secure: process.env.NODE_ENV === "production", // Cookies only sent over HTTPS in production
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // SameSite=None for cross-origin requests in production
    maxAge: 7 * 24 * 60 * 60 * 1000, // Cookie expires in 7 days
    path: "/", // Ensures the cookie is sent with requests to all routes
  });

  return token;
}
