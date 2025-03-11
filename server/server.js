const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Carica le variabili d'ambiente
require('dotenv').config();

// Importa le route
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

// Inizializza l'app Express
const app = express();

// Use PORT from .env, fallback to 5000 if not specified
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

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

// Route
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Route di base
app.get('/', (req, res) => {
  res.send('API per la gestione delle sostituzioni docenti');
});

// Gestione degli errori
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Si è verificato un errore interno del server',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
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