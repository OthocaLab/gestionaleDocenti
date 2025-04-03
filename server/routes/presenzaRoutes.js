const express = require('express');
const router = express.Router();
const presenzaController = require('../controllers/presenzaController');
const { protect } = require('../middleware/auth');

// Rotte protette da autenticazione
router.use(protect);

// GET /api/presenze/statistiche - Ottieni statistiche presenze/assenze
router.get('/statistiche', presenzaController.getStatistiche);

// GET /api/presenze - Ottieni elenco presenze/assenze
router.get('/', presenzaController.getPresenze);

// POST /api/presenze - Registra presenza/assenza
router.post('/', presenzaController.registraPresenza);

// POST /api/presenze/sostituzione - Registra sostituzione per un'ora specifica
router.post('/sostituzione', presenzaController.registraSostituzione);

module.exports = router;