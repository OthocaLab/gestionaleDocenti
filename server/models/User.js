const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Model - Schema per gli utenti del sistema
 * 
 * @description Schema Mongoose per la gestione degli utenti
 * 
 * @changelog
 * - 2025-10-05: Rimossi campi resetPasswordToken e resetPasswordExpire
 *               Il reset password ora usa JWT + Redis (più sicuro e performante)
 * 
 * @see server/config/redisClient.js - Gestione Redis per token
 * @see server/controllers/authController.js - Logica autenticazione e reset password
 */
const UserSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Il nome è obbligatorio']
  },
  cognome: {
    type: String,
    required: [true, 'Il cognome è obbligatorio']
  },
  email: {
    type: String,
    required: [true, 'L\'email è obbligatoria'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Inserisci un indirizzo email valido'
    ]
  },
  telefono: {
    type: String,
    validate: {
      validator: function(v) {
        // Se il telefono è fornito, deve essere valido
        // Accetta numeri di telefono italiani con/senza prefisso internazionale
        if (!v) return true; // Campo opzionale
        return /^(\+39\s?)?((3\d{2}|0\d{1,4})\s?\d{6,8})$/.test(v);
      },
      message: 'Inserisci un numero di telefono valido (es. +39 333 1234567 o 333 1234567)'
    }
  },
  password: {
    type: String,
    required: [true, 'La password è obbligatoria'],
    minlength: 8,
    select: false
  },
  ruolo: {
    type: String,
    enum: ['admin', 'vicepresidenza', 'docente', 'ufficioPersonale'],
    default: 'docente'
  },
  materie: [{
    type: String
  }],
  classi: [{
    type: String
  }],
  // NOTA: I campi resetPasswordToken e resetPasswordExpire sono stati rimossi.
  // Il sistema di reset password ora utilizza JWT + Redis per maggiore sicurezza e performance.
  // I token di reset sono memorizzati in Redis con TTL automatico.
  // Vedi: server/config/redisClient.js e server/controllers/authController.js
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Cripta la password prima di salvarla
UserSchema.pre('save', async function(next) {
  // Se la password non è stata modificata, salta l'hashing
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Cripta sempre la password con bcrypt per sicurezza
    console.log('[AUTH] Hashing password per utente:', this.email);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('[AUTH] ✅ Password hashata con successo');
    return next();
  } catch (error) {
    console.error('[AUTH] ❌ Errore hashing password:', error);
    return next(error);
  }
});

// Verifica se la password inserita corrisponde a quella criptata
UserSchema.methods.matchPassword = async function(enteredPassword) {
  console.log('[AUTH] Verifica password per utente:', this.email);
  
  try {
    // Confronta sempre con bcrypt
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    console.log('[AUTH] Password match:', isMatch ? '✅ Corretta' : '❌ Errata');
    return isMatch;
  } catch (error) {
    console.error('[AUTH] ❌ Errore verifica password:', error);
    return false;
  }
};

module.exports = mongoose.model('User', UserSchema);