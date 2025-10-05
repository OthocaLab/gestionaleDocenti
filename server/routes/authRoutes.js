const express = require('express');
const { check } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Validazione per la registrazione
const registerValidation = [
  check('nome', 'Il nome è obbligatorio').not().isEmpty(),
  check('cognome', 'Il cognome è obbligatorio').not().isEmpty(),
  check('email', 'Inserisci un indirizzo email valido').isEmail(),
  check('password', 'La password deve contenere almeno 8 caratteri').isLength({ min: 8 })
];

// Validazione per il login
const loginValidation = [
  check('email', 'Inserisci un indirizzo email valido').isEmail(),
  check('password', 'La password è obbligatoria').exists()
];

// Route per la registrazione
router.post('/register', registerValidation, authController.register);

// Route per il login
router.post('/login', loginValidation, authController.login);

// Route per verificare il token
router.get('/verify', protect, authController.verifyToken);

// Route per il recupero password
router.post('/forgot-password', authController.forgotPassword);

// Route per il reset della password
router.put('/reset-password/:resetToken', authController.resetPassword);

// Route per inviare il codice di verifica email
router.post('/send-verification-code', protect, authController.sendVerificationCode);

// Route per verificare il codice di verifica
router.post('/verify-email-code', protect, authController.verifyEmailCode);

module.exports = router;