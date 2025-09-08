import jwt from "jsonwebtoken";

const JWT_SECRET = "cFsFJ37viwgHdMec";

export const generateToken = (userId, res) => {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not set');
    throw new Error('Server configuration error');
  }

  // Generate JWT token
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

  // Set cookie
  const cookieOptions = {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    path: '/',
  };

  res.cookie('jwt', token, cookieOptions);

  return token;
};
