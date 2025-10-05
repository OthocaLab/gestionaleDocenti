# 🔄 Migrazione Database - Rimozione Campi Reset Password

> **Data**: 5 Ottobre 2025  
> **Versione**: 1.0  
> **Tipo**: Pulizia campi obsoleti

---

## 📋 Panoramica

Con l'implementazione del nuovo sistema di reset password basato su **JWT + Redis**, i campi `resetPasswordToken` e `resetPasswordExpire` nel modello `User` non sono più necessari.

Questa migrazione rimuoverà questi campi dai documenti esistenti nel database MongoDB.

---

## ⚠️ Importante

- ✅ **Questa migrazione è sicura**: rimuove solo campi non più utilizzati
- ✅ **Nessun dato utente viene perso**: email, password, ruoli rimangono intatti
- ✅ **Opzionale**: Se i campi esistono ma non causano problemi, puoi rimandare
- ⚠️ **Backup consigliato**: Fai un backup del database prima di procedere (best practice)

---

## 🎯 Cosa Fa la Migrazione

Lo script:

1. ✅ Si connette al database MongoDB
2. ✅ Conta gli utenti con campi obsoleti
3. ✅ Richiede conferma (a meno di usare `--force`)
4. ✅ Rimuove i campi `resetPasswordToken` e `resetPasswordExpire`
5. ✅ Verifica che i campi siano stati rimossi
6. ✅ Mostra statistiche di completamento

---

## 🚀 Come Eseguire la Migrazione

### Metodo 1: Con Conferma (Raccomandato)

```bash
cd server
node migrations/cleanup-reset-password-fields.js
```

Output:
```
🔄 Migration: Cleanup Reset Password Fields

📊 Connessione a: mongodb://127.0.0.1:27017/gestionale-docenti

✅ Connesso al database MongoDB

📋 Utenti con campi obsoleti trovati: 5

⚠️  Questa operazione rimuoverà i campi:
   - resetPasswordToken
   - resetPasswordExpire

   da 5 documenti utente.

💡 Per procedere senza conferma, usa: node ... --force

🔴 INTERROTTO: Aggiungi --force per eseguire la migrazione
```

### Metodo 2: Automatico (Senza Conferma)

```bash
cd server
node migrations/cleanup-reset-password-fields.js --force
```

Output:
```
🔄 Migration: Cleanup Reset Password Fields

📊 Connessione a: mongodb://127.0.0.1:27017/gestionale-docenti

✅ Connesso al database MongoDB

📋 Utenti con campi obsoleti trovati: 5

🚀 Inizio migrazione...

✅ Migrazione completata!
   - Documenti modificati: 5
   - Documenti matchati: 5

✅ Verifica: Tutti i campi obsoleti sono stati rimossi con successo

🔌 Disconnesso dal database

🎉 Migrazione completata con successo!
```

---

## 🔍 Verificare Stato Pre-Migrazione

Prima di eseguire la migrazione, puoi controllare se hai documenti con campi obsoleti:

### Opzione A: Con MongoDB Compass

1. Connettiti al database `gestionale-docenti`
2. Vai alla collection `users`
3. Cerca documenti con i campi:
   - `resetPasswordToken`
   - `resetPasswordExpire`

### Opzione B: Con Mongo Shell

```bash
mongosh "mongodb://127.0.0.1:27017/gestionale-docenti"
```

```javascript
// Conta utenti con campi obsoleti
db.users.countDocuments({
  $or: [
    { resetPasswordToken: { $exists: true } },
    { resetPasswordExpire: { $exists: true } }
  ]
})

// Visualizza utenti con campi obsoleti (primi 5)
db.users.find({
  $or: [
    { resetPasswordToken: { $exists: true } },
    { resetPasswordExpire: { $exists: true } }
  ]
}, { email: 1, resetPasswordToken: 1, resetPasswordExpire: 1 }).limit(5)
```

### Opzione C: Script Node.js

```javascript
// check-old-fields.js
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  
  const count = await User.countDocuments({
    $or: [
      { resetPasswordToken: { $exists: true } },
      { resetPasswordExpire: { $exists: true } }
    ]
  });
  
  console.log(`Utenti con campi obsoleti: ${count}`);
  await mongoose.connection.close();
}

check();
```

---

## 💾 Backup del Database (Raccomandato)

Prima di eseguire qualsiasi migrazione, è buona pratica fare un backup:

### Backup Completo

```bash
# Backup intero database
mongodump --uri="mongodb://127.0.0.1:27017/gestionale-docenti" --out=./backup-$(date +%Y%m%d-%H%M%S)
```

### Backup Solo Collection Users

```bash
# Backup solo collection users
mongodump --uri="mongodb://127.0.0.1:27017/gestionale-docenti" --collection=users --out=./backup-users-$(date +%Y%m%d-%H%M%S)
```

### Ripristino (se necessario)

```bash
# Ripristina da backup
mongorestore --uri="mongodb://127.0.0.1:27017/gestionale-docenti" ./backup-TIMESTAMP/
```

