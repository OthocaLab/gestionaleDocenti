const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { importaOrarioDocenti } = require('../controllers/importazioneController');
const { protect } = require('../middleware/auth'); // Modifica qui

// Configurazione di multer per l'upload dei file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `orario_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite di 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Solo file JSON sono supportati'), false);
    }
  }
});

// Route per l'importazione dell'orario docenti
router.post('/importa-docenti', protect, upload.single('file'), importaOrarioDocenti);

module.exports = router;