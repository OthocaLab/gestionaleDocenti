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
require('dotenv').config({ path: '../.env' });

// Importa Redis client
const redisHelper = require('./config/redisClient');

// Debug: verifica il caricamento delle variabili d'ambiente
console.log('🔧 Debug variabili d\'ambiente:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? '✅ Caricato' : '❌ NON trovato');
console.log('- PORT:', process.env.PORT);
console.log('- HOST:', process.env.HOST);
console.log('- REDIS_ENABLED:', process.env.REDIS_ENABLED === 'true' ? '✅ Abilitato' : '❌ Disabilitato');

// Importa le route
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const orarioRoutes = require('./routes/orarioRoutes');
const docenteRoutes = require('./routes/docenteRoutes');
const assenzaRoutes = require('./routes/assenzaRoutes'); // Nuova route per le assenze
const importRoutes = require('./routes/importRoutes'); // Nuova route per l'importazione

// Inizializza l'app Express
const app = express();

// Trust proxy - IMPORTANTE per funzionare dietro Nginx
app.set('trust proxy', 1);

// Aumenta i timeout per le operazioni di importazione
app.use((req, res, next) => {
  // Aumenta il timeout per le route di importazione
  if (req.path.includes('/import')) {
    req.setTimeout(300000); // 5 minuti
    res.setTimeout(300000); // 5 minuti
  }
  next();
});

// Use HOST and PORT from .env
const port = process.env.PORT || 5000;
const host = process.env.HOST || 'localhost';

// Middleware
app.use(morgan('dev')); // Logging

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Get allowed origins from environment variable
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
      : ['http://localhost:3000']; // fallback default
    
    console.log(`[CORS] Checking origin: ${origin}`);
    console.log(`[CORS] Allowed origins: ${allowedOrigins.join(', ')}`);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log(`[CORS] Origin ${origin} allowed`);
      callback(null, true);
    } else {
      console.log(`[CORS] Origin ${origin} NOT allowed`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Aumenta il limite di dimensione per le richieste
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

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
  message: 'Troppe richieste da questo IP, riprova più tardi',
  // Configurazione per funzionare dietro proxy
  trustProxy: true,
  // Usa l'IP reale dal proxy
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
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
app.use('/api/import', importRoutes); // Nuova route per l'importazione

// Route di base
app.get('/', (req, res) => {
  res.send('API per la gestione delle sostituzioni dei docenti');
});

// Health check endpoint (include MongoDB e Redis)
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      mongodb: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        readyState: mongoose.connection.readyState
      },
      redis: {
        enabled: process.env.REDIS_ENABLED === 'true',
        available: redisHelper.isAvailable(),
        status: 'unknown'
      }
    }
  };

  // Test Redis connection con ping
  if (redisHelper.isAvailable()) {
    try {
      const pingSuccess = await redisHelper.ping();
      health.services.redis.status = pingSuccess ? 'connected' : 'error';
      
      // Opzionale: aggiungi statistiche se il ping ha successo
      if (pingSuccess) {
        const stats = await redisHelper.getStats();
        health.services.redis.activeResetTokens = stats.resetTokensActive;
      }
    } catch (error) {
      health.services.redis.status = 'error';
      health.services.redis.error = error.message;
    }
  } else {
    health.services.redis.status = 'disabled';
  }

  // Determina status generale
  if (mongoose.connection.readyState !== 1) {
    health.status = 'error';
    return res.status(503).json(health);
  }

  // Se Redis è abilitato ma non disponibile, segnala warning
  if (process.env.REDIS_ENABLED === 'true' && !redisHelper.isAvailable()) {
    health.status = 'warning';
  }

  res.status(200).json(health);
});

// Redis stats endpoint (solo per admin/debug)
app.get('/api/redis/stats', async (req, res) => {
  if (!redisHelper.isAvailable()) {
    return res.status(503).json({
      success: false,
      message: 'Redis non disponibile'
    });
  }

  try {
    const stats = await redisHelper.getStats();
    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero statistiche Redis',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
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
    const server = app.listen(port, host, () => {
      console.log(`Server is running on ${host}:${port}`);
      console.log(`Allowed CORS origins: ${process.env.ALLOWED_ORIGINS || 'http://localhost:3000'}`);
    });

    // Gestione graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} ricevuto. Chiusura graceful in corso...`);
      
      // Chiudi il server HTTP
      server.close(async () => {
        console.log('Server HTTP chiuso');
        
        try {
          // Disconnetti MongoDB
          await mongoose.connection.close();
          console.log('MongoDB disconnesso');
          
          // Disconnetti Redis
          await redisHelper.disconnect();
          
          console.log('✅ Shutdown completato con successo');
          process.exit(0);
        } catch (error) {
          console.error('❌ Errore durante lo shutdown:', error);
          process.exit(1);
        }
      });

      // Forza chiusura dopo 10 secondi
      setTimeout(() => {
        console.error('⚠️  Shutdown forzato dopo timeout');
        process.exit(1);
      }, 10000);
    };

    // Ascolta i segnali di terminazione
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  })
  .catch((err) => {
    console.error('Errore di connessione al database:', err);
    process.exit(1);
  });