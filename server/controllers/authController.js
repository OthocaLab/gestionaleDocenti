const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// Registrazione utente
exports.register = async (req, res) => {
  try {
    // Verifica errori di validazione
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { nome, cognome, email, password } = req.body;

    // Verifica se l'utente esiste già
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'Utente già registrato con questa email'
      });
    }

    // Crea un nuovo utente
    user = new User({
      nome,
      cognome,
      email,
      password,
      ruolo: 'docente' // Ruolo predefinito
    });

    // Salva l'utente nel database
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Utente registrato con successo'
    });
  } catch (error) {
    console.error('Errore durante la registrazione:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante la registrazione',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Login utente
exports.login = async (req, res) => {
  try {
    // Verifica errori di validazione
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // Verifica se l'utente esiste
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide'
      });
    }

    // Verifica la password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide'
      });
    }

    // Genera token JWT
    const token = jwt.sign(
      { id: user._id, ruolo: user.ruolo },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // Rimuovi la password dalla risposta
    user.password = undefined;

    res.status(200).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    console.error('Errore durante il login:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il login',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Verifica token
exports.verifyToken = async (req, res) => {
  try {
    // L'utente è già stato verificato dal middleware auth
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Errore durante la verifica del token:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante la verifica del token',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Recupero password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Non esiste un utente con questa email'
      });
    }

    // Genera token di reset
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash del token e salvataggio nel database
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Imposta la scadenza del token (10 minuti)
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    // Crea URL di reset
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;

    // Messaggio email
    const message = `
      Hai richiesto il reset della password. 
      Clicca sul seguente link per reimpostare la tua password: ${resetUrl}
      Se non hai richiesto il reset della password, ignora questa email.
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Reset della password',
        message
      });

      res.status(200).json({
        success: true,
        message: 'Email inviata'
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Errore nell\'invio dell\'email'
      });
    }
  } catch (error) {
    console.error('Errore durante il recupero password:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero password',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    // Ottieni il token hashed
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    // Trova l'utente con il token valido
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token non valido o scaduto'
      });
    }

    // Imposta la nuova password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    // Genera nuovo token JWT
    const token = jwt.sign(
      { id: user._id, ruolo: user.ruolo },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(200).json({
      success: true,
      message: 'Password reimpostata con successo',
      token
    });
  } catch (error) {
    console.error('Errore durante il reset della password:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il reset della password',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};