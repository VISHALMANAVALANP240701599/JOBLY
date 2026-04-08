const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'No token provided' });

  const bearer = token.split(' ')[1]; // Extract token from "Bearer <token>"
  
  jwt.verify(bearer || token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Unauthorized' });
    
    // Ensure the user actually exists in the database
    // This is crucial for MongoMemoryServer restarts which wipe the DB while frontend keeps the token.
    try {
      const User = require('../models/User');
      const userExists = await User.findById(decoded.id);
      if (!userExists) {
        return res.status(401).json({ message: 'User not found. Please log in again.' });
      }
      req.userId = decoded.id;
      req.userRole = decoded.role;
      next();
    } catch (dbErr) {
      return res.status(500).json({ message: 'Database error' });
    }
  });
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ message: 'Role not authorized' });
    }
    next();
  };
};

module.exports = { verifyToken, checkRole };
