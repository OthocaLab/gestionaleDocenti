# 🧪 Test Flusso Reset Password con JWT + Redis

> **Scopo**: Verificare che il nuovo sistema di reset password con JWT e Redis funzioni correttamente end-to-end

---

## 📋 Prerequisiti

Prima di testare:

- ✅ Redis installato e in esecuzione
- ✅ Backend server avviato
- ✅ MongoDB connesso
- ✅ Almeno un utente nel database con email valida
- ✅ Variabili d'ambiente configurate (incluse `RESET_PASSWORD_JWT_SECRET` e `RESET_PASSWORD_TOKEN_EXPIRE`)

---

## 🎯 Scenari di Test

### Scenario 1: Flusso Completo Successo ✅

**Descrizione**: Un utente richiede il reset, riceve l'email, clicca il link e reimposta la password.

#### Step 1: Richiesta Reset Password

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**Output atteso**:
```json
{
  "success": true,
  "message": "Se l'email esiste nel sistema, riceverai le istruzioni per il reset della password"
}
```

**Se SMTP disabilitato (development)**:
```json
{
  "success": true,
  "message": "Reset password elaborato (SMTP disabilitato)",
  "smtp_disabled": true,
  "debug_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "debug_url": "http://localhost:5000/reset-password/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Verifica in Redis**:
```bash
redis-cli KEYS "reset_token:*"
redis-cli GET "reset_token:test@example.com"
redis-cli TTL "reset_token:test@example.com"
```

**Log backend attesi**:
```
[AUTH] Token JWT generato per test@example.com
[REDIS] ✅ Token salvato per test@example.com, scade tra 1800s (30 minuti)
[AUTH] ✅ Email di reset inviata con successo a test@example.com
```

#### Step 2: Reset Password

Usa il token ricevuto (dall'email o da debug_token se SMTP disabilitato):

```bash
# Sostituisci TOKEN_QUI con il token ricevuto
curl -X POST http://localhost:5000/api/auth/reset-password/TOKEN_QUI \
  -H "Content-Type: application/json" \
  -d '{
    "password": "NewSecurePassword123"
  }'
```

**Output atteso**:
```json
{
  "success": true,
  "message": "Password reimpostata con successo",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "nome": "Test",
    "cognome": "User",
    "email": "test@example.com",
    "ruolo": "docente"
  }
}
```

**Verifica in Redis (token dovrebbe essere eliminato)**:
```bash
redis-cli GET "reset_token:test@example.com"
# Output atteso: (nil)
```

**Log backend attesi**:
```
[AUTH] Aggiornamento password per utente: test@example.com
[AUTH] ✅ Password aggiornata con successo per test@example.com
[REDIS] ✅ Token eliminato per test@example.com
[AUTH] Token rimosso da Redis per test@example.com
```

#### Step 3: Verifica Login con Nuova Password

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "NewSecurePassword123"
  }'
```

**Output atteso**:
```json
{
  "success": true,
  "token": "...",
  "user": { ... }
}
```

---

### Scenario 2: Email Non Esistente 🔒

**Descrizione**: Richiesta di reset per email non registrata (per sicurezza, non rivela se l'email esiste).

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@example.com"
  }'
```

**Output atteso**:
```json
{
  "success": true,
  "message": "Se l'email esiste nel sistema, riceverai le istruzioni per il reset della password"
}
```

**Nota**: Risposta identica al caso successo per motivi di sicurezza.

**Log backend attesi**:
```
[AUTH] Tentativo di reset per email non esistente: nonexistent@example.com
```

**Verifica Redis (nessun token salvato)**:
```bash
redis-cli GET "reset_token:nonexistent@example.com"
# Output: (nil)
```

---

### Scenario 3: Token Scaduto ⏰

**Descrizione**: Tentativo di usare un token dopo la scadenza.

#### Step 1: Imposta TTL breve temporaneamente

Modifica `.env`:
```env
RESET_PASSWORD_TOKEN_EXPIRE=10  # 10 secondi
```

Riavvia il server.

#### Step 2: Richiedi reset

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

Salva il `debug_token` restituito.

#### Step 3: Aspetta 11 secondi

```bash
sleep 11
```

#### Step 4: Tenta reset con token scaduto

```bash
curl -X POST http://localhost:5000/api/auth/reset-password/TOKEN_SCADUTO \
  -H "Content-Type: application/json" \
  -d '{
    "password": "NewPassword123"
  }'
