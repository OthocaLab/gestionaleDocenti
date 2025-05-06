const express = require('express');
const router = express.Router();
const classeController = require('../controllers/classeController');

// Rotta per importare le classi di esempio
router.post('/importa-esempio', classeController.importaClassiEsempio);

// Altre rotte per le classi
router.get('/', classeController.getAllClassi);
router.post('/', classeController.createClasse);
router.put('/:id', classeController.updateClasse);
router.delete('/:id', classeController.deleteClasse);

module.exports = router;