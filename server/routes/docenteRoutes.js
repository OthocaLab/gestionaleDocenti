const express = require('express');
const router = express.Router();
const docenteController = require('../controllers/docenteController');

// GET /api/docenti - Ottieni tutti i docenti
router.get('/', docenteController.getAllDocenti);

// POST /api/docenti - Crea un nuovo docente
router.post('/', docenteController.createDocente);

// PUT /api/docenti/:id - Aggiorna un docente esistente
router.put('/:id', docenteController.updateDocente);

// DELETE /api/docenti/:id - Elimina un docente
router.delete('/:id', docenteController.deleteDocente);

// GET /api/docenti/recupero - Ottieni docenti con ore da recuperare
router.get('/recupero', docenteController.getDocentiRecupero);

module.exports = router;