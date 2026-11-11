import jwt from 'jsonwebtoken';
import User from '../features/users/userModel.js';

export const protect = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      const token = req.headers.authorization.substring(7); 
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey123');
      
      req.user = {
        _id: decoded._id,
        role: decoded.role,
        name: decoded.name
      };

      return next();
    } catch (error) {
      console.warn('[AUTH_MIDDLEWARE_WARN] Verification caught an exception:', error.message);
      req.user = null;
      return next();
    }
  } else {
    req.user = null;
    return next();
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if the verified user profile has the required credentials role
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role ${req.user ? req.user.role : 'undefined'} is not authorized to access this resource` 
      });
    }
    next();
  };
};