```

**Output atteso**:
```json
{
  "success": false,
  "message": "Il link di reset è scaduto. Richiedi un nuovo reset della password."
}
```

**Verifica Redis (token già scaduto per TTL)**:
```bash
redis-cli GET "reset_token:test@example.com"
# Output: (nil)
```

**Ripristina TTL normale**:
```env
RESET_PASSWORD_TOKEN_EXPIRE=1800  # 30 minuti
```

---

### Scenario 4: Token Riutilizzato 🔄

**Descrizione**: Tentativo di usare lo stesso token due volte.

#### Step 1: Richiedi reset

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

Salva il token.

#### Step 2: Usa il token una volta (successo)

```bash
curl -X POST http://localhost:5000/api/auth/reset-password/TOKEN \
  -H "Content-Type: application/json" \
  -d '{
    "password": "FirstNewPassword123"
  }'
```

Output: `"success": true`

#### Step 3: Tenta di riutilizzare lo stesso token

```bash
curl -X POST http://localhost:5000/api/auth/reset-password/TOKEN \
  -H "Content-Type: application/json" \
  -d '{
    "password": "SecondNewPassword123"
  }'
```

**Output atteso**:
```json
{
  "success": false,
  "message": "Token non valido o già utilizzato"
}
```

**Log backend attesi**:
```
[AUTH] Token non trovato in Redis o già utilizzato
```

---

### Scenario 5: Token JWT Malformato 🚫

**Descrizione**: Tentativo con token non valido.

```bash
curl -X POST http://localhost:5000/api/auth/reset-password/invalid_token_123 \
  -H "Content-Type: application/json" \
  -d '{
    "password": "NewPassword123"
  }'
```

**Output atteso**:
```json
{
  "success": false,
  "message": "Token non valido"
}
```

---

### Scenario 6: Password Troppo Corta 📏

**Descrizione**: Tentativo di impostare password < 8 caratteri.

```bash
curl -X POST http://localhost:5000/api/auth/reset-password/VALID_TOKEN \
  -H "Content-Type: application/json" \
  -d '{
    "password": "short"
  }'
```

**Output atteso**:
```json
{
  "success": false,
  "message": "La password deve essere di almeno 8 caratteri"
}
```

**Nota**: Il token NON viene invalidato, l'utente può riprovare.

---

### Scenario 7: Redis Disabilitato ⚠️

**Descrizione**: Comportamento quando Redis non è disponibile.

#### Step 1: Disabilita Redis

Modifica `.env`:
```env
REDIS_ENABLED=false
```

Riavvia il server.

#### Step 2: Tenta reset password

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**Output atteso**:
```json
{
  "success": false,
  "message": "Errore nel sistema di reset password. Riprova più tardi."
}
```

**Log backend attesi**:
```
[AUTH] ⚠️  Redis disabilitato - il token non sarà salvato, ma continuiamo
[AUTH] Errore Redis: Errore nel salvataggio del token in Redis
```

**Opzione alternativa**: Puoi modificare il controller per permettere il fallback anche senza Redis (meno sicuro).

---

## 🔍 Verifica Manuale con Script Node.js

Crea un file di test completo:

```javascript
// test-reset-flow.js
require('dotenv').config({ path: '../.env' });
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'OldPassword123';
const NEW_PASSWORD = 'NewSecurePassword456';

async function testResetFlow() {
  console.log('\n🧪 Test Flusso Reset Password\n');

  try {
    // Step 1: Forgot Password
    console.log('1️⃣  Richiesta reset password...');
    const forgotResponse = await axios.post(`${BASE_URL}/auth/forgot-password`, {
      email: TEST_EMAIL
    });
    
    console.log('   Risposta:', forgotResponse.data.message);
    
    if (!forgotResponse.data.debug_token) {
      console.log('   ⚠️  SMTP abilitato - controlla la tua email per il token');
      return;
    }
    
    const resetToken = forgotResponse.data.debug_token;
    console.log('   ✅ Token ricevuto (SMTP disabilitato)');

    // Step 2: Aspetta un secondo
    console.log('\n2️⃣  Attendi...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Reset Password
    console.log('\n3️⃣  Reset password con nuovo token...');
    const resetResponse = await axios.post(
      `${BASE_URL}/auth/reset-password/${resetToken}`,
      { password: NEW_PASSWORD }
    );
    
    console.log('   Risposta:', resetResponse.data.message);
    console.log('   ✅ Token autenticazione ricevuto');

    // Step 4: Login con nuova password
    console.log('\n4️⃣  Login con nuova password...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: NEW_PASSWORD
    });
    
    console.log('   ✅ Login riuscito!');
    console.log('   Utente:', loginResponse.data.user.email);

    // Step 5: Tenta riutilizzo token
    console.log('\n5️⃣  Tentativo riutilizzo token...');
    try {
      await axios.post(
        `${BASE_URL}/auth/reset-password/${resetToken}`,
        { password: 'AnotherPassword789' }
      );
      console.log('   ❌ ERRORE: Token riutilizzato (non dovrebbe accadere!)');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('   ✅ Token correttamente rifiutato (già utilizzato)');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 Tutti i test completati con successo!\n');

  } catch (error) {
    console.error('\n❌ Errore durante i test:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Messaggio:', error.response.data.message);
    } else {
      console.error('   ', error.message);
    }
    process.exit(1);
  }
}

