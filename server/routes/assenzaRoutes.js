const express = require('express');
const { check } = require('express-validator');
const assenzaController = require('../controllers/assenzaController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Protezione di tutte le rotte
router.use(protect);

// Autorizzazione per ruoli specifici
const authorizeRoles = authorize('admin', 'vicepresidenza', 'ufficioPersonale');

// Validazione per la creazione di un'assenza
const assenzaValidation = [
  check('docente', 'L\'ID del docente è obbligatorio').not().isEmpty(),
  check('dataInizio', 'La data di inizio è obbligatoria').not().isEmpty(),
  check('dataFine', 'La data di fine è obbligatoria').not().isEmpty(),
  check('tipoAssenza', 'Il tipo di assenza è obbligatorio').isIn(['malattia', 'permesso', 'ferie', 'altro'])
];

// Rotta per ottenere i docenti assenti per una data specifica
router.get('/docenti-per-data', assenzaController.getDocentiPerData);

// Rotta per l'autocomplete dei docenti
router.get('/autocomplete', authorizeRoles, assenzaController.autocompleteDocenti);

// Rotte CRUD per le assenze
router.route('/')
  .get(authorizeRoles, assenzaController.getAssenze)
  .post(authorizeRoles, assenzaValidation, assenzaController.createAssenza);

router.route('/:id')
  .get(authorizeRoles, assenzaController.getAssenza)
  .put(authorizeRoles, assenzaController.updateAssenza)
  .delete(authorizeRoles, assenzaController.deleteAssenza);

module.exports = router;