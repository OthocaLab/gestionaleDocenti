const express = require('express');
const router = express.Router();
const assenzeController = require('../controllers/assenzeController');
const { protect } = require('../middleware/auth');

// Rotte protette da autenticazione
router.use(protect);

// GET /api/assenze/statistiche - Ottieni statistiche assenze
router.get('/statistiche', assenzeController.getStatistiche);

// GET /api/assenze - Ottieni elenco assenze
router.get('/', assenzeController.getAssenze);

// POST /api/assenze - Registra assenza
router.post('/', assenzeController.registraAssenza);

// POST /api/assenze/sostituzione - Registra sostituzione
router.post('/sostituzione', assenzeController.registraSostituzione);

module.exports = router;