testResetFlow();
```

**Esegui il test**:
```bash
cd server
npm install axios  # Se non già installato
node test-reset-flow.js
```

---

## 📊 Checklist Test Completa

### Funzionalità Base
- [ ] Reset password con email esistente funziona
- [ ] Email viene inviata (o debug_token restituito se SMTP disabilitato)
- [ ] Token viene salvato in Redis con TTL corretto
- [ ] Reset password con token valido aggiorna la password
- [ ] Token viene eliminato da Redis dopo l'uso
- [ ] Login funziona con la nuova password
- [ ] Token JWT di autenticazione viene generato dopo reset

### Casi Edge
- [ ] Email non esistente non rivela se l'account esiste
- [ ] Token scaduto viene rifiutato con messaggio appropriato
- [ ] Token riutilizzato viene rifiutato
- [ ] Token JWT malformato viene rifiutato
- [ ] Password troppo corta viene rifiutata
- [ ] Password mancante viene rifiutata
- [ ] Token mancante viene rifiutato

### Sicurezza
- [ ] Token JWT contiene tipo 'password_reset'
- [ ] Token normale di autenticazione non può essere usato per reset
- [ ] Token viene eliminato dopo utilizzo (one-time use)
- [ ] TTL di Redis è rispettato
- [ ] Email non esistente non genera token in Redis

### Redis
- [ ] Token viene salvato in Redis correttamente
- [ ] TTL viene impostato correttamente
- [ ] Token viene recuperato da Redis
- [ ] Token viene eliminato dopo uso
- [ ] Redis disabilitato gestito appropriatamente

### Logging
- [ ] Log chiari per ogni operazione
- [ ] Errori loggati con dettagli in development
- [ ] Eventi Redis loggati correttamente
- [ ] Log di sicurezza per tentativi sospetti

---

## 🐛 Troubleshooting

### Token non trovato in Redis

**Sintomo**: Errore "Token non valido o già utilizzato" ma il token è appena stato generato.

**Possibili cause**:
1. Redis non connesso
2. Token scaduto troppo velocemente
3. Email nel JWT diversa da quella in Redis

**Debug**:
```bash
# Verifica connessione Redis
curl http://localhost:5000/api/health

# Verifica token in Redis
redis-cli KEYS "reset_token:*"

# Decodifica JWT (usa jwt.io)
echo "TOKEN_QUI" | base64 -d
```

### Password non si aggiorna

**Sintomo**: Reset sembra riuscire ma login con nuova password fallisce.

**Possibili cause**:
1. Hook `pre('save')` in User model non funziona
2. Password non viene hashata

**Debug**:
```bash
# Controlla i log del server per il pre-save hook
# Verifica in MongoDB se la password è hashata
```

### Email non arriva

**Sintomo**: Reset richiesto ma email non ricevuta.

**Verifica**:
```bash
# Controlla configurazione SMTP
grep SMTP_ .env

# Verifica log backend
# Cerca linee con [GMAIL] o [SMTP]

# In development, usa debug_token invece dell'email
```

---

## ✅ Prossimi Passi

Una volta completati tutti i test:

1. ✅ Testa in produzione con email reale
2. ✅ Configura monitoring per errori Redis
3. ✅ Imposta alert per tentativi sospetti
4. ✅ Documenta il processo per il team
5. ✅ Aggiorna frontend per gestire i nuovi messaggi di errore

---

**Ultima modifica**: 5 Ottobre 2025  
**Versione**: 1.0

