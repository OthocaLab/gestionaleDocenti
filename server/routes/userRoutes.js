const express = require('express');
const { check } = require('express-validator');
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Validazione per la registrazione utente
const registerValidation = [
  check('nome', 'Il nome è obbligatorio').not().isEmpty(),
  check('cognome', 'Il cognome è obbligatorio').not().isEmpty(),
  check('email', 'Inserisci un indirizzo email valido').isEmail(),
  check('password', 'La password deve contenere almeno 8 caratteri').isLength({ min: 8 }),
  check('ruolo', 'Il ruolo deve essere valido').isIn(['admin', 'docente', 'vicepresidenza']),
  check('telefono', 'Inserisci un numero di telefono valido').optional().matches(/^(\+39\s?)?((3\d{2}|0\d{1,4})\s?\d{6,8})$/)
];

// Validazione per l'aggiornamento utente
const updateValidation = [
  check('nome', 'Il nome non può essere vuoto se fornito').optional().not().isEmpty(),
  check('cognome', 'Il cognome non può essere vuoto se fornito').optional().not().isEmpty(),
  check('email', 'Inserisci un indirizzo email valido').optional().isEmail(),
  check('telefono', 'Inserisci un numero di telefono valido').optional().matches(/^(\+39\s?)?((3\d{2}|0\d{1,4})\s?\d{6,8})$/),
  check('materie', 'Le materie devono essere un array').optional().isArray(),
  check('classi', 'Le classi devono essere un array').optional().isArray()
];

// Rotta per ottenere tutti gli utenti (solo admin)
router.get('/', protect, authorize('admin', 'vicepresidenza'), userController.getAllUsers);

// Rotta per registrare un nuovo utente (solo admin)
router.post('/register', protect, authorize('admin'), registerValidation, userController.registerUser);

// Rotta per ottenere il profilo dell'utente corrente
router.get('/me', protect, userController.getMe);

// Rotta per aggiornare il profilo dell'utente
router.put('/update', protect, updateValidation, userController.updateUser);

// Rotta per aggiornare un utente specifico (solo admin)
router.put('/:id', protect, authorize('admin'), updateValidation, userController.updateUserById);

// Rotta per eliminare un utente (solo admin)
router.delete('/:id', protect, authorize('admin'), userController.deleteUser);

module.exports = router;