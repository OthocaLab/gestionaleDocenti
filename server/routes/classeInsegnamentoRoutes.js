const express = require('express');
const router = express.Router();
const classeInsegnamentoController = require('../controllers/classeInsegnamentoController');

router.get('/', classeInsegnamentoController.getAllClassiInsegnamento);
router.post('/', classeInsegnamentoController.createClasseInsegnamento);
router.put('/:id', classeInsegnamentoController.updateClasseInsegnamento);
router.delete('/:id', classeInsegnamentoController.deleteClasseInsegnamento);

module.exports = router;