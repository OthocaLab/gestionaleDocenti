# **Othoca Labs \- Sistema di Gestione Sostituzioni Docenti**

Questo progetto è una web application per la gestione delle sostituzioni dei docenti, delle ore di avanzo/disavanzo e della gestione del personale docente. L'obiettivo è automatizzare e semplificare la gestione delle sostituzioni, integrando tecnologie moderne con un approccio innovativo.

## **Tecnologie Utilizzate**

### **Frontend**

Framework: React con Next.js
Gestione Stato: Context API
Routing: Next.js Router
Chiamate API: Fetch API
Stile: CSS Modules

### **Backend**

Framework: Node.js con Express
Database: MongoDB
Autenticazione: JWT (JSON Web Token)

Validazione: Express Validator

## **Funzionalità Principali**

Gestione Utenti
Registrazione e login
Gestione profili docenti
Ruoli differenziati (admin, vicepresidenza, docente)

Importazione Dati
Importazione dell'orario dei docenti da file (Excel/CSV)

Importazione delle assenze dei docenti
Modifica manuale dei dati importati
Gestione Sostituzioni
Segnalazione assenze docenti
Selezione automatica dei sostituti in base a criteri prestabiliti
Notifiche ai docenti sostituenti
Gestione Ore
Monitoraggio ore da recuperare
Gestione ore buche
Ore extra retribuite
Report ed Esportazione
Generazione report sostituzioni
Esportazione dati in formato stampabile
Statistiche sulle ore da recuperare

## **Requisiti di Sistema**

Node.js (v14.x o superiore)

MongoDB (v4.x o superiore)

npm o yarn

## **Installazione**

### **Clonare il Repository** 
git clone [https://github.com/OthocaLab/othoca-labs.git](https://github.com/tuorepository/othoca-labs.git) 
cd othoca-labs

### **Configurazione del Backend**

Navigare nella cartella del server:

cd server
Installare le dipendenze:

npm install
Creare un file .env nella cartella server con le seguenti variabili:

    NODE\_ENV=development
    PORT=3000
    MONGODB\_URI=mongodb://localhost:27017/othoca-labs
    JWT\_SECRET=il\_tuo\_jwt\_secret\_sicuro
    JWT\_EXPIRE=30d
    EMAIL\_SERVICE=gmail
    EMAIL\_USERNAME=tua\_email@gmail.com
    EMAIL\_PASSWORD=tua\_password\_app
    EMAIL\_FROM=noreply@othocalabs.it

### **Configurazione del Frontend**

Navigare nella cartella del client:

cd ../client
Installare le dipendenze:

npm install
Creare un file .env.local nella cartella client con le seguenti variabili:

NEXT\_PUBLIC\_API\_URL=http://localhost:3000/api

## **Avvio dell'Applicazione**

### **Avvio del Backend**

Dalla cartella server:

Bash
npm run dev
Il server sarà in ascolto sulla porta 3000 (o quella specificata nel file .env).

### **Avvio del Frontend**

Dalla cartella client:

Bash
npm run dev
L'applicazione frontend sarà disponibile all'indirizzo http://localhost:3001.

## **Struttura del Progetto**

## othoca-labs/
## ├── client/                  \# Frontend Next.js
## │   ├── public/              \# File statici
## │   ├── src/                 \# Codice sorgente
## │   │   ├── components/      \# Componenti React
## │   │   ├── context/         \# Context API
## │   │   ├── hooks/           \# Custom hooks
## │   │   ├── pages/           \# Pagine Next.js
## │   │   ├── styles/          \# File CSS
## │   │   └── utils/           \# Utility functions
## │   ├── .env.local           \# Variabili d'ambiente frontend
## │   └── next.config.js       \# Configurazione Next.js
## │
## ├── server/                  \# Backend Node.js/Express
## │   ├── config/              \# Configurazioni
## │   ├── controllers/         \# Controller API
## │   ├── middleware/          \# Middleware Express
## │   ├── models/              \# Modelli Mongoose
## │   ├── routes/              \# Route API
## │   ├── utils/               \# Utility functions
## │   ├── .env                 \# Variabili d'ambiente backend
## │   └── server.js            \# Entry point del server
## │
## └── README.md                \# Documentazione del progetto

## **Ruoli Utente**

* Amministratore
* Gestione completa degli utenti
* Configurazione del sistema
* Accesso a tutte le funzionalità
* Vicepresidenza
* Gestione delle sostituzioni
* Approvazione delle assenze
* Generazione di report
* Docente
* Visualizzazione del proprio orario
* Richiesta di assenze/permessi
* Visualizzazione delle sostituzioni assegnate

## **Flusso di Lavoro Tipico**

La segreteria o il docente segnala un'assenza
Il sistema identifica le ore scoperte
Il sistema propone i docenti sostituti in base ai criteri configurati
La vicepresidenza conferma le sostituzioni
I docenti sostituti ricevono una notifica
Il sistema aggiorna il conteggio delle ore da recuperare

## **Contribuire al Progetto**

Per contribuire al progetto, seguire questi passaggi:

Fare un fork del repository
Creare un branch per la nuova feature (git checkout \-b feature/nome-feature)

Fare commit delle modifiche (git commit \-m 'Aggiunta nuova feature')

Fare push al branch (git push origin feature/nome-feature)

Aprire una Pull Request

## **Licenza**

Questo progetto è rilasciato sotto licenza MIT.

## **Contatti**

Per domande o supporto, contattare Andrea Siddi di Uras e suonare direttamente dove abita\!

\---

Sviluppato con ❤️ dal team Othoca Labs
