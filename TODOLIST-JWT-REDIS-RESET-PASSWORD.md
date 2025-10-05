# 🔐 Todolist: Implementazione JWT + Redis per Reset Password

> **Progetto**: Gestionale Docenti - Othoca Labs  
> **Data creazione**: 5 Ottobre 2025  
> **Obiettivo**: Reimplementare il sistema di reset password utilizzando JWT + Redis per gestire i token di sicurezza

---

## 📋 Panoramica

Attualmente il sistema di reset password utilizza:
- Token generati con `crypto.randomBytes(20)`
- Token salvati direttamente nel database MongoDB (campi `resetPasswordToken` e `resetPasswordExpire`)
- Nessuna gestione centralizzata dei token
- Nessuna possibilità di invalidare token attivi

Con l'implementazione JWT + Redis avremo:
- Token JWT firmati e sicuri con scadenza incorporata
- Storage dei token in Redis per gestione rapida e invalidazione
- Possibilità di revocare token attivi
- Migliori performance (Redis in-memory vs MongoDB query)
- Separazione delle responsabilità (autenticazione vs persistenza)

---

## 🎯 Task List

### 1. **Setup Ambiente e Dipendenze**

#### 1.1 Installazione Dipendenze Redis
- [ ] Installare il client Redis per Node.js
  ```bash
  cd server
  npm install redis@^4.6.0
  ```
- [ ] Verificare la versione installata in `package.json`

#### 1.2 Installazione Redis Server
- [ ] **Opzione A - Installazione Locale (Sviluppo)**
  ```bash
  # Ubuntu/Debian
  sudo apt update
  sudo apt install redis-server
  sudo systemctl start redis-server
  sudo systemctl enable redis-server
  
  # Verifica installazione
  redis-cli ping  # Dovrebbe rispondere "PONG"
  ```

- [ ] **Opzione B - Docker (Raccomandato per coerenza sviluppo/produzione)**
  - Aggiungere servizio Redis al `docker-compose.yml` esistente
  - Configurare networking tra backend e Redis
  - Configurare volume per persistenza dati (opzionale)

#### 1.3 Configurazione Variabili d'Ambiente
- [ ] Aggiungere variabili Redis in `environment-config.txt`:
  ```env
  # Redis Configuration 
  REDIS_HOST=localhost
  REDIS_PORT=6379
  REDIS_PASSWORD=
  REDIS_DB=0
  REDIS_ENABLED=true
  
  # Reset Password Token Configuration
  RESET_PASSWORD_JWT_SECRET=your_secure_reset_password_secret_key_here
  RESET_PASSWORD_TOKEN_EXPIRE=1800  # 30 minuti in secondi
  ```

- [ ] Aggiungere le stesse variabili in `environment-production.txt` con valori di produzione

- [ ] Aggiornare il file `.env` locale con le nuove variabili

- [ ] Aggiornare `docker-compose.yml` per includere le variabili Redis nel servizio backend

---

### 2. **Configurazione Redis**

#### 2.1 Creare Utility Redis
- [ ] Creare file `server/config/redisClient.js` con:
  - Connessione client Redis
  - Gestione errori e reconnect
  - Log di connessione/disconnessione
  - Funzioni helper per gestione token:
    - `setResetToken(email, token, expireSeconds)`
    - `getResetToken(email)`
    - `deleteResetToken(email)`
    - `isResetTokenValid(email, token)`

