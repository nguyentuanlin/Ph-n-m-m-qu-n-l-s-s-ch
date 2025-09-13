const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - require authentication
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Token is valid but user no longer exists'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          status: 'error',
          message: 'User account is deactivated'
        });
      }

      // Grant access to protected route
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Server error in authentication'
    });
  }
};

// Restrict to certain roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

// Check user hierarchy - admin có thể quản lý tất cả, user chỉ quản lý bản thân
const checkUserHierarchy = (req, res, next) => {
  const user = req.user;
  
  // Admin có quyền cao nhất
  if (user.role === 'admin') {
    return next();
  }
  
  // User chỉ có thể xem thông tin của mình
  if (user.role === 'user') {
    if (req.params.id && req.params.id !== user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied - can only access own information'
      });
    }
    return next();
  }
  
  next();
};

// Check if user can access specific book
const checkBookAccess = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const user = req.user;

    // Admin can access all books
    if (user.role === 'admin') {
      return next();
    }

    // User can only access their assigned books
    const Book = require('../models/Book');
    const book = await Book.findById(bookId);
    
    if (!book) {
      return res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
    }

    if (book.assignedTo.toString() !== user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have access to this book'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Server error in book access check'
    });
  }
};

// Check if user can access specific entry
const checkEntryAccess = async (req, res, next) => {
  try {
    const { entryId } = req.params;
    const user = req.user;

    // Admin can access all entries
    if (user.role === 'admin') {
      return next();
    }

    // User can only access their own entries
    const BookEntry = require('../models/BookEntry');
    const entry = await BookEntry.findById(entryId);
    
    if (!entry) {
      return res.status(404).json({
        status: 'error',
        message: 'Entry not found'
      });
    }

    if (entry.userId.toString() !== user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have access to this entry'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Server error in entry access check'
    });
  }
};

module.exports = {
  protect,
  restrictTo,
  checkUserHierarchy,
  checkBookAccess,
  checkEntryAccess
};
