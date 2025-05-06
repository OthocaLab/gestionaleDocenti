const express = require('express');
const router = express.Router();
const classeInsegnamentoController = require('../controllers/classeInsegnamentoController');
const { upload, uploadWithErrorHandling } = require('../middleware/uploadMiddleware');

router.get('/', classeInsegnamentoController.getAllClassiInsegnamento);
router.post('/', classeInsegnamentoController.createClasseInsegnamento);
router.put('/:id', classeInsegnamentoController.updateClasseInsegnamento);
router.delete('/:id', classeInsegnamentoController.deleteClasseInsegnamento);

// Nuova rotta per l'importazione da JSON, con gestione degli errori migliorata
router.post('/import', 
  uploadWithErrorHandling('file'), 
  classeInsegnamentoController.importClassiInsegnamento
);

module.exports = router;