**Template suggerito**:
```javascript
const redis = require('redis');
require('dotenv').config();

// Verifica se Redis è abilitato
const isRedisEnabled = process.env.REDIS_ENABLED === 'true';

let client = null;

if (isRedisEnabled) {
  // Configurazione client Redis
  client = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
    },
    password: process.env.REDIS_PASSWORD || undefined,
    database: parseInt(process.env.REDIS_DB) || 0
  });

  // Event handlers
  client.on('connect', () => {
    console.log('[REDIS] Connessione in corso...');
  });

  client.on('ready', () => {
    console.log('[REDIS] Client connesso e pronto');
  });

  client.on('error', (err) => {
    console.error('[REDIS] Errore:', err);
  });

  client.on('end', () => {
    console.log('[REDIS] Connessione chiusa');
  });

  // Connetti il client
  client.connect().catch(console.error);
} else {
  console.log('[REDIS] Redis disabilitato tramite configurazione');
}

// Funzioni helper per gestione reset token
const redisHelper = {
  // Salva token di reset con TTL
  async setResetToken(email, token, expireSeconds) {
    if (!isRedisEnabled || !client) {
      console.log('[REDIS] Operazione saltata: Redis disabilitato');
      return { success: false, reason: 'REDIS_DISABLED' };
    }
    
    try {
      const key = `reset_token:${email}`;
      await client.setEx(key, expireSeconds, token);
      console.log(`[REDIS] Token salvato per ${email}, scade tra ${expireSeconds}s`);
      return { success: true };
    } catch (error) {
      console.error('[REDIS] Errore setResetToken:', error);
      throw error;
    }
  },

  // Recupera token di reset
  async getResetToken(email) {
    if (!isRedisEnabled || !client) {
      return null;
    }
    
    try {
      const key = `reset_token:${email}`;
      const token = await client.get(key);
      return token;
    } catch (error) {
      console.error('[REDIS] Errore getResetToken:', error);
      throw error;
    }
  },

  // Elimina token di reset (dopo utilizzo o invalidazione)
  async deleteResetToken(email) {
    if (!isRedisEnabled || !client) {
      return { success: false, reason: 'REDIS_DISABLED' };
    }
    
    try {
      const key = `reset_token:${email}`;
      await client.del(key);
      console.log(`[REDIS] Token eliminato per ${email}`);
      return { success: true };
    } catch (error) {
      console.error('[REDIS] Errore deleteResetToken:', error);
      throw error;
    }
  },

  // Verifica se il token è valido
  async isResetTokenValid(email, token) {
    if (!isRedisEnabled || !client) {
      return false;
    }
    
    try {
      const storedToken = await this.getResetToken(email);
      return storedToken === token;
    } catch (error) {
      console.error('[REDIS] Errore isResetTokenValid:', error);
      return false;
    }
  },

  // Chiudi connessione (per shutdown graceful)
  async disconnect() {
    if (client && client.isOpen) {
      await client.quit();
    }
  }
};

module.exports = redisHelper;
```

#### 2.2 Integrare Redis in server.js
- [ ] Importare `redisClient.js` in `server/server.js`
- [ ] Gestire disconnessione Redis in caso di shutdown del server
- [ ] Aggiungere health check endpoint per Redis (opzionale ma consigliato)

---

### 3. **Modifica Controller e Logica Reset Password**

#### 3.1 Aggiornare `forgotPassword` in `authController.js`
- [ ] Rimuovere la generazione con `crypto.randomBytes`
- [ ] Implementare generazione JWT per reset password:
  ```javascript
  const resetToken = jwt.sign(
    { email: user.email, type: 'password_reset' },
    process.env.RESET_PASSWORD_JWT_SECRET,
    { expiresIn: process.env.RESET_PASSWORD_TOKEN_EXPIRE || '1800s' }
  );
  ```
- [ ] Salvare il token in Redis invece che nel database:
  ```javascript
  const expireSeconds = parseInt(process.env.RESET_PASSWORD_TOKEN_EXPIRE) || 1800;
  await redisHelper.setResetToken(user.email, resetToken, expireSeconds);
  ```
- [ ] Aggiornare l'URL di reset da inviare via email
- [ ] Gestire il caso in cui Redis sia disabilitato (fallback o errore)
- [ ] Rimuovere la logica di salvataggio `resetPasswordToken` e `resetPasswordExpire` nel modello User

