# 🔧 Configurazione Ambiente Unificata - Othoca Labs

## 📋 Panoramica

Questo progetto utilizza ora un **file di ambiente unificato** (`.env`) che contiene tutte le variabili necessarie sia per il frontend (Next.js) che per il backend (Node.js/Express).

## 🚀 Configurazione Rapida

### Metodo 1: Script Automatico (Consigliato)
```bash
# Esegui lo script di configurazione
./setup-env.sh

# Modifica il file .env con i tuoi dati
nano .env
```

### Metodo 2: Configurazione Manuale
```bash
# Copia il template di sviluppo
cp environment-config.txt .env

# Oppure per produzione
cp environment-production.txt .env
```

## 📝 Variabili d'Ambiente

### 🔧 Configurazione Generale
| Variabile | Descrizione | Valore Sviluppo | Valore Produzione |
|-----------|-------------|-----------------|-------------------|
| `NODE_ENV` | Ambiente di esecuzione | `development` | `production` |

### 🖥️ Configurazione Backend
| Variabile | Descrizione | Esempio |
|-----------|-------------|---------|
| `PORT` | Porta del server | `5000` |
| `HOST` | Host del server | `localhost` (dev) / `0.0.0.0` (prod) |
| `MONGODB_URI` | URI del database MongoDB | `mongodb://127.0.0.1:27017/gestionale-docenti` |
| `JWT_SECRET` | Chiave segreta per JWT | `your_secure_secret_key` |
| `JWT_EXPIRE` | Scadenza token JWT | `30d` |
| `ALLOWED_ORIGINS` | Domini CORS consentiti | `http://localhost:3000` |

### 📧 Configurazione Email (SMTP)
| Variabile | Descrizione | Esempio |
|-----------|-------------|---------|
| `SMTP_ENABLED` | **Abilita/disabilita invio email** | `true` / `false` |
| `SMTP_HOST` | Host SMTP | `smtp.gmail.com` |
| `SMTP_PORT` | Porta SMTP | `465` |
| `SMTP_SECURE` | Connessione sicura | `true` |
| `SMTP_USER` | Username email | `your_email@gmail.com` |
| `SMTP_PASSWORD` | Password app Gmail | `your_app_password` |
| `EMAIL_FROM` | Email mittente | `Othoca Labs <noreply@othocalabs.it>` |
| `USE_GMAIL_APP_PASSWORD` | Usa password app Gmail | `true` |

> **⚠️ Importante**: Impostare `SMTP_ENABLED=false` per disabilitare completamente l'invio di email. Utile in ambiente di sviluppo o quando non si ha configurazione SMTP.

### 🌐 Configurazione Frontend (Next.js)
| Variabile | Descrizione | Esempio |
|-----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | URL API backend | `http://localhost:5000/api` |
| `NEXT_PUBLIC_BACKEND_URL` | URL backend | `http://localhost:5000/api` |
| `NEXT_PUBLIC_API_DESTINATION` | Destinazione API | `http://localhost:5000/api` |
| `NEXT_PUBLIC_ALLOWED_DEV_ORIGINS` | Domini sviluppo | `http://localhost:3000` |

## 🔐 Configurazione Gmail SMTP

### Passo 1: Attiva la 2FA
1. Vai su [Google Account Security](https://myaccount.google.com/security)
2. Attiva la verifica in due passaggi

### Passo 2: Crea Password per App
1. Vai su [App Passwords](https://myaccount.google.com/apppasswords)
2. Seleziona "Mail" e il tuo dispositivo
3. Copia la password generata
4. Inseriscila in `SMTP_PASSWORD`

## 🐳 Configurazione Docker

Il `docker-compose.yml` è stato aggiornato per utilizzare il file `.env` unificato:

```yaml
services:
  frontend:
    env_file:
      - .env
    environment:
      - NODE_ENV=${NODE_ENV}
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
      # ... altre variabili

  backend:
    env_file:
      - .env
    environment:
      - NODE_ENV=${NODE_ENV}
      - PORT=${PORT}
      # ... altre variabili
```

## 🚀 Deployment in Produzione

### 1. Copia il Template di Produzione
```bash
cp environment-production.txt .env
```

### 2. Modifica le Variabili Critiche
- ✅ `JWT_SECRET`: Cambia con una chiave sicura (min 32 caratteri)
- ✅ `MONGODB_URI`: Aggiorna con il database di produzione
- ✅ `ALLOWED_ORIGINS`: Configura con i domini reali
- ✅ `SMTP_ENABLED`: Imposta su `true` se vuoi abilitare email, `false` altrimenti
- ✅ `SMTP_USER` e `SMTP_PASSWORD`: Configura per produzione (se SMTP abilitato)
- ✅ `NEXT_PUBLIC_API_URL`: Aggiorna con l'URL di produzione

### 3. Checklist Sicurezza
- [ ] JWT_SECRET cambiato
- [ ] Database di produzione configurato
- [ ] CORS configurato correttamente
- [ ] SMTP_ENABLED impostato correttamente
- [ ] Email SMTP configurata (se abilitata)
- [ ] URL frontend/backend aggiornati
- [ ] File .env non committato

## 🔍 Troubleshooting

### Problema: Variabili non caricate
**Soluzione**: Assicurati che il file `.env` sia nella root del progetto

### Problema: CORS Error
**Soluzione**: Verifica che `ALLOWED_ORIGINS` contenga l'URL del frontend

### Problema: Email non inviate
**Soluzione**: 
1. Verifica che la 2FA sia attiva
2. Usa una password per app Gmail
3. Controlla `SMTP_USER` e `SMTP_PASSWORD`

### Problema: JWT Error
**Soluzione**: Verifica che `JWT_SECRET` sia impostato e abbia almeno 32 caratteri

## 📁 File di Configurazione

| File | Descrizione |
|------|-------------|
| `.env` | File ambiente attivo (non committare) |
| `environment-config.txt` | Template per sviluppo |
| `environment-production.txt` | Template per produzione |
| `setup-env.sh` | Script configurazione automatica |

## 🔄 Migrazione da Configurazione Precedente

Se avevi file `.env` separati in `server/` e `client/`, puoi eliminarli:

```bash
# Rimuovi i vecchi file (se esistono)
rm server/.env
rm client/.env.local

# Usa il nuovo file unificato nella root
cp environment-config.txt .env
```

## 📞 Supporto

Per problemi di configurazione, consulta:
1. Questo documento
2. Il README.md principale
3. I commenti nei file template
4. Contatta il team di sviluppo 