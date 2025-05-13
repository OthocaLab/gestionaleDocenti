const express = require('express');
const { check } = require('express-validator');
const sostituzioneController = require('../controllers/sostituzioneController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Protezione di tutte le rotte
router.use(protect);

// Autorizzazione per ruoli specifici
const authorizeRoles = authorize('admin', 'vicepresidenza');

// Validazione per la creazione di una sostituzione
const sostituzioneValidation = [
  check('assenza', 'L\'ID dell\'assenza è obbligatorio').not().isEmpty(),
  check('docente', 'L\'ID del docente assente è obbligatorio').not().isEmpty(),
  check('docenteSostituto', 'L\'ID del docente sostituto è obbligatorio').not().isEmpty(),
  check('data', 'La data è obbligatoria').not().isEmpty(),
  check('ora', 'L\'ora è obbligatoria').isInt({ min: 1, max: 8 }),
  check('classe', 'La classe è obbligatoria').not().isEmpty(),
  check('materia', 'La materia è obbligatoria').not().isEmpty()
];

// Rotte per la gestione delle sostituzioni
router.route('/')
  .get(authorizeRoles, sostituzioneController.getSostituzioni)
  .post(authorizeRoles, sostituzioneValidation, sostituzioneController.createSostituzione);

router.route('/:id')
  .put(authorizeRoles, sostituzioneController.updateSostituzione)
  .delete(authorizeRoles, sostituzioneController.deleteSostituzione);

// Rotte per la gestione delle assenze da coprire
router.get('/assenze-da-coprire', authorizeRoles, sostituzioneController.getAssenzeDaCoprire);

// Rotta per i docenti disponibili per una sostituzione
router.get('/docenti-disponibili', authorizeRoles, sostituzioneController.getDocentiDisponibili);

// Rotta per l'orario di una classe
router.get('/orario-classe', authorizeRoles, sostituzioneController.getOrarioClasse);

module.exports = router; 