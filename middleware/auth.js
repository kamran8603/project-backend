
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'No token, authorization denied' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    if (!decoded.userId) {
      throw new Error('Token payload missing userId');
    }
    
    req.user = {
      id: decoded.userId
    };
    
    next();
  } catch (err) {
    console.error('JWT Verification Error:', err.message);
    
    let message = 'Token is not valid';
    if (err.name === 'TokenExpiredError') {
      message = 'Token has expired';
    } else if (err.name === 'JsonWebTokenError') {
      message = 'Invalid token';
    }
    
    res.status(401).json({ 
      success: false,
      message 
    });
  }
};

module.exports = authenticateToken;