#### 3.2 Aggiornare `resetPassword` in `authController.js`
- [ ] Modificare la verifica del token:
  - Decodificare e verificare il JWT
  - Recuperare l'email dal payload JWT
  - Verificare che il token esista in Redis per quell'email
- [ ] Implementare la nuova logica:
  ```javascript
  // Verifica JWT
  const decoded = jwt.verify(
    req.params.resetToken, 
    process.env.RESET_PASSWORD_JWT_SECRET
  );
  
  // Controlla che sia un token di tipo reset
  if (decoded.type !== 'password_reset') {
    return res.status(400).json({ 
      success: false, 
      message: 'Token non valido' 
    });
  }
  
  // Verifica presenza in Redis
  const isValid = await redisHelper.isResetTokenValid(
    decoded.email, 
    req.params.resetToken
  );
  
  if (!isValid) {
    return res.status(400).json({ 
      success: false, 
      message: 'Token non valido o già utilizzato' 
    });
  }
  
  // Trova utente
  const user = await User.findOne({ email: decoded.email });
  ```
- [ ] Eliminare il token da Redis dopo l'utilizzo (anche se TTL lo eliminerebbe automaticamente)
- [ ] Gestire errori JWT (token scaduto, firma non valida, ecc.)
- [ ] Aggiornare password e salvare nel database
- [ ] Generare nuovo token JWT di autenticazione

#### 3.3 Gestione Errori
- [ ] Aggiungere try-catch per errori JWT (`TokenExpiredError`, `JsonWebTokenError`)
- [ ] Gestire disconnessione Redis con messaggi chiari all'utente
- [ ] Log dettagliati per debugging in sviluppo

---

### 4. **Aggiornamento Model User**

#### 4.1 Rimuovere Campi Obsoleti (Opzionale ma Consigliato)
- [ ] Valutare se rimuovere i campi `resetPasswordToken` e `resetPasswordExpire` dal modello `User.js`
  - **Pro**: Database più pulito, logica centralizzata in Redis
  - **Contro**: Se Redis fallisce, non c'è fallback nel DB
  - **Compromesso**: Mantenerli come fallback ma non usarli primariamente

#### 4.2 Documentare Cambiamento
- [ ] Aggiungere commento nel modello indicando che il reset ora usa Redis

---

### 5. **Test e Validazione**

#### 5.1 Test Manuali
- [ ] **Test Flusso Completo**:
  1. Richiedere reset password da UI
  2. Verificare che il token venga salvato in Redis
     ```bash
     redis-cli
     KEYS reset_token:*
     GET reset_token:email@example.com
     ```
  3. Verificare ricezione email con link
  4. Cliccare link e reimpostare password
  5. Verificare che il token venga eliminato da Redis dopo l'uso
  6. Tentare di riutilizzare lo stesso link (deve fallire)

- [ ] **Test Scadenza Token**:
  1. Ridurre `RESET_PASSWORD_TOKEN_EXPIRE` a 60 secondi
  2. Richiedere reset
  3. Attendere 61 secondi
  4. Tentare di usare il link (deve fallire con "Token scaduto")

- [ ] **Test Redis Disabilitato**:
  1. Impostare `REDIS_ENABLED=false`
  2. Riavviare server
  3. Richiedere reset password
  4. Verificare comportamento (errore o fallback?)

- [ ] **Test Connessione Redis Persa**:
  1. Avviare applicazione con Redis
  2. Fermare Redis durante l'esecuzione
  3. Tentare reset password
  4. Verificare gestione errore

#### 5.2 Test con Strumenti
- [ ] Utilizzare **Postman** o **Thunder Client** per testare API:
  - `POST /api/auth/forgot-password` con `{ "email": "test@example.com" }`
  - `POST /api/auth/reset-password/:token` con `{ "password": "newpassword123" }`

#### 5.3 Monitoring Redis
- [ ] Installare strumento di monitoring Redis (opzionale):
  - **Redis Commander**: `npm install -g redis-commander && redis-commander`
  - **RedisInsight**: GUI ufficiale di Redis

