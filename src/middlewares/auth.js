// middlewares/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required. Please login.' 
      });
    }

    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'your_secret_key'
    );
    
    req.user = decoded;
    console.log('✅ Authenticated user:', req.user.email || req.user.id);
    
    next();
  } catch (error) {
    console.error('❌ Auth error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        error: 'Invalid token. Please login again.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        error: 'Token expired. Please login again.' 
      });
    }
    
    return res.status(403).json({ 
      error: 'Authentication failed.' 
    });
  }
};

module.exports = {authenticateToken};