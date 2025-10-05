const redis = require('redis');
require('dotenv').config();

// Verifica se Redis è abilitato
const isRedisEnabled = process.env.REDIS_ENABLED === 'true';

console.log('[REDIS] Configurazione:', {
  enabled: isRedisEnabled,
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD ? '***' : '(nessuna)',
  database: process.env.REDIS_DB
});

let client = null;

if (isRedisEnabled) {
  // Configurazione client Redis
  const redisConfig = {
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
    },
    database: parseInt(process.env.REDIS_DB) || 0
  };

  // Aggiungi password solo se configurata
  if (process.env.REDIS_PASSWORD) {
    redisConfig.password = process.env.REDIS_PASSWORD;
  }

  client = redis.createClient(redisConfig);

  // Event handlers
  client.on('connect', () => {
    console.log('[REDIS] Connessione in corso...');
  });

  client.on('ready', () => {
    console.log('[REDIS] ✅ Client connesso e pronto');
  });

  client.on('error', (err) => {
    console.error('[REDIS] ❌ Errore:', err.message);
    if (process.env.NODE_ENV === 'development') {
      console.error('[REDIS] Stack trace:', err.stack);
    }
  });

  client.on('end', () => {
    console.log('[REDIS] 🔌 Connessione chiusa');
  });

  client.on('reconnecting', () => {
    console.log('[REDIS] 🔄 Tentativo di riconnessione...');
  });

  // Connetti il client
  client.connect().catch((err) => {
    console.error('[REDIS] ❌ Errore durante la connessione:', err.message);
    console.error('[REDIS] Redis è stato disabilitato automaticamente');
  });
} else {
  console.log('[REDIS] ⚠️  Redis disabilitato tramite configurazione (REDIS_ENABLED=false)');
}

/**
 * Funzioni helper per gestione reset token
 */
