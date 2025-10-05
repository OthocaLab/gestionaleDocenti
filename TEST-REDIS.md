# 🧪 Test Redis - Guida Verifica Implementazione

> **Scopo**: Verificare che Redis sia configurato correttamente e funzioni con il backend

---

## 📋 Prerequisiti

Prima di testare, assicurati di avere:

- ✅ Redis installato e in esecuzione (locale o Docker)
- ✅ Variabili d'ambiente configurate nel file `.env`
- ✅ Backend server avviato

---

## 🚀 Metodo 1: Test con Docker

### 1. Avvia tutti i servizi con Docker Compose

```bash
# Dalla root del progetto
docker-compose up -d
```

### 2. Verifica che Redis sia in esecuzione

```bash
docker ps | grep redis
```

Output atteso:
```
gestionale-redis   redis:7-alpine   ...   Up   6379/tcp
```

### 3. Testa la connessione a Redis

```bash
docker exec -it gestionale-redis redis-cli ping
```

Output atteso: `PONG`

### 4. Verifica i log del backend

```bash
docker logs gestionale-backend | grep REDIS
```

Dovresti vedere:
```
[REDIS] Configurazione: { enabled: true, host: 'localhost', ... }
[REDIS] Connessione in corso...
[REDIS] ✅ Client connesso e pronto
```

---

## 🖥️  Metodo 2: Test con Installazione Locale

### 1. Avvia Redis localmente

```bash
# Verifica se Redis è già in esecuzione
redis-cli ping

# Se non è in esecuzione, avvialo
sudo systemctl start redis-server

# macOS con Homebrew
brew services start redis
```

### 2. Crea file .env con configurazione Redis

```bash
# Dalla root del progetto
cp environment-config.txt .env

# Modifica le variabili Redis se necessario
nano .env
```

Assicurati che contenga:
```env
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

RESET_PASSWORD_JWT_SECRET=othoca_labs_reset_password_secret_key_change_in_production
RESET_PASSWORD_TOKEN_EXPIRE=1800
```

### 3. Avvia il backend

```bash
cd server
npm run dev
```

### 4. Verifica i log di avvio

Dovresti vedere nel terminale:
```
🔧 Debug variabili d'ambiente:
- REDIS_ENABLED: ✅ Abilitato

[REDIS] Configurazione: {
  enabled: true,
  host: 'localhost',
  port: 6379,
  password: '(nessuna)',
  database: 0
}
[REDIS] Connessione in corso...
[REDIS] ✅ Client connesso e pronto
```

---

## 🧪 Test Endpoint Health Check

### Test 1: Health Check Generale

```bash
curl http://localhost:5000/api/health
```

**Output atteso**:
```json
{
  "status": "ok",
  "timestamp": "2025-10-05T...",
  "uptime": 123.45,
  "environment": "development",
  "services": {
    "mongodb": {
      "status": "connected",
      "readyState": 1
    },
    "redis": {
      "enabled": true,
      "available": true,
      "status": "connected",
      "activeResetTokens": 0
    }
  }
}
```

**Interpretazione**:
- `status: "ok"` = Tutto funziona ✅
- `status: "warning"` = Redis abilitato ma non disponibile ⚠️
- `status: "error"` = MongoDB non connesso ❌

### Test 2: Redis Stats

```bash
curl http://localhost:5000/api/redis/stats
```

**Output atteso**:
```json
{
  "success": true,
  "stats": {
    "available": true,
    "isConnected": true,
    "resetTokensActive": 0,
    "rawStats": "..."
  }
}
```

---

## 🔍 Test Funzioni Redis Helper

### Test Manuale con Node.js

Crea un file temporaneo per testare le funzioni:

```bash
cd server
nano test-redis-helper.js
```

Incolla questo codice:

