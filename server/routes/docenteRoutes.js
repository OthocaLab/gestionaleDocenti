const express = require('express');
const router = express.Router();
const docenteController = require('../controllers/docenteController');

// GET /api/docenti - Ottieni tutti i docenti
router.get('/', docenteController.getAllDocenti);

// GET /api/docenti/disp - Ottieni tutti i docenti con codice materia DISP
router.get('/disp', (req, res) => {
  req.query.codiceMateria = 'DISP';
  docenteController.getAllDocenti(req, res);
});

// GET /api/docenti/disponibili - Ottieni docenti disponibili per sostituzioni
router.get('/disponibili', docenteController.getDocentiPerSostituzione);

// POST /api/docenti - Crea un nuovo docente
router.post('/', docenteController.createDocente);

// PUT /api/docenti/:id - Aggiorna un docente esistente
router.put('/:id', docenteController.updateDocente);

// DELETE /api/docenti/:id - Elimina un docente
router.delete('/:id', docenteController.deleteDocente);

// GET /api/docenti/recupero - Ottieni docenti con ore da recuperare
router.get('/recupero', docenteController.getDocentiRecupero);

// POST /api/docenti/sostituzione - Registra sostituzione
router.post('/sostituzione', docenteController.registraSostituzione);

// POST /api/docenti/crea-disp - Crea docenti con codice DISP per test
router.post('/crea-disp', docenteController.creaDocentiDisp);

module.exports = router;