const redisHelper = {
  /**
   * Salva token di reset con TTL
   * @param {string} email - Email dell'utente
   * @param {string} token - Token JWT di reset
   * @param {number} expireSeconds - Tempo di scadenza in secondi
   * @returns {Promise<Object>} Risultato dell'operazione
   */
  async setResetToken(email, token, expireSeconds) {
    if (!isRedisEnabled || !client || !client.isOpen) {
      console.log('[REDIS] ⚠️  Operazione saltata: Redis non disponibile');
      return { success: false, reason: 'REDIS_DISABLED' };
    }
    
    try {
      const key = `reset_token:${email}`;
      await client.setEx(key, expireSeconds, token);
      console.log(`[REDIS] ✅ Token salvato per ${email}, scade tra ${expireSeconds}s (${Math.floor(expireSeconds / 60)} minuti)`);
      return { success: true };
    } catch (error) {
      console.error('[REDIS] ❌ Errore setResetToken:', error.message);
      throw error;
    }
  },

  /**
   * Recupera token di reset
   * @param {string} email - Email dell'utente
   * @returns {Promise<string|null>} Token o null se non trovato
   */
  async getResetToken(email) {
    if (!isRedisEnabled || !client || !client.isOpen) {
      console.log('[REDIS] ⚠️  Operazione saltata: Redis non disponibile');
      return null;
    }
    
    try {
      const key = `reset_token:${email}`;
      const token = await client.get(key);
      
      if (token) {
        console.log(`[REDIS] ✅ Token recuperato per ${email}`);
      } else {
        console.log(`[REDIS] ℹ️  Nessun token trovato per ${email}`);
      }
      
      return token;
    } catch (error) {
      console.error('[REDIS] ❌ Errore getResetToken:', error.message);
      throw error;
    }
  },

  /**
   * Elimina token di reset (dopo utilizzo o invalidazione)
   * @param {string} email - Email dell'utente
   * @returns {Promise<Object>} Risultato dell'operazione
   */
  async deleteResetToken(email) {
    if (!isRedisEnabled || !client || !client.isOpen) {
      console.log('[REDIS] ⚠️  Operazione saltata: Redis non disponibile');
      return { success: false, reason: 'REDIS_DISABLED' };
    }
    
    try {
      const key = `reset_token:${email}`;
      const result = await client.del(key);
      
      if (result > 0) {
        console.log(`[REDIS] ✅ Token eliminato per ${email}`);
      } else {
        console.log(`[REDIS] ℹ️  Nessun token da eliminare per ${email}`);
      }
      
      return { success: true, deleted: result };
    } catch (error) {
      console.error('[REDIS] ❌ Errore deleteResetToken:', error.message);
      throw error;
    }
  },

  /**
   * Verifica se il token è valido
   * @param {string} email - Email dell'utente
   * @param {string} token - Token da verificare
   * @returns {Promise<boolean>} True se il token è valido
   */
  async isResetTokenValid(email, token) {
    if (!isRedisEnabled || !client || !client.isOpen) {
      console.log('[REDIS] ⚠️  Operazione saltata: Redis non disponibile');
      return false;
    }
    
    try {
      const storedToken = await this.getResetToken(email);
      const isValid = storedToken === token;
      
      if (isValid) {
        console.log(`[REDIS] ✅ Token valido per ${email}`);
      } else {
        console.log(`[REDIS] ❌ Token NON valido per ${email}`);
      }
      
      return isValid;
    } catch (error) {
      console.error('[REDIS] ❌ Errore isResetTokenValid:', error.message);
      return false;
    }
  },

  /**
   * Ottieni il TTL (Time To Live) rimanente per un token
   * @param {string} email - Email dell'utente
   * @returns {Promise<number>} Secondi rimanenti o -1 se non esiste/-2 se senza scadenza
   */
  async getResetTokenTTL(email) {
    if (!isRedisEnabled || !client || !client.isOpen) {
      return -1;
    }
    
    try {
      const key = `reset_token:${email}`;
      const ttl = await client.ttl(key);
      
      if (ttl > 0) {
        console.log(`[REDIS] ℹ️  Token per ${email} scade tra ${ttl}s (${Math.floor(ttl / 60)} minuti)`);
      }
      
      return ttl;
    } catch (error) {
      console.error('[REDIS] ❌ Errore getResetTokenTTL:', error.message);
      return -1;
    }
  },

  /**
   * Conta quanti token di reset sono attivi
   * @returns {Promise<number>} Numero di token attivi
   */
  async countActiveResetTokens() {
    if (!isRedisEnabled || !client || !client.isOpen) {
      return 0;
    }
    
    try {
      const keys = await client.keys('reset_token:*');
      console.log(`[REDIS] ℹ️  Token di reset attivi: ${keys.length}`);
      return keys.length;
    } catch (error) {
      console.error('[REDIS] ❌ Errore countActiveResetTokens:', error.message);
      return 0;
    }
  },

  /**
   * Verifica se Redis è disponibile e connesso
   * @returns {boolean} True se Redis è disponibile
   */
  isAvailable() {
    return isRedisEnabled && client && client.isOpen;
  },

  /**
   * Esegui ping per testare la connessione
   * @returns {Promise<boolean>} True se il ping ha successo
   */
  async ping() {
    if (!this.isAvailable()) {
      return false;
    }
    
    try {
      const response = await client.ping();
      const success = response === 'PONG';
      
      if (success) {
        console.log('[REDIS] 🏓 PING -> PONG');
      }
      
      return success;
    } catch (error) {
      console.error('[REDIS] ❌ Errore ping:', error.message);
      return false;
    }
  },

  /**
   * Ottieni statistiche Redis
   * @returns {Promise<Object>} Statistiche del server Redis
   */
  async getStats() {
    if (!this.isAvailable()) {
      return { available: false };
    }
    
    try {
      const info = await client.info('stats');
      const resetTokens = await this.countActiveResetTokens();
      
      return {
        available: true,
        isConnected: client.isOpen,
        resetTokensActive: resetTokens,
        rawStats: info
      };
    } catch (error) {
      console.error('[REDIS] ❌ Errore getStats:', error.message);
      return { available: false, error: error.message };
    }
  },

  /**
   * Chiudi connessione (per shutdown graceful)
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (client && client.isOpen) {
      try {
        await client.quit();
        console.log('[REDIS] 👋 Disconnessione completata');
      } catch (error) {
        console.error('[REDIS] ❌ Errore durante la disconnessione:', error.message);
        // Force close in caso di errore
        await client.disconnect();
      }
    }
  },

  /**
   * Salva codice di verifica email con TTL
   * @param {string} email - Email dell'utente
   * @param {string} code - Codice a 6 cifre
   * @param {number} expireSeconds - Tempo di scadenza in secondi
   * @returns {Promise<Object>} Risultato dell'operazione
   */
  async setVerificationCode(email, code, expireSeconds) {
    if (!isRedisEnabled || !client || !client.isOpen) {
      console.log('[REDIS] ⚠️  Operazione saltata: Redis non disponibile');
      return { success: false, reason: 'REDIS_DISABLED' };
    }
    
    try {
      const key = `verification_code:${email}`;
      await client.setEx(key, expireSeconds, code);
      console.log(`[REDIS] ✅ Codice verifica salvato per ${email}, scade tra ${expireSeconds}s`);
      return { success: true };
    } catch (error) {
      console.error('[REDIS] ❌ Errore setVerificationCode:', error.message);
      throw error;
    }
  },

  /**
   * Recupera codice di verifica email
   * @param {string} email - Email dell'utente
   * @returns {Promise<string|null>} Codice o null se non trovato
   */
  async getVerificationCode(email) {
    if (!isRedisEnabled || !client || !client.isOpen) {
      return null;
    }
    
    try {
      const key = `verification_code:${email}`;
      const code = await client.get(key);
      
      if (code) {
        console.log(`[REDIS] ✅ Codice verifica recuperato per ${email}`);
      } else {
        console.log(`[REDIS] ℹ️  Nessun codice trovato per ${email}`);
      }
      
      return code;
    } catch (error) {
      console.error('[REDIS] ❌ Errore getVerificationCode:', error.message);
      throw error;
    }
  },

  /**
   * Elimina codice di verifica (dopo utilizzo o scadenza)
   * @param {string} email - Email dell'utente
   * @returns {Promise<Object>} Risultato dell'operazione
   */
  async deleteVerificationCode(email) {
    if (!isRedisEnabled || !client || !client.isOpen) {
      return { success: false, reason: 'REDIS_DISABLED' };
    }
    
    try {
      const key = `verification_code:${email}`;
      const result = await client.del(key);
      
      if (result > 0) {
        console.log(`[REDIS] ✅ Codice verifica eliminato per ${email}`);
      }
      
      return { success: true, deleted: result };
    } catch (error) {
      console.error('[REDIS] ❌ Errore deleteVerificationCode:', error.message);
      throw error;
    }
  },

  /**
   * Verifica se il codice è valido
   * @param {string} email - Email dell'utente
   * @param {string} code - Codice da verificare
   * @returns {Promise<boolean>} True se il codice è valido
   */
  async isVerificationCodeValid(email, code) {
    if (!isRedisEnabled || !client || !client.isOpen) {
      return false;
    }
    
    try {
      const storedCode = await this.getVerificationCode(email);
      const isValid = storedCode === code;
      
      if (isValid) {
        console.log(`[REDIS] ✅ Codice verifica valido per ${email}`);
      } else {
        console.log(`[REDIS] ❌ Codice verifica NON valido per ${email}`);
      }
      
      return isValid;
    } catch (error) {
      console.error('[REDIS] ❌ Errore isVerificationCodeValid:', error.message);
      return false;
    }
  },

  /**
   * Ottieni il client Redis (uso avanzato)
   * @returns {Object|null} Client Redis o null
   */
  getClient() {
    return client;
  }
};

module.exports = redisHelper;

