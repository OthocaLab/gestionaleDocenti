const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const redisHelper = require('../config/redisClient');

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

// Recupero password (con JWT + Redis)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Verifica che l'email sia fornita
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email obbligatoria'
      });
    }

    // Trova l'utente
    const user = await User.findOne({ email });

    // Se l'utente non esiste, ritorna comunque successo (per sicurezza, non rivelare se l'email esiste)
    if (!user) {
      console.log(`[AUTH] Tentativo di reset per email non esistente: ${email}`);
      return res.status(200).json({
        success: true,
        message: 'Se l\'email esiste nel sistema, riceverai le istruzioni per il reset della password'
      });
    }

    // Genera JWT per reset password
    const resetToken = jwt.sign(
      { 
        email: user.email,
        userId: user._id.toString(),
        type: 'password_reset'
      },
      process.env.RESET_PASSWORD_JWT_SECRET || process.env.JWT_SECRET,
      { 
        expiresIn: `${process.env.RESET_PASSWORD_TOKEN_EXPIRE || 1800}s` // Default 30 minuti
      }
    );

    console.log(`[AUTH] Token JWT generato per ${email}`);

    // Salva il token in Redis con TTL
    const expireSeconds = parseInt(process.env.RESET_PASSWORD_TOKEN_EXPIRE) || 1800;
    
    try {
      const redisResult = await redisHelper.setResetToken(email, resetToken, expireSeconds);
      
      // Se Redis è disabilitato, continua comunque (fallback)
      if (!redisResult.success && redisResult.reason === 'REDIS_DISABLED') {
        console.log('[AUTH] ⚠️  Redis disabilitato - il token non sarà salvato, ma continuiamo');
      } else if (!redisResult.success) {
        throw new Error('Errore nel salvataggio del token in Redis');
      }
    } catch (redisError) {
      console.error('[AUTH] Errore Redis:', redisError.message);
      // Se Redis fallisce, ritorniamo errore (in produzione potresti voler continuare comunque)
      return res.status(500).json({
        success: false,
        message: 'Errore nel sistema di reset password. Riprova più tardi.'
      });
    }

    // Crea URL di reset (il frontend gestirà il redirect)
    const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    // Contenuto email
    const expiryMinutes = Math.floor(expireSeconds / 60);
    const message = `
      Hai richiesto il reset della password per il tuo account Othoca Labs.
      
      Clicca sul seguente link per reimpostare la password:
      ${resetUrl}
      
      Questo link sarà valido per ${expiryMinutes} minuti.
      
      Se non hai richiesto il reset della password, ignora questa email.
      La tua password rimarrà invariata.
      
      Per motivi di sicurezza, non condividere questo link con nessuno.
    `;

    // Invia email
    try {
      console.log(`[AUTH] Invio email di recupero a: ${email}`);
      const emailResult = await sendEmail({
        email: email,
        subject: 'Reset Password - Othoca Labs',
        message
      });

      // Gestione del caso in cui SMTP sia disabilitato
      if (!emailResult.success && emailResult.reason === 'SMTP_DISABLED') {
        console.log('[AUTH] SMTP disabilitato - email non inviata');
        
        // In development, ritorna il token per facilitare i test
        if (process.env.NODE_ENV === 'development') {
          return res.status(200).json({
            success: true,
            message: 'Reset password elaborato (SMTP disabilitato)',
            smtp_disabled: true,
            debug_token: resetToken, // Solo in development!
            debug_url: resetUrl
          });
        }
        
        return res.status(200).json({
          success: true,
          message: 'Reset password elaborato (Email disabilitata nella configurazione)',
          smtp_disabled: true
        });
      }

      console.log(`[AUTH] ✅ Email di reset inviata con successo a ${email}`);
      
      return res.status(200).json({
        success: true,
        message: 'Se l\'email esiste nel sistema, riceverai le istruzioni per il reset della password'
      });
    } catch (emailError) {
      console.error('[AUTH] Errore nell\'invio dell\'email:', emailError);
      
      // Rimuovi il token da Redis se l'email fallisce
      await redisHelper.deleteResetToken(email);
      
      return res.status(500).json({
        success: false,
        message: 'Errore nell\'invio dell\'email di recupero'
      });
    }
  } catch (error) {
    console.error('[AUTH] Errore durante il recupero password:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero password',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Reset password (con JWT + Redis)
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken } = req.params;
    const { password } = req.body;

    // Verifica che il token e la password siano forniti
    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Token di reset obbligatorio'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Nuova password obbligatoria'
      });
    }

    // Verifica lunghezza password
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La password deve essere di almeno 8 caratteri'
      });
    }

    // Decodifica e verifica JWT
    let decoded;
    try {
      decoded = jwt.verify(
        resetToken,
        process.env.RESET_PASSWORD_JWT_SECRET || process.env.JWT_SECRET
      );
    } catch (jwtError) {
      console.error('[AUTH] Errore verifica JWT:', jwtError.message);
      
      // Gestione errori JWT specifici
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(400).json({
          success: false,
          message: 'Il link di reset è scaduto. Richiedi un nuovo reset della password.'
        });
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(400).json({
          success: false,
          message: 'Token non valido'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'Errore nella verifica del token'
      });
    }

    // Verifica che sia un token di tipo reset password
    if (decoded.type !== 'password_reset') {
      console.error('[AUTH] Tipo token non valido:', decoded.type);
      return res.status(400).json({
        success: false,
        message: 'Token non valido per il reset della password'
      });
    }

    // Verifica che il token esista in Redis (se Redis è abilitato)
    if (redisHelper.isAvailable()) {
      const isValid = await redisHelper.isResetTokenValid(decoded.email, resetToken);
      
      if (!isValid) {
        console.error('[AUTH] Token non trovato in Redis o già utilizzato');
        return res.status(400).json({
          success: false,
          message: 'Token non valido o già utilizzato'
        });
      }
    } else {
      console.log('[AUTH] ⚠️  Redis non disponibile - skip verifica token in Redis');
    }

    // Trova l'utente
    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      console.error('[AUTH] Utente non trovato per email:', decoded.email);
      
      // Rimuovi il token da Redis anche se l'utente non esiste
      await redisHelper.deleteResetToken(decoded.email);
      
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    // Aggiorna la password
    console.log(`[AUTH] Aggiornamento password per utente: ${user.email}`);
    user.password = password;
    
    // Pulisci eventuali campi vecchi del sistema precedente (se presenti)
    if (user.resetPasswordToken) {
      user.resetPasswordToken = undefined;
    }
    if (user.resetPasswordExpire) {
      user.resetPasswordExpire = undefined;
    }

    await user.save();
    console.log(`[AUTH] ✅ Password aggiornata con successo per ${user.email}`);

    // Elimina il token da Redis (è stato utilizzato)
    if (redisHelper.isAvailable()) {
      await redisHelper.deleteResetToken(decoded.email);
      console.log(`[AUTH] Token rimosso da Redis per ${decoded.email}`);
    }

    // Genera nuovo token JWT per l'autenticazione
    const authToken = jwt.sign(
      { id: user._id, ruolo: user.ruolo },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(200).json({
      success: true,
      message: 'Password reimpostata con successo',
      token: authToken,
      user: {
        id: user._id,
        nome: user.nome,
        cognome: user.cognome,
        email: user.email,
        ruolo: user.ruolo
      }
    });
  } catch (error) {
    console.error('[AUTH] Errore durante il reset della password:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il reset della password',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Invia codice di verifica email (con Redis)
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

    // Genera codice random a 6 cifre
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[AUTH] Codice verifica generato per ${email}: ${verificationCode}`);

    // Salva il codice in Redis con TTL di 10 minuti (600 secondi)
    const expireSeconds = 600; // 10 minuti
    
    try {
      const redisResult = await redisHelper.setVerificationCode(email, verificationCode, expireSeconds);
      
      if (!redisResult.success && redisResult.reason === 'REDIS_DISABLED') {
        console.log('[AUTH] ⚠️  Redis disabilitato - codice non salvato');
      } else if (!redisResult.success) {
        throw new Error('Errore nel salvataggio del codice in Redis');
      }
    } catch (redisError) {
      console.error('[AUTH] Errore Redis:', redisError.message);
      return res.status(500).json({
        success: false,
        message: 'Errore nel sistema di verifica. Riprova più tardi.'
      });
    }

    // Messaggio email
    const message = `
      Il tuo codice di verifica è: ${verificationCode}
      
      Inserisci questo codice nella pagina delle impostazioni per verificare il tuo indirizzo email.
      
      Il codice sarà valido per 10 minuti.
      
      Se non hai richiesto questa verifica, ignora questa email.
    `;

    try {
      console.log('[AUTH] Invio codice di verifica a:', email);
      const emailResult = await sendEmail({
        email: email,
        subject: 'Codice di Verifica - Othoca Labs',
        message
      });

      // Gestione del caso in cui SMTP sia disabilitato
      if (!emailResult.success && emailResult.reason === 'SMTP_DISABLED') {
        console.log('[AUTH] SMTP disabilitato - codice non inviato via email');
        
        // In development, ritorna il codice per facilitare i test
        if (process.env.NODE_ENV === 'development') {
          return res.status(200).json({
            success: true,
            message: 'Codice di verifica elaborato (SMTP disabilitato)',
            smtp_disabled: true,
            verification_code: verificationCode // Solo in development!
          });
        }
        
        return res.status(200).json({
          success: true,
          message: 'Codice di verifica elaborato (Email disabilitata nella configurazione)',
          smtp_disabled: true
        });
      }

      console.log(`[AUTH] ✅ Codice di verifica inviato a ${email}`);
      
      return res.status(200).json({
        success: true,
        message: 'Codice di verifica inviato con successo'
      });
    } catch (emailError) {
      console.error('[AUTH] Errore nell\'invio dell\'email:', emailError);
      
      // Rimuovi il codice da Redis se l'email fallisce
      await redisHelper.deleteVerificationCode(email);
      
      return res.status(500).json({
        success: false,
        message: 'Errore nell\'invio dell\'email'
      });
    }
  } catch (error) {
    console.error('[AUTH] Errore durante l\'invio del codice di verifica:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante l\'invio del codice di verifica',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Verifica il codice di verifica (con Redis)
exports.verifyEmailCode = async (req, res) => {
  try {
    const { code } = req.body;

    // Verifica che il codice sia fornito
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Codice di verifica obbligatorio'
      });
    }

    // Ottieni l'email dell'utente corrente
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    const email = user.email;

    // Verifica il codice contro Redis
    if (!redisHelper.isAvailable()) {
      console.log('[AUTH] ⚠️  Redis non disponibile - impossibile verificare codice');
      return res.status(503).json({
        success: false,
        message: 'Servizio di verifica temporaneamente non disponibile'
      });
    }

    const isValid = await redisHelper.isVerificationCodeValid(email, code);

    if (!isValid) {
      console.log(`[AUTH] ❌ Codice non valido per ${email}`);
      return res.status(400).json({
        success: false,
        message: 'Codice di verifica non valido o scaduto'
      });
    }

    // Codice valido - elimina da Redis (one-time use)
    await redisHelper.deleteVerificationCode(email);
    console.log(`[AUTH] ✅ Email verificata per ${email}`);

    // Opzionale: Aggiorna lo stato dell'utente nel database
    // user.emailVerified = true;
    // await user.save();

    return res.status(200).json({
      success: true,
      message: 'Email verificata con successo'
    });
  } catch (error) {
    console.error('[AUTH] Errore durante la verifica del codice:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante la verifica del codice',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};