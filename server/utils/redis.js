const { createClient } = require('redis');
require('dotenv').config();

// Configurazione client Redis
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Gestione eventi Redis
redisClient.on('error', (err) => {
  console.error('[REDIS] Errore di connessione:', err);
});

redisClient.on('connect', () => {
  console.log('[REDIS] Client connesso con successo');
});

// Funzione per inizializzare la connessione
const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('[REDIS] Connessione stabilita');
  } catch (error) {
    console.error('[REDIS] Errore durante la connessione:', error);
  }
};

// Funzione per memorizzare un codice di verifica
const storeVerificationCode = async (userId, code) => {
  try {
    // Salva il codice con TTL di 10 minuti (600 secondi)
    await redisClient.set(`verification:${userId}`, code, { EX: 600 });
    return true;
  } catch (error) {
    console.error('[REDIS] Errore durante il salvataggio del codice:', error);
    return false;
  }
};

// Funzione per recuperare un codice di verifica
const getVerificationCode = async (userId) => {
  try {
    const code = await redisClient.get(`verification:${userId}`);
    return code;
  } catch (error) {
    console.error('[REDIS] Errore durante il recupero del codice:', error);
    return null;
  }
};

// Funzione per eliminare un codice di verifica
const deleteVerificationCode = async (userId) => {
  try {
    await redisClient.del(`verification:${userId}`);
    return true;
  } catch (error) {
    console.error('[REDIS] Errore durante l\'eliminazione del codice:', error);
    return false;
  }
};

module.exports = {
  connectRedis,
  storeVerificationCode,
  getVerificationCode,
  deleteVerificationCode
}; 