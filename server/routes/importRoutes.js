const express = require('express');
const importController = require('../controllers/importController');
const { protect, authorize, debugAuth } = require('../middleware/auth');
const { upload, uploadWithErrorHandling } = require('../middleware/uploadMiddleware');

const router = express.Router();

// Rotta per controllare lo stato dell'importazione
router.get('/status', 
  protect,
  importController.getImportStatus
);

// Rotta per l'importazione degli orari
router.post('/orari', 
  debugAuth,  // Debug middleware per controllare l'autenticazione
  protect,  // Richiede autenticazione
  authorize('admin', 'vicepresidenza'),  // Richiede autorizzazione
  uploadWithErrorHandling('file'),  // Gestisce l'upload con miglior gestione degli errori
  importController.importaOrari
);

// Rotta di test per il caricamento file
router.post('/test-upload', 
  protect,
  upload.single('file'), 
  importController.testFileUpload
);

// Rotta di test per pulire i dati di test (solo in sviluppo)
router.delete('/clean-test-data',
  protect,
  authorize('admin'),
  importController.cleanTestData
);

module.exports = router;