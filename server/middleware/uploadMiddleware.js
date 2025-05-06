const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Filtro per i file consentiti
const fileFilter = (req, file, cb) => {
  // Accetta solo JSON per ora
  if (file.mimetype === 'application/json') {
    cb(null, true);
  } else {
    cb(new Error('Formato file non supportato. Solo JSON è consentito.'), false);
  }
};

// Configurazione multer con limiti aumentati
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 1 // Massimo 1 file per richiesta
  },
  fileFilter: fileFilter
});

// Handler personalizzato per catturare errori di upload
const uploadWithErrorHandling = (fieldName) => {
  return (req, res, next) => {
    const uploader = upload.single(fieldName);
    
    uploader(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          // Errore di multer
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
              success: false,
              message: 'File troppo grande. Il limite è di 10 MB'
            });
          }
          return res.status(400).json({
            success: false,
            message: `Errore upload: ${err.message}`
          });
        } else {
          // Errore generico
          return res.status(500).json({
            success: false,
            message: err.message || 'Errore durante l\'upload del file'
          });
        }
      }
      
      // Se non ci sono file ma il campo è richiesto
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Nessun file caricato'
        });
      }
      
      // Tutto ok, prosegui
      next();
    });
  };
};

module.exports = {
  upload,
  uploadWithErrorHandling
};