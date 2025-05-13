const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const dotenv = require('dotenv');
const materiaRoutes = require('./routes/materiaRoutes');
const classeInsegnamentoRoutes = require('./routes/classeInsegnamentoRoutes');
const classeRoutes = require('./routes/classeRoutes'); // Added import for classeRoutes
const sostituzioneRoutes = require('./routes/sostituzioneRoutes'); // Added import for sostituzioneRoutes

// Carica le variabili d'ambiente
require('dotenv').config();

// Importa le route
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const orarioRoutes = require('./routes/orarioRoutes');
const docenteRoutes = require('./routes/docenteRoutes');
const assenzaRoutes = require('./routes/assenzaRoutes'); // Nuova route per le assenze

// Inizializza l'app Express
const app = express();

// Use PORT from .env, fallback to 5000 if not specified
const port = process.env.PORT || 5000;

// Middleware
app.use(morgan('dev')); // Logging
app.use(cors({
  origin: '*', // Consenti richieste da qualsiasi origine per debugging
  credentials: true
}));

// Aumenta il limite di dimensione per le richieste
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Disabilita Helmet temporaneamente per debug
// app.use(helmet());

// Imposta il limite di memoria per NodeJS
if (process.env.NODE_ENV === 'production') {
  // In produzione, usa un valore più conservativo
  process.env.NODE_OPTIONS = '--max-old-space-size=2048';
} else {
  // In sviluppo, usa un valore più alto per facilitare i test
  process.env.NODE_OPTIONS = '--max-old-space-size=4096';
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // limite di 100 richieste per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Troppe richieste da questo IP, riprova più tardi'
});

// Applica il rate limiter alle route di autenticazione
app.use('/api/auth', limiter);

// Mount routers
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orario', orarioRoutes);
app.use('/api/docenti', docenteRoutes);
app.use('/api/assenze', assenzaRoutes);
app.use('/api/materie', materiaRoutes);
app.use('/api/classi', classeRoutes);
app.use('/api/classi-insegnamento', classeInsegnamentoRoutes);
app.use('/api/sostituzioni', sostituzioneRoutes); // Added new route for sostituzioni

// Route di base
app.get('/', (req, res) => {
  res.send('API per la gestione delle sostituzioni dei docenti');
});

// Gestione degli errori
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  
  // Verifica se l'errore è correlato a limiti di payload
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(413).json({
      success: false,
      message: 'Payload troppo grande o malformato',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Si è verificato un errore interno del server',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Gestione delle eccezioni non catturate
process.on('uncaughtException', (err) => {
  console.error('Eccezione non catturata:', err);
  console.error('Stack trace:', err.stack);
  // In produzione, potresti voler riavviare il server con PM2 o simile
  // Oppure inviare una notifica al team di sviluppo
});

// Gestione delle promesse rifiutate non catturate
process.on('unhandledRejection', (reason, promise) => {
  console.error('Promessa rifiutata non gestita:');
  console.error('Reason:', reason);
  // In produzione, potresti voler riavviare il server con PM2 o simile
  // Oppure inviare una notifica al team di sviluppo
});

// Connessione al database
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connessione al database MongoDB stabilita con successo');
    // Avvia il server
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Errore di connessione al database:', err);
    process.exit(1);
  });