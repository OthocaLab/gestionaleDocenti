const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware per proteggere le route
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Verifica se il token è presente nell'header Authorization
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Estrai il token dall'header
      token = req.headers.authorization.split(' ')[1];
    }

    // Verifica se il token esiste
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Accesso non autorizzato. Token mancante.'
      });
    }

    try {
      // Verifica il token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Aggiungi l'utente alla richiesta
      req.user = await User.findById(decoded.id);
      
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token non valido o scaduto'
      });
    }
  } catch (error) {
    console.error('Errore nel middleware di autenticazione:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante l\'autenticazione',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Middleware per limitare l'accesso in base al ruolo
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.ruolo)) {
      return res.status(403).json({
        success: false,
        message: `Il ruolo ${req.user.ruolo} non è autorizzato ad accedere a questa risorsa`
      });
    }
    next();
  };
};

// Middleware for debugging auth issues
exports.debugAuth = (req, res, next) => {
  console.log('Debug Auth Middleware');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Auth header:', req.headers.authorization);
  
  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const token = req.headers.authorization.split(' ')[1];
      console.log('Token presente:', token ? 'Sì' : 'No');
      
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          console.log('Token decodificato:', decoded);
        } catch (e) {
          console.log('Errore decodifica token:', e.message);
        }
      }
    } else {
      console.log('Nessun token Bearer trovato');
    }
  } catch (error) {
    console.error('Errore nel debug auth:', error);
  }
  
  next();
};