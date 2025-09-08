const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  let token;

  // 1. Check cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 2. Check Authorization header
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: "Unauthorized - No Token Provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized - Invalid Token" });
  }
};

module.exports = authMiddleware;
