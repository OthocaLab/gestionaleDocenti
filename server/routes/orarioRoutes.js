const express = require('express');
const { check } = require('express-validator');
const orarioController = require('../controllers/orarioController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Validazione per la creazione di una materia
const materiaValidation = [
  check('codiceMateria', 'Il codice della materia è obbligatorio').not().isEmpty(),
  check('descrizione', 'La descrizione della materia è obbligatoria').not().isEmpty()
];

// Validazione per la creazione di una classe
const classeValidation = [
  check('anno', 'L\'anno della classe è obbligatorio').isInt({ min: 1, max: 5 }),
  check('sezione', 'La sezione della classe è obbligatoria').not().isEmpty(),
  check('aula', 'L\'aula della classe è obbligatoria').not().isEmpty(),
  check('indirizzo', 'L\'indirizzo di studio è obbligatorio').not().isEmpty()
];

// Validazione per la creazione di un orario lezione
const orarioValidation = [
  check('giornoSettimana', 'Il giorno della settimana è obbligatorio').isIn(['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']),
  check('ora', 'L\'ora della lezione è obbligatoria').isInt({ min: 1, max: 8 }),
  check('oraInizio', 'L\'ora di inizio è obbligatoria').not().isEmpty(),
  check('oraFine', 'L\'ora di fine è obbligatoria').not().isEmpty(),
  check('docente', 'Il docente è obbligatorio').not().isEmpty(),
  check('materia', 'La materia è obbligatoria').not().isEmpty(),
  check('classeId', 'La classe è obbligatoria').not().isEmpty()
];

// Rotte per le materie
router.get('/materie', protect, orarioController.getAllMaterie);
router.post('/materie', protect, authorize('admin', 'vicepresidenza'), materiaValidation, orarioController.createMateria);

// Rotte per le classi
router.get('/classi', protect, orarioController.getAllClassi);
router.post('/classi', protect, authorize('admin', 'vicepresidenza'), classeValidation, orarioController.createClasse);

// Rotte per gli orari
router.get('/orario/classe/:classeId', protect, orarioController.getOrarioByClasse);
router.get('/orario/docente/:docenteId', protect, orarioController.getOrarioByDocente);
router.post('/orario', protect, authorize('admin', 'vicepresidenza'), orarioValidation, orarioController.createOrarioLezione);
// Update the import route to include authentication and proper file handling
router.post('/import', 
  protect, 
  authorize('admin', 'vicepresidenza'),
  upload.single('file'), 
  (req, res, next) => {
    console.log('Route middleware - req.file:', req.file);
    console.log('Route middleware - req.body:', req.body);
    next();
  },
  orarioController.importaOrari
);

// Test route for file uploads
router.post('/test-upload', 
  upload.single('file'), 
  orarioController.testFileUpload
);
module.exports = router;