---

### 6. **Documentazione**

#### 6.1 Aggiornare README.md
- [ ] Aggiungere sezione su Redis nella parte "Stack Tecnologico"
- [ ] Documentare nuove variabili d'ambiente
- [ ] Aggiornare istruzioni di installazione con Redis

#### 6.2 Aggiornare CONFIGURAZIONE-AMBIENTE.md
- [ ] Aggiungere tabella con variabili Redis
- [ ] Spiegare differenza tra `REDIS_ENABLED=true/false`
- [ ] Documentare il nuovo flusso di reset password

#### 6.3 Creare Documento Architettura (Opzionale)
- [ ] Creare `docs/ARCHITETTURA-RESET-PASSWORD.md` con:
  - Diagramma di flusso del reset password
  - Spiegazione JWT vs token semplici
  - Vantaggi di Redis
  - Gestione scadenze e sicurezza

---

### 7. **Sicurezza e Best Practices**

#### 7.1 Configurazione Sicurezza Redis
- [ ] **Produzione**: Impostare password Redis forte in `REDIS_PASSWORD`
- [ ] **Produzione**: Configurare Redis per accettare solo connessioni locali o da IP fidati
- [ ] **Produzione**: Disabilitare comandi pericolosi in Redis (`FLUSHDB`, `FLUSHALL`, `CONFIG`)
- [ ] Configurare TLS per connessione Redis (se su rete non sicura)

#### 7.2 Sicurezza JWT
- [ ] Usare un `RESET_PASSWORD_JWT_SECRET` diverso e più forte del `JWT_SECRET` normale
- [ ] Impostare scadenza breve (15-30 minuti max)
- [ ] Includere `type: 'password_reset'` nel payload per prevenire riutilizzo token

#### 7.3 Rate Limiting
- [ ] Implementare rate limiting su `/forgot-password` (già presente `express-rate-limit`)
- [ ] Limitare richieste per IP e per email
- [ ] Suggerimento: max 3 richieste ogni 15 minuti per email

---

### 8. **Deploy e Produzione**

#### 8.1 Configurazione Docker
- [ ] Aggiungere servizio Redis in `docker-compose.yml`:
  ```yaml
  redis:
    image: redis:7-alpine
    container_name: gestionale-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD}
    command: redis-server --requirepass ${REDIS_PASSWORD}
    restart: always
    networks:
      - gestionale-network
  
  volumes:
    redis-data:
  
  networks:
    gestionale-network:
      driver: bridge
  ```

- [ ] Aggiornare servizio backend per dipendere da Redis:
  ```yaml
  backend:
    depends_on:
      - redis
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
  ```

#### 8.2 Variabili Produzione
- [ ] Configurare `environment-production.txt` con:
  - `REDIS_HOST=redis` (nome servizio Docker) o IP server Redis
  - `REDIS_PASSWORD=<password-forte-generata>`
  - `RESET_PASSWORD_JWT_SECRET=<secret-unico-e-forte>`

#### 8.3 Backup e Persistenza (Opzionale)
- [ ] Configurare persistenza RDB o AOF in Redis
- [ ] Impostare policy di backup automatico
- [ ] Testare restore da backup

---

### 9. **Monitoring e Logs**

#### 9.1 Logging
- [ ] Aggiungere log strutturati per:
  - Connessione/disconnessione Redis
  - Generazione token reset
  - Verifica token reset
  - Eliminazione token dopo uso
  - Errori Redis

#### 9.2 Metriche (Opzionale)
- [ ] Tracciare:
  - Numero di richieste reset password
  - Tasso di utilizzo token (quanti cliccano il link)
  - Errori Redis
  - Latenza operazioni Redis

---

### 10. **Cleanup e Refactoring**