```javascript
require('dotenv').config({ path: '../.env' });
const redisHelper = require('./config/redisClient');

async function testRedis() {
  console.log('\n🧪 Test Redis Helper\n');

  // Aspetta che Redis si connetta
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 1: Verifica disponibilità
  console.log('1. Verifica disponibilità Redis');
  const isAvailable = redisHelper.isAvailable();
  console.log('   Disponibile:', isAvailable ? '✅' : '❌');

  if (!isAvailable) {
    console.log('   ❌ Redis non disponibile. Test interrotto.');
    process.exit(1);
  }

  // Test 2: Ping
  console.log('\n2. Test Ping');
  const pingSuccess = await redisHelper.ping();
  console.log('   Ping:', pingSuccess ? '✅ PONG' : '❌ Fallito');

  // Test 3: Salva token
  console.log('\n3. Salva token di reset');
  const testEmail = 'test@example.com';
  const testToken = 'token_jwt_mock_12345';
  const result = await redisHelper.setResetToken(testEmail, testToken, 300); // 5 minuti
  console.log('   Salvato:', result.success ? '✅' : '❌');

  // Test 4: Recupera token
  console.log('\n4. Recupera token');
  const retrievedToken = await redisHelper.getResetToken(testEmail);
  console.log('   Token recuperato:', retrievedToken === testToken ? '✅ Corretto' : '❌ Errato');
  console.log('   Valore:', retrievedToken);

  // Test 5: Verifica validità
  console.log('\n5. Verifica validità token');
  const isValid = await redisHelper.isResetTokenValid(testEmail, testToken);
  console.log('   Valido:', isValid ? '✅' : '❌');

  // Test 6: Controlla TTL
  console.log('\n6. Controlla TTL (Time To Live)');
  const ttl = await redisHelper.getResetTokenTTL(testEmail);
  console.log('   TTL:', ttl > 0 ? `✅ ${ttl}s (${Math.floor(ttl / 60)} minuti)` : '❌');

  // Test 7: Conta token attivi
  console.log('\n7. Conta token attivi');
  const count = await redisHelper.countActiveResetTokens();
  console.log('   Token attivi:', count >= 1 ? `✅ ${count}` : '❌');

  // Test 8: Elimina token
  console.log('\n8. Elimina token');
  const deleteResult = await redisHelper.deleteResetToken(testEmail);
  console.log('   Eliminato:', deleteResult.success ? '✅' : '❌');

  // Test 9: Verifica eliminazione
  console.log('\n9. Verifica che il token non esista più');
  const shouldBeNull = await redisHelper.getResetToken(testEmail);
  console.log('   Token non trovato:', shouldBeNull === null ? '✅' : '❌');

  // Cleanup e chiusura
  console.log('\n10. Disconnessione');
  await redisHelper.disconnect();
  console.log('    ✅ Disconnessione completata');

  console.log('\n🎉 Tutti i test completati!\n');
  process.exit(0);
}

testRedis().catch((error) => {
  console.error('\n❌ Errore durante i test:', error);
  process.exit(1);
});
```

### Esegui il test

```bash
node test-redis-helper.js
```

**Output atteso**:
```
🧪 Test Redis Helper

1. Verifica disponibilità Redis
   Disponibile: ✅

2. Test Ping
[REDIS] 🏓 PING -> PONG
   Ping: ✅ PONG

3. Salva token di reset
[REDIS] ✅ Token salvato per test@example.com, scade tra 300s (5 minuti)
   Salvato: ✅

4. Recupera token
[REDIS] ✅ Token recuperato per test@example.com
   Token recuperato: ✅ Corretto
   Valore: token_jwt_mock_12345

5. Verifica validità token
[REDIS] ✅ Token valido per test@example.com
   Valido: ✅

6. Controlla TTL (Time To Live)
[REDIS] ℹ️  Token per test@example.com scade tra 299s (4 minuti)
   TTL: ✅ 299s (4 minuti)

7. Conta token attivi
[REDIS] ℹ️  Token di reset attivi: 1
   Token attivi: ✅ 1

8. Elimina token
[REDIS] ✅ Token eliminato per test@example.com
   Eliminato: ✅

9. Verifica che il token non esista più
[REDIS] ℹ️  Nessun token trovato per test@example.com
   Token non trovato: ✅

10. Disconnessione
[REDIS] 👋 Disconnessione completata
    ✅ Disconnessione completata

🎉 Tutti i test completati!
```

