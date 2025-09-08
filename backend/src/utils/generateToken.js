import jwt from "jsonwebtoken";

/**
 * Generates a JWT, sets it as a secure, cross-domain cookie, and returns the token.
 *
 * @param {string} userId - The MongoDB user ID to include in the JWT payload.
 * @param {object} res - The Express response object used to set the cookie.
 * @returns {string} The generated JWT string.
 */
const generateToken = (userId, res) => {
  const JWT_SECRET = "cFsFJ37viwgHdMec"; 

  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not defined.');
    throw new Error('Server configuration error: JWT secret is missing.');
  }
  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: '7d', 
  });
  const cookieOptions = {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
  };
  res.cookie('jwt', token, cookieOptions);
  return token;
};

export default generateToken;