---

## 🧪 Testare Dopo la Migrazione

Dopo aver eseguito la migrazione:

### 1. Verifica Schema

```javascript
// Verifica in MongoDB
db.users.findOne({}, { 
  resetPasswordToken: 1, 
  resetPasswordExpire: 1 
})
// Output atteso: { _id: ... } (nessun campo reset*)
```

### 2. Testa Reset Password

```bash
# Richiedi reset password
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Verifica che funzioni correttamente (usa JWT + Redis ora)
```

### 3. Verifica Redis

```bash
# Controlla che i token siano in Redis, non in MongoDB
redis-cli KEYS "reset_token:*"
```

---

## 📊 Statistiche Post-Migrazione

Dopo la migrazione, puoi generare un report:

```javascript
// report-migration.js
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function generateReport() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  
  console.log('\n📊 Report Migrazione Reset Password\n');
  
  // Totale utenti
  const totalUsers = await User.countDocuments();
  console.log(`👥 Totale utenti: ${totalUsers}`);
  
  // Utenti con campi vecchi
  const oldFields = await User.countDocuments({
    $or: [
      { resetPasswordToken: { $exists: true } },
      { resetPasswordExpire: { $exists: true } }
    ]
  });
  console.log(`🗑️  Utenti con campi obsoleti: ${oldFields}`);
  
  // Utenti puliti
  const cleanUsers = totalUsers - oldFields;
  console.log(`✅ Utenti migrati: ${cleanUsers} (${((cleanUsers/totalUsers)*100).toFixed(1)}%)`);
  
  console.log('\n');
  
  await mongoose.connection.close();
}

generateReport();
```

---

## 🐛 Troubleshooting

### Errore: MONGODB_URI non trovato

**Causa**: File `.env` non presente o non configurato

**Soluzione**:
```bash
# Crea file .env dalla configurazione
cp environment-config.txt .env

# Verifica contenuto
grep MONGODB_URI .env
```

### Errore: Connessione fallita

**Causa**: MongoDB non in esecuzione

**Soluzione**:
```bash
# Verifica stato MongoDB
sudo systemctl status mongod

# Avvia MongoDB se necessario
sudo systemctl start mongod
```

### Nessun documento modificato

**Scenario**: `Documenti modificati: 0` ma `Documenti matchati: > 0`

**Possibile causa**: I campi erano già undefined o la migrazione è già stata eseguita

**Verifica**:
```javascript
db.users.findOne({}, { resetPasswordToken: 1, resetPasswordExpire: 1 })
```

---

## 🔄 Rollback (se necessario)

Se per qualche motivo vuoi ripristinare i campi (sconsigliato):

```javascript
// rollback-migration.js (SOLO PER EMERGENZE)
// Questo script ripristina i campi nel modello User
// MA i token non saranno validi - dovrai rigenerare tutto

// NON ESEGUIRE a meno che tu non sappia cosa stai facendo!
```

**Nota**: Non c'è un vero rollback necessario perché i campi erano comunque inutilizzati.

---

## ✅ Checklist Migrazione

Prima di considerare la migrazione completata:

- [ ] Backup del database creato
- [ ] Verificato numero di documenti da migrare
- [ ] Eseguito script di migrazione
- [ ] Verificato che `Documenti modificati` corrisponda al numero atteso
- [ ] Testato reset password (deve usare Redis)
- [ ] Verificato che nessun campo obsoleto esista in MongoDB
- [ ] Testato login e altre funzionalità utente
- [ ] Aggiornato documentazione (se necessario)

---

## 📝 Note Aggiuntive

### Quando Eseguire la Migrazione

- ✅ **Subito**: Se stai implementando JWT + Redis in un nuovo ambiente
- ✅ **Durante maintenance window**: Se sei in produzione
- ⏳ **Più tardi**: Se i campi non causano problemi (sono ignorati comunque)

### Migrazione in Produzione

Se esegui in produzione:

1. Fai backup completo del database
2. Testa lo script in staging prima
3. Esegui durante una finestra di manutenzione
4. Monitora i log durante l'esecuzione
5. Testa il flusso di reset password dopo la migrazione

### Impatto Minimo

- ⚡ **Performance**: Migrazione rapida (< 1 secondo per migliaia di utenti)
- 🔒 **Downtime**: Non necessario, può essere eseguita a caldo
- 👥 **Utenti**: Nessun impatto, funzionalità reset continua a funzionare

---

## 🎯 Prossimi Passi

Dopo la migrazione:

1. ✅ Testa il flusso di reset password completo
2. ✅ Monitora i log per eventuali errori
3. ✅ Verifica che Redis contenga i token
4. ✅ Aggiorna documentazione per il team
5. ✅ Rimuovi gli script di migrazione (opzionale, dopo verifica)

---

**Ultima modifica**: 5 Ottobre 2025  
**Versione**: 1.0  
**Autore**: Othoca Labs Dev Team

