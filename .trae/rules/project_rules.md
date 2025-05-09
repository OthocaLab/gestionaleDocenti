Descrizione del Progetto
Sviluppo di una Web Application per la gestione delle sostituzioni dei docenti, delle ore di avanzo/disavanzo e della gestione del personale docente 
L'obiettivo è automatizzare e semplificare la gestione delle sostituzioni, integrando tecnologie moderne con un approccio innovativo.

Tecnologie di Sviluppo
Frontend: React (preferibilmente utilizzando componenti funzionali e hooks).
Backend: Node.js con Express per la gestione delle API REST.
Database: MongoDB  
Mockup già disponibile: Utilizzare il mockup front-end come punto di partenza per lo sviluppo dell'interfaccia utente.
Linguaggio e Stile del Codice
Lingua degli output e dei commenti: Italiano.
Codice Pulito: Seguire le best practices di React, Node.js e del DBMS scelto.
Modularità: Componenti React modulari e riutilizzabili.
Documentazione: Commenti chiari e descrittivi, mantenendo il codice leggibile.
Requisiti Funzionali
Importazione Dati

Importazione dell'orario dei docenti da file (es. Excel o CSV) con possibilità di modifica manuale.
Importazione delle assenze dei docenti da file con possibilità di modifica manuale.
Gestione dei Docenti

Assenze: Segnalazione delle assenze o permessi da parte della segreteria o dal docente stesso, con indicazione della durata e della motivazione.
Ore da recuperare: Visualizzazione delle ore da recuperare per ciascun docente.
Scelta del docente sostituto:
Selezione del sostituto per le ore scoperte, in base a criteri prestabiliti:
Docente che deve recuperare ore.
Docente interno alla classe.
Docente con la stessa materia o materia simile.
Docente del ciclo corrispondente (Biennio o Triennio).
Evitare di assegnare troppe ore consecutive a un singolo docente.
Se l'assenza è all'ultima ora e il docente è in compresenza, la classe può uscire prima.
In caso contrario, selezionare un sostituto.
Ore extra retribuite: Notifica ai docenti per le ore extra se comunicate in anticipo.
Docenti Assenti ma Presenti: Sezione per segnalare docenti impegnati in altre attività scolastiche (es. gite).
Notifiche e Esportazione

Notifica ai Docenti Sostituenti: Notifica al docente selezionato per la sostituzione (specificare la modalità: email o app).
Esportazione Info Docenti Sostituenti:
Generazione di file stampabili con le informazioni sui docenti sostituenti.
Possibilità di esportare informazioni su:
Assegnazione delle classi alle aule.
Ore disponibili per i docenti.
Abbinamento docenti-materie.
Assegnazione docenti-classi.
Report sulle ore da recuperare e ore buche.
Generazione del Codice


Frontend (React)
Utilizzo di Vite per creare l’app React (start rapido).
React Router per la navigazione tra le pagine:
Dashboard principale per la gestione delle sostituzioni.
Gestione Docenti per la visualizzazione e modifica delle assenze e delle ore da recuperare.
Importazione Dati per caricare i file degli orari e delle assenze.
Notifiche per visualizzare le sostituzioni assegnate.
Report e Esportazione per generare file stampabili.
State Management con Redux Toolkit o React Context API.
Chiamate API al backend con Axios o Fetch.
UI Responsive e Moderna utilizzando Styled Components, partendo dal mockup già disponibile.


Backend (Node.js + Express)
API REST per la gestione dei dati:
CRUD per:
Orario Docenti (Importazione e modifica manuale).
Assenze Docenti (Importazione, segnalazione e modifica).
Sostituzioni Docenti (Scelta del sostituto e notifica).
Report e Esportazione (Generazione di file esportabili).
Gestione Autenticazione: JWT per la gestione dei ruoli (Amministratore, Docente, Vicepresidenza).
Descrizione del Progetto
Sviluppo di una Web Application per la gestione delle sostituzioni dei docenti, delle ore di avanzo/disavanzo e della gestione del personale docente 
L'obiettivo è automatizzare e semplificare la gestione delle sostituzioni, integrando tecnologie moderne con un approccio innovativo.

