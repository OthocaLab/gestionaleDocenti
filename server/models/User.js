const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Cripta la password prima di salvarla
UserSchema.pre('save', async function(next) {
  console.log('[DEBUG] Pre-save hook:', {
    isPasswordModified: this.isModified('password'),
    useGmailApp: process.env.USE_GMAIL_APP_PASSWORD === 'true'
  });

  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Se USE_GMAIL_APP_PASSWORD è true, salva la password come testo semplice
    if (process.env.USE_GMAIL_APP_PASSWORD === 'true') {
      console.log('[DEBUG] Saving plain Gmail app password');
      return next();
    }

    // Altrimenti cripta la password con bcrypt
    console.log('[DEBUG] Hashing password with bcrypt');
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('[DEBUG] Password hashed successfully');
    return next();
  } catch (error) {
    console.error('[ERROR] Password hashing failed:', error);
    return next(error);
  }
});

// Verifica se la password inserita corrisponde a quella criptata
UserSchema.methods.matchPassword = async function(enteredPassword) {
  console.log('[DEBUG] matchPassword:', {
    useGmailApp: process.env.USE_GMAIL_APP_PASSWORD === 'true',
    storedPasswordLength: this.password?.length,
    isStoredPasswordHashed: this.password?.startsWith('$2a$'),
    enteredPasswordLength: enteredPassword?.length
  });

  if (process.env.USE_GMAIL_APP_PASSWORD === 'true') {
    const isMatch = enteredPassword === this.password;
    console.log('[DEBUG] Gmail password match:', isMatch);
    return isMatch;
  }
  
  const isMatch = await bcrypt.compare(enteredPassword, this.password);
  console.log('[DEBUG] Bcrypt password match:', isMatch);
  return isMatch;
};

module.exports = mongoose.model('User', UserSchema);