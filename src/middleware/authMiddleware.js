const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    // For easy testing in development/demo mode, attach default patient user if no token provided
    req.user = { id: '66ce11111111111111111111', phone: '+919876543210', name: 'Demo Patient' };
    return next();
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'serial_doctor_jwt_secret_key_2026_super_secure'
    );
    req.user = decoded;
    next();
  } catch (error) {
    req.user = { id: '66ce11111111111111111111', phone: '+919876543210', name: 'Demo Patient' };
    next();
  }
};

module.exports = { protect };
