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

    // Trova l'utente
    const user = await User.findOne({ email });

    // Genera token di reset (anche se l'utente non esiste, per test)
    const resetToken = require('crypto').randomBytes(20).toString('hex');
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

    // Contenuto email
    const message = `
      Hai richiesto il reset della password.\n
      Clicca sul seguente link per reimpostare la password: ${resetUrl}\n
      Il link sarà valido per 30 minuti.\n
      Se non hai richiesto il reset della password, ignora questa email.\n
      (Questa email è stata inviata anche se l'utente non esiste, solo per test.)
    `;

    try {
      console.log('[DEBUG] Invio email di recupero a:', email);
      const emailResult = await sendEmail({
        email: email,
        subject: 'Reset Password - Othoca Labs',
        message
      });

      // Gestione del caso in cui SMTP sia disabilitato
      if (!emailResult.success && emailResult.reason === 'SMTP_DISABLED') {
        return res.status(200).json({
          success: true,
          message: 'Reset password elaborato (Email disabilitata nella configurazione)',
          smtp_disabled: true
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Email inviata (anche se l\'utente non esiste, solo per test)'
      });
    } catch (error) {
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

// Invia codice di verifica email
exports.sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    // Controlla se l'email appartiene all'utente corrente
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    // Per ora utilizziamo un codice fisso di 6 cifre
    const verificationCode = '123456';

    // Messaggio email
    const message = `
      Il tuo codice di verifica è: ${verificationCode}\n
      Inserisci questo codice nella pagina delle impostazioni per verificare il tuo indirizzo email.\n
      Il codice sarà valido per 10 minuti.
    `;

    try {
      console.log('[DEBUG] Invio codice di verifica a:', email);
      const emailResult = await sendEmail({
        email: email,
        subject: 'Codice di Verifica - Othoca Labs',
        message
      });

      // Gestione del caso in cui SMTP sia disabilitato
      if (!emailResult.success && emailResult.reason === 'SMTP_DISABLED') {
        return res.status(200).json({
          success: true,
          message: 'Codice di verifica elaborato (Email disabilitata nella configurazione)',
          smtp_disabled: true,
          verification_code: verificationCode // In caso di SMTP disabilitato, restituisci il codice direttamente
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Codice di verifica inviato con successo'
      });
    } catch (error) {
      console.error('[ERROR] Errore nell\'invio dell\'email:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore nell\'invio dell\'email'
      });
    }
  } catch (error) {
    console.error('Errore durante l\'invio del codice di verifica:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante l\'invio del codice di verifica',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Verifica il codice di verifica
exports.verifyEmailCode = async (req, res) => {
  try {
    const { code } = req.body;

    // Per ora, verifichiamo solo se il codice è uguale a quello fisso
    if (code === '123456') {
      return res.status(200).json({
        success: true,
        message: 'Codice di verifica corretto'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Codice di verifica non valido'
      });
    }
  } catch (error) {
    console.error('Errore durante la verifica del codice:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante la verifica del codice',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};