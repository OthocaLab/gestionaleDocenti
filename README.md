<div align="center">
  
# 🏫 Othoca Labs - Sistema di Gestione Sostituzioni Docenti

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-14%2B-green)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4.x-green)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-Latest-blue)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-Latest-black)](https://nextjs.org/)

*Semplifica la gestione delle sostituzioni docenti con un'applicazione web moderna ed efficiente*


</div>

---

## 📋 Panoramica

Othoca Labs è una web application completa progettata per automatizzare e semplificare la gestione delle sostituzioni dei docenti, monitorare ore di avanzo/disavanzo e ottimizzare la gestione del personale docente nelle istituzioni scolastiche.

<div align="center">
  <img src="client\public\img\logo.png" alt="Dashboard Othoca Labs" width="300" />
</div>

## ✨ Caratteristiche

### 👤 Gestione Utenti
- **Multi-ruolo**: Sistema con ruoli differenziati (admin, vicepresidenza, docente)
- **Autenticazione sicura**: Login protetto con JWT
- **Profili personalizzati**: Gestione completa dei profili docenti

### 📊 Gestione Dati
- **Importazione intelligente**: Carica orari e assenze da file Excel/CSV
- **Modifica intuitiva**: Interfaccia user-friendly per modifiche manuali
- **Sincronizzazione**: Dati sempre aggiornati in tempo reale

### 🔄 Sostituzioni Smart
- **Selezione automatica**: Algoritmo che propone i sostituti ideali
- **Notifiche immediate**: I docenti vengono informati in tempo reale
- **Gestione semplificata**: Interfaccia intuitiva per la vicepresidenza

### ⏱️ Monitoraggio Ore
- **Ore da recuperare**: Controllo preciso delle ore da compensare
- **Gestione ore buche**: Ottimizzazione dell'orario scolastico
- **Ore extra**: Monitoraggio delle ore aggiuntive retribuite

### 📝 Report ed Analytics
- **Statistiche dettagliate**: Visualizzazione dell'andamento
- **Esportazione dati**: Report in formato stampabile
- **Dashboard personalizzate**: In base al ruolo dell'utente

## 🛠️ Stack Tecnologico

### Frontend
- **Framework**: React con Next.js
- **Gestione Stato**: Context API
- **Routing**: Next.js Router
- **API**: Fetch API
- **Stile**: CSS Modules

### Backend
- **Framework**: Node.js con Express
- **Database**: MongoDB
- **Autenticazione**: JWT (JSON Web Token)
- **Validazione**: Express Validator

## 🚀 Installazione

### Clonare il Repository
```bash
git clone https://github.com/OthocaLab/gestionaleDocenti
cd gestionaleDocenti
```

### Collegamento SMTP
- **Attivazione 2fa**: [2FA](https://myaccount.google.com/security)
- **Creazione SMTP_PASSWORD**: [SMTP_PASSWORD](https://myaccount.google.com/apppasswords)

## 🔧 Configurazione

### 🚀 Configurazione Rapida (Consigliata)

```bash
# 1. Esegui lo script di configurazione automatica
./setup-env.sh

# 2. Modifica il file .env con i tuoi dati
nano .env

# 3. Installa le dipendenze
npm install
cd server && npm install
cd ../client && npm install
```

### ⚙️ Configurazione Manuale

#### Passo 1: Configurazione Ambiente
Copia il contenuto del file `environment-config.txt` in un nuovo file `.env` nella root del progetto:

```bash
cp environment-config.txt .env
```

#### Passo 2: Personalizza le Variabili
Modifica il file `.env` con i tuoi dati:

```env
# Configurazione Database
MONGODB_URI=mongodb://127.0.0.1:27017/gestionale-docenti

# Configurazione JWT (IMPORTANTE: Cambia in produzione)
JWT_SECRET=othoca_labs_super_secret_key_2024_change_in_production

# Configurazione Email SMTP
SMTP_ENABLED=true
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password_here
EMAIL_FROM=Othoca Labs <noreply@othocalabs.it>

# Configurazione API
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

#### Passo 3: Installazione Dipendenze

```bash
# Dipendenze root (se presenti)
npm install

# Dipendenze backend
cd server
npm install

# Dipendenze frontend
cd ../client
npm install
```

## 🏃‍♂️ Avvio dell'Applicazione

### Backend (Primo terminale)
```bash
cd server
npm run dev
```

### Frontend (Secondo terminale)
```bash
cd client
npm run dev
```
L'applicazione sarà disponibile all'indirizzo: [http://localhost:3000](http://localhost:3000)

## 📁 Struttura del Progetto

```
othoca-labs/
├── client/                  # Frontend Next.js
│   ├── public/              # File statici
│   ├── src/                 # Codice sorgente
│   │   ├── components/      # Componenti React
│   │   ├── context/         # Context API
│   │   ├── hooks/           # Custom hooks
│   │   ├── pages/           # Pagine Next.js
│   │   ├── styles/          # File CSS
│   │   └── utils/           # Utility functions
│   └── next.config.js       # Configurazione Next.js
│
├── server/                  # Backend Node.js/Express
│   ├── config/              # Configurazioni
│   ├── controllers/         # Controller API
│   ├── middleware/          # Middleware Express
│   ├── models/              # Modelli Mongoose
│   ├── routes/              # Route API
│   ├── utils/               # Utility functions
│   └── server.js            # Entry point del server
│
├── .env                     # 🔧 Variabili d'ambiente UNIFICATE
├── environment-config.txt   # 📋 Template configurazione sviluppo
├── environment-production.txt # 🚀 Template configurazione produzione
├── setup-env.sh            # 🛠️ Script configurazione automatica
├── docker-compose.yml       # 🐳 Configurazione Docker
└── README.md                # 📖 Documentazione del progetto
```


## 👥 Ruoli Utente

| Ruolo | Permessi |
|-------|----------|
| **Amministratore** | Gestione completa degli utenti<br>Configurazione del sistema<br>Accesso a tutte le funzionalità |
| **Vicepresidenza** | Gestione delle sostituzioni<br>Approvazione delle assenze<br>Generazione di report |
| **Docente** | Visualizzazione del proprio orario<br>Richiesta di assenze/permessi<br>Visualizzazione delle sostituzioni assegnate |

## 🔄 Flusso di Lavoro

```mermaid
graph TD
    A[Segnalazione Assenza] --> B[Identificazione Ore Scoperte]
    B --> C[Proposta Sostituti]
    C --> D[Conferma Sostituzioni]
    D --> E[Notifica ai Docenti]
    E --> F[Aggiornamento Conteggio Ore]
```

1. La segreteria o il docente segnala un'assenza
2. Il sistema identifica le ore scoperte
3. Il sistema propone i docenti sostituti in base ai criteri configurati
4. La vicepresidenza conferma le sostituzioni
5. I docenti sostituti ricevono una notifica
6. Il sistema aggiorna il conteggio delle ore da recuperare

## 👨‍💻 Contribuire al Progetto

1. Fork del repository
2. Creare un branch per la nuova feature (`git checkout -b feature/nome-feature`)
3. Commit delle modifiche (`git commit -m 'Aggiunta nuova feature'`)
4. Push al branch (`git push origin feature/nome-feature`)
5. Aprire una Pull Request

## 📜 Licenza

Questo progetto è rilasciato sotto licenza [MIT](https://opensource.org/licenses/MIT).

## 📞 Contatti

Per domande o supporto, contattare Fabio Saba di Gonnosfanadiga.

---

<div align="center">
  
Sviluppato con ❤️ dal team Othoca Labs

</div>