Tecnologie di Sviluppo
Frontend: React (preferibilmente utilizzando componenti funzionali e hooks).
Backend: Node.js con Express per la gestione delle API REST.
Database: MongoDB  
Mockup già disponibile: Utilizzare il mockup front-end come punto di partenza per lo sviluppo dell'interfaccia utente.
Linguaggio e Stile del Codice
Lingua degli output e dei commenti: Italiano.
Codice Pulito: Seguire le best practices di React, Node.js e del DBMS scelto.
Modularità: Componenti React modulari e riutilizzabili.
Documentazione: Commenti chiari e descrittivi, mantenendo il codice leggibile.
Requisiti Funzionali
Importazione Dati

Importazione dell'orario dei docenti da file (es. Excel o CSV) con possibilità di modifica manuale.
Importazione delle assenze dei docenti da file con possibilità di modifica manuale.
Gestione dei Docenti

Assenze: Segnalazione delle assenze o permessi da parte della segreteria o dal docente stesso, con indicazione della durata e della motivazione.
Ore da recuperare: Visualizzazione delle ore da recuperare per ciascun docente.
Scelta del docente sostituto:
Selezione del sostituto per le ore scoperte, in base a criteri prestabiliti:
Docente che deve recuperare ore.
Docente interno alla classe.
Docente con la stessa materia o materia simile.
Docente del ciclo corrispondente (Biennio o Triennio).
Evitare di assegnare troppe ore consecutive a un singolo docente.
Se l'assenza è all'ultima ora e il docente è in compresenza, la classe può uscire prima.
In caso contrario, selezionare un sostituto.
Ore extra retribuite: Notifica ai docenti per le ore extra se comunicate in anticipo.
Docenti Assenti ma Presenti: Sezione per segnalare docenti impegnati in altre attività scolastiche (es. gite).
Notifiche e Esportazione

Notifica ai Docenti Sostituenti: Notifica al docente selezionato per la sostituzione (specificare la modalità: email o app).
Esportazione Info Docenti Sostituenti:
Generazione di file stampabili con le informazioni sui docenti sostituenti.
Possibilità di esportare informazioni su:
Assegnazione delle classi alle aule.
Ore disponibili per i docenti.
Abbinamento docenti-materie.
Assegnazione docenti-classi.
Report sulle ore da recuperare e ore buche.
Generazione del Codice


Frontend (React)
Utilizzo di Next.js per creare l’app React (start rapido).
React Router per la navigazione tra le pagine:
Dashboard principale per la gestione delle sostituzioni.
Gestione Docenti per la visualizzazione e modifica delle assenze e delle ore da recuperare.
Importazione Dati per caricare i file degli orari e delle assenze.
Notifiche per visualizzare le sostituzioni assegnate.
Report e Esportazione per generare file stampabili.
State Management con Redux Toolkit o React Context API.
Chiamate API al backend con Axios o Fetch.
UI Responsive e Moderna utilizzando Styled Components, partendo dal mockup già disponibile.


Backend (Node.js + Express)
API REST per la gestione dei dati:
CRUD per:
Orario Docenti (Importazione e modifica manuale).
Assenze Docenti (Importazione, segnalazione e modifica).
Sostituzioni Docenti (Scelta del sostituto e notifica).
Report e Esportazione (Generazione di file esportabili).
Gestione Autenticazione: JWT per la gestione dei ruoli (Amministratore, Docente, Vicepresidenza).
Validazione dei dati con Joi o Express Validator.
Error Handling strutturato e gestione dei log.
Database
MongoDB (preferito per la flessibilità e per dati non relazionali) o MySQL (se necessarie relazioni complesse).
Schema dati per:
Orario Docenti: classe, docente, materia, orario, aula.
Assenze Docenti: docente, data, motivazione, durata, stato (approvata, in attesa, rifiutata).
Sostituzioni: docente assente, docente sostituto, ora, classe, aula.
Ore da Recuperare: docente, ore da recuperare, ore recuperate, dettaglio delle sostituzioni.
Integrazione AI
Cursor AI per:
Generazione di snippet di codice.
Debug e ottimizzazione automatizzata.
Microsoft Copilot per supporto allo sviluppo in tempo reale.
Output Atteso
Codice Sorgente Completo per frontend e backend, strutturato in due cartelle separate.
Documentazione in Italiano, inclusi:
Istruzioni per l'installazione (npm install) e l'esecuzione (npm run dev o npm start).
Manuale utente per il personale della vicepresidenza.
Progetto su GitHub, con istruzioni chiare per il setup.
UI Responsiva e User-friendly, seguendo il mockup già disponibile.
Esegui il Prompt
Genera il codice per l'applicazione completa utilizzando le specifiche fornite e rispettando le Rules for AI! 

Utilizza e realizza il progetto in javascript con i file in formato .js 