#### 10.1 Rimuovere Codice Obsoleto
- [ ] Rimuovere logica di hash SHA256 del token in `resetPassword`
- [ ] Rimuovere query MongoDB per `resetPasswordToken` e `resetPasswordExpire`
- [ ] Pulire import di `crypto` se non usato altrove

#### 10.2 Test Finali
- [ ] Testare nuovamente tutto il flusso end-to-end
- [ ] Verificare che non ci siano regressioni in altre funzionalità
- [ ] Controllare linter errors: `npm run lint` (se configurato)

#### 10.3 Code Review
- [ ] Revisione codice con team (se applicabile)
- [ ] Verifica best practices Redis
- [ ] Verifica gestione errori

---

## 📚 Risorse Utili

### Documentazione
- [Redis Node Client](https://github.com/redis/node-redis)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Redis Security](https://redis.io/topics/security)

### Comandi Redis Utili
```bash
# Monitorare operazioni in tempo reale
redis-cli MONITOR

# Visualizzare tutte le chiavi di reset
redis-cli KEYS "reset_token:*"

# Controllare TTL di una chiave
redis-cli TTL "reset_token:email@example.com"

# Eliminare tutte le chiavi di reset (attenzione!)
redis-cli --scan --pattern "reset_token:*" | xargs redis-cli DEL

# Statistiche Redis
redis-cli INFO stats
```

---

## ✅ Checklist Finale Prima del Deploy

- [ ] Tutte le dipendenze installate e documentate
- [ ] Redis configurato e testato (locale + Docker)
- [ ] Variabili d'ambiente configurate (dev + prod)
- [ ] Logica `forgotPassword` aggiornata con JWT + Redis
- [ ] Logica `resetPassword` aggiornata con JWT + Redis
- [ ] Test manuali completati con successo
- [ ] Gestione errori implementata e testata
- [ ] Sicurezza Redis configurata (password, TLS se necessario)
- [ ] Documentazione aggiornata (README, environment config)
- [ ] Docker Compose aggiornato con servizio Redis
- [ ] Deploy in staging testato
- [ ] Backup e recovery testati (se persistenza abilitata)

---

## 🐛 Troubleshooting Comune

### Redis non si connette
```
[REDIS] Errore: connect ECONNREFUSED 127.0.0.1:6379
```
**Soluzione**: Verificare che Redis sia avviato: `sudo systemctl status redis-server`

### Token sempre "non valido"
**Causa possibile**: Secret JWT diverso tra generazione e verifica  
**Soluzione**: Verificare che `RESET_PASSWORD_JWT_SECRET` sia lo stesso

### Token scade subito
**Causa possibile**: `RESET_PASSWORD_TOKEN_EXPIRE` troppo basso o formato errato  
**Soluzione**: Verificare valore in secondi (es. `1800` per 30 minuti)

### Redis perde dati dopo restart
**Causa**: Persistenza non configurata  
**Soluzione**: Abilitare RDB o AOF in Redis config

---

## 📝 Note Aggiuntive

### Considerazioni Performance
- Redis operazioni `GET`/`SET` sono O(1) - estremamente veloci
- Token in memoria vs query MongoDB = miglioramento significativo
- TTL automatico di Redis elimina necessità di cleanup manuale

### Scalabilità Futura
Se in futuro serve scalare orizzontalmente:
- Configurare Redis Cluster o Redis Sentinel
- Usare Redis Cloud provider (AWS ElastiCache, Redis Labs, ecc.)
- Implementare sharding per email domain

### Alternative Considerate
- **Memcached**: Più semplice ma meno funzionalità (no persistenza, no pub/sub)
- **Database MongoDB**: Attuale soluzione, più lenta per token temporanei
- **In-memory object**: Non scala, perde dati a restart

**Scelta Redis**: Bilanciamento ottimale tra performance, features e complessità

---

**Data ultimo aggiornamento**: 5 Ottobre 2025  
**Versione documento**: 1.0  
**Mantenitore**: Othoca Labs Dev Team