### Pulisci il file di test

```bash
rm test-redis-helper.js
```

---

## 🔧 Test Diretto con Redis CLI

### 1. Connettiti a Redis

```bash
# Installazione locale
redis-cli

# Docker
docker exec -it gestionale-redis redis-cli
```

### 2. Comandi di test

```bash
# Test connessione
127.0.0.1:6379> PING
PONG

# Visualizza tutte le chiavi
127.0.0.1:6379> KEYS *
(empty array)

# Imposta un valore di test
127.0.0.1:6379> SET test_key "test_value"
OK

# Recupera il valore
127.0.0.1:6379> GET test_key
"test_value"

# Imposta un valore con scadenza (300 secondi)
127.0.0.1:6379> SETEX test_expire 300 "expires in 5 minutes"
OK

# Controlla il TTL
127.0.0.1:6379> TTL test_expire
(integer) 298

# Visualizza tutte le chiavi
127.0.0.1:6379> KEYS *
1) "test_key"
2) "test_expire"

# Elimina le chiavi di test
127.0.0.1:6379> DEL test_key test_expire
(integer) 2

# Esci
127.0.0.1:6379> EXIT
```

---

## 🐛 Troubleshooting

### ❌ Redis non disponibile

**Sintomo**: Health check mostra `"redis": { "status": "disabled" }`

**Soluzione**:
```bash
# Verifica variabile d'ambiente
grep REDIS_ENABLED .env

# Dovrebbe essere:
REDIS_ENABLED=true

# Se è false, cambialo e riavvia il server
```

### ❌ Connection refused

**Sintomo**: `[REDIS] ❌ Errore: connect ECONNREFUSED 127.0.0.1:6379`

**Soluzione**:
```bash
# Verifica che Redis sia in esecuzione
redis-cli ping

# Se non risponde, avvialo
sudo systemctl start redis-server  # Linux
brew services start redis           # macOS
docker-compose up -d redis         # Docker
```

### ❌ NOAUTH Authentication required

**Sintomo**: `[REDIS] ❌ Errore: NOAUTH Authentication required`

**Soluzione**: Redis richiede una password ma non l'hai fornita. Aggiungi nel `.env`:
```env
REDIS_PASSWORD=tua_password_qui
```

### ⚠️ Health check status: warning

**Sintomo**: Health check mostra `"status": "warning"`

**Causa**: Redis è abilitato nel config ma non è disponibile

**Soluzione**: Segui i passi di troubleshooting sopra per avviare Redis

---

## ✅ Checklist Test Completati

- [ ] Redis installato e in esecuzione (locale o Docker)
- [ ] Variabili d'ambiente configurate nel `.env`
- [ ] Backend si avvia senza errori Redis
- [ ] Logs mostrano `[REDIS] ✅ Client connesso e pronto`
- [ ] `/api/health` mostra `"redis": { "status": "connected" }`
- [ ] `/api/redis/stats` restituisce statistiche
- [ ] Test helper Node.js completato con successo
- [ ] Redis CLI risponde a PING con PONG

---

## 🎯 Prossimi Passi

Una volta completati tutti i test con successo, sei pronto per:

1. ✅ **Punto 3**: Modificare `authController.js` per usare Redis nel reset password
2. ✅ **Punto 4**: Aggiornare il modello User (opzionale)
3. ✅ **Punto 5**: Test end-to-end del flusso di reset password

---

**Ultima modifica**: 5 Ottobre 2025  
**Versione**: 1.0

