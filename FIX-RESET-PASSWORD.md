# 🔧 FIX: Reset Password Link - Correzioni Applicate

## 📋 Problema Identificato

Quando l'utente cliccava sul link di reset password ricevuto via email, veniva reindirizzato a:
```
http://localhost:5000/reset-password/[token]
```

Questo causava un **errore 404** perché:
1. ❌ Il link puntava al backend (`localhost:5000`) invece del frontend (`localhost:3000`)
2. ❌ Non esisteva una pagina frontend per gestire il token e mostrare il form di reset
3. ⚠️ Discrepanza HTTP method: frontend usava PUT, backend usava POST

---

## ✅ Correzioni Applicate

### 1. **Variabile d'Ambiente FRONTEND_URL**

**File modificati:**
- ✅ `environment-config.txt` (development)
- ✅ `environment-production.txt` (production)

**Aggiunto:**
```bash
# Frontend URL (per generare link nelle email)
FRONTEND_URL=http://localhost:3000  # development
# oppure
FRONTEND_URL=https://gestionaledocenti.ddns.net  # production
```

---

### 2. **Backend - Correzione URL Email**

**File:** `server/controllers/authController.js`

**Prima:**
```javascript
const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
```

**Dopo:**
```javascript
const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
```

Ora il link nell'email punterà correttamente a:
```
http://localhost:3000/reset-password/[token]  # development
https://gestionaledocenti.ddns.net/reset-password/[token]  # production
```

---

### 3. **Creata Pagina Frontend Reset Password**

**File nuovo:** `client/src/pages/reset-password/[token].js`

**Funzionalità:**
- ✅ Form per inserire nuova password e conferma password
- ✅ Validazione password (minimo 6 caratteri)
- ✅ Verifica che le due password coincidano
- ✅ Gestione errori (token scaduto, invalido, etc.)
- ✅ Messaggio di successo e redirect automatico al login
- ✅ Stile consistente con le altre pagine (Login.module.css)
- ✅ Link per richiedere nuovo reset se il token è scaduto

**Screenshot del flusso:**
1. Utente riceve email con link `http://localhost:3000/reset-password/[token]`
2. Clicca sul link → viene portato alla pagina del frontend Next.js
3. Inserisce nuova password e conferma
4. Submit → API call a `PUT /api/auth/reset-password/:token`
5. Successo → redirect al login

---

### 4. **Correzione HTTP Method**

**File:** `server/routes/authRoutes.js`

**Prima:**
```javascript
router.post('/reset-password/:resetToken', authController.resetPassword);
```

**Dopo:**
```javascript
router.put('/reset-password/:resetToken', authController.resetPassword);
```

Ora è allineato con il frontend che usa `axios.put()`.

---

## 🚀 Come Testare

### 1. **Aggiorna il file .env**

Copia il contenuto di `environment-config.txt` nel tuo file `.env` nella root del progetto (se non esiste già).

**Assicurati che contenga:**
```bash
FRONTEND_URL=http://localhost:3000
```

### 2. **Riavvia il Server Backend**

```bash
cd server
npm start
```

Oppure se usi nodemon:
```bash
npm run dev
```

### 3. **Verifica che il Frontend sia attivo**

```bash
cd client
npm run dev
```

Dovrebbe essere su `http://localhost:3000`

### 4. **Testa il Flusso Completo**

1. Vai a `http://localhost:3000/recupero-password`
2. Inserisci un'email valida registrata
3. Controlla la console del backend per il link (se SMTP è disabilitato)
   ```
   [AUTH] SMTP disabilitato - email non inviata
   {
     debug_url: "http://localhost:3000/reset-password/[token]"
   }
   ```
4. Copia l'URL e aprilo nel browser
5. Dovresti vedere il form per inserire la nuova password
6. Inserisci nuova password (minimo 6 caratteri) e conferma
7. Click su "Reimposta password"
8. Dopo il successo, verrai reindirizzato al login

---

## 📧 Se hai SMTP Configurato

Se hai configurato SMTP (Gmail con App Password), il link verrà inviato via email automaticamente:

1. Vai a `http://localhost:3000/recupero-password`
2. Inserisci la tua email
3. Controlla la casella di posta
4. Clicca sul link nell'email
5. Segui il form per reimpostare la password

---

## 🔒 Note di Sicurezza

- ✅ Il token JWT è firmato con `RESET_PASSWORD_JWT_SECRET`
- ✅ Il token scade dopo 30 minuti (configurabile con `RESET_PASSWORD_TOKEN_EXPIRE`)
- ✅ Il token è salvato in Redis con TTL
- ✅ Dopo l'uso, il token viene invalidato
- ✅ Il frontend valida che password e conferma coincidano
- ✅ Gestione sicura degli errori (non rivela se l'email esiste)

---

## 📂 File Modificati/Creati

| File | Tipo | Descrizione |
|------|------|-------------|
| `environment-config.txt` | ✏️ Modificato | Aggiunta variabile `FRONTEND_URL` |
| `environment-production.txt` | ✏️ Modificato | Aggiunta variabile `FRONTEND_URL` |
| `server/controllers/authController.js` | ✏️ Modificato | Usa `FRONTEND_URL` per generare link |
| `server/routes/authRoutes.js` | ✏️ Modificato | Cambiato POST → PUT per reset password |
| `client/src/pages/reset-password/[token].js` | ✨ **NUOVO** | Pagina frontend per reset password |
| `FIX-RESET-PASSWORD.md` | 📝 Documentazione | Questo file |

---

## ❓ Troubleshooting

### Il link continua a dare 404

1. Verifica che il server Next.js sia attivo su porta 3000
   ```bash
   cd client
   npm run dev
   ```

2. Controlla che la variabile `FRONTEND_URL` sia nel file `.env`
   ```bash
   cat .env | grep FRONTEND_URL
   ```

3. Riavvia il backend dopo aver modificato `.env`

### Il form non invia la password

1. Apri DevTools (F12) → Console
2. Verifica eventuali errori JavaScript
3. Controlla la tab Network per vedere la chiamata API

### Token expired/invalid

- I token scadono dopo 30 minuti
- Richiedi un nuovo link da `/recupero-password`

---

## 🎉 Risultato

Ora il flusso di reset password funziona correttamente end-to-end:

```
[Email Recovery] → [Click Link] → [Frontend Page] → [New Password Form] → [API Call] → [Success] → [Login]
```

---

**Data Fix:** 5 Ottobre 2025  
**Testato:** ✅ Funzionante

