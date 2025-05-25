const Materia = require('../models/Materia');
const ClasseInsegnamento = require('../models/ClasseInsegnamento');
const ClasseScolastica = require('../models/ClasseScolastica');
const OrarioLezioni = require('../models/OrarioLezioni');
const Docente = require('../models/Docente');
const fs = require('fs');
const path = require('path');

// Schema per salvare lo stato dell'importazione nel database
const mongoose = require('mongoose');

const ImportStatusSchema = new mongoose.Schema({
  sessionId: { type: String, unique: true, required: true },
  isRunning: { type: Boolean, default: false },
  progress: { type: Number, default: 0 },
  currentStep: { type: String, default: '' },
  totalTeachers: { type: Number, default: 0 },
  processedTeachers: { type: Number, default: 0 },
  errors: [String],
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const ImportStatus = mongoose.model('ImportStatus', ImportStatusSchema);

// Stato globale dell'importazione (backup in memoria)
let importStatus = {
  isRunning: false,
  progress: 0,
  currentStep: '',
  totalTeachers: 0,
  processedTeachers: 0,
  errors: [],
  startTime: null,
  endTime: null,
  sessionId: null
};

// Endpoint per controllare lo stato dell'importazione
exports.getImportStatus = async (req, res) => {
  try {
    // Prima controlla se c'è uno stato in memoria
    if (importStatus.isRunning && importStatus.sessionId) {
      return res.status(200).json({
        success: true,
        data: importStatus
      });
    }
    
    // Altrimenti cerca l'ultimo stato nel database
    const dbStatus = await ImportStatus.findOne({ 
      userId: req.user._id 
    }).sort({ createdAt: -1 });
    
    if (dbStatus) {
      // Aggiorna lo stato in memoria con quello del database
      importStatus = {
        isRunning: dbStatus.isRunning,
        progress: dbStatus.progress,
        currentStep: dbStatus.currentStep,
        totalTeachers: dbStatus.totalTeachers,
        processedTeachers: dbStatus.processedTeachers,
        errors: dbStatus.errors,
        startTime: dbStatus.startTime,
        endTime: dbStatus.endTime,
        sessionId: dbStatus.sessionId
      };
      
      return res.status(200).json({
        success: true,
        data: importStatus
      });
    }
    
    // Se non c'è nessuno stato, restituisci quello di default
    res.status(200).json({
      success: true,
      data: {
        isRunning: false,
        progress: 0,
        currentStep: 'Nessuna importazione in corso',
        totalTeachers: 0,
        processedTeachers: 0,
        errors: [],
        startTime: null,
        endTime: null,
        sessionId: null
      }
    });
  } catch (error) {
    console.error('❌ Errore nel recupero dello stato importazione:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dello stato',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Controller per l'importazione degli orari
exports.importaOrari = async (req, res) => {
  try {
    console.log('=== INIZIO IMPORTAZIONE ORARI ===');
    console.log('Request file:', req.file);
    console.log('User ID:', req.user ? req.user._id : 'Not authenticated');
    console.log('User role:', req.user ? req.user.ruolo : 'Unknown');
    
    // Verifica se c'è già un'importazione in corso per questo utente
    const existingImport = await ImportStatus.findOne({
      userId: req.user._id,
      isRunning: true
    });
    
    if (existingImport) {
      return res.status(409).json({
        success: false,
        message: 'Un\'importazione è già in corso per questo utente. Attendere il completamento.'
      });
    }
    
    // Verifica di sicurezza aggiuntiva
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticazione richiesta'
      });
    }
    
    // Verifica ruolo (backup se il middleware authorize fallisce)
    if (!['admin', 'vicepresidenza'].includes(req.user.ruolo)) {
      return res.status(403).json({
        success: false,
        message: 'Permessi insufficienti per questa operazione'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nessun file caricato' 
      });
    }

    const filePath = req.file.path;
    const sessionId = `${req.user._id}_${Date.now()}`;
    
    // Crea un nuovo record di stato nel database
    const dbStatus = await ImportStatus.create({
      sessionId: sessionId,
      isRunning: true,
      progress: 0,
      currentStep: 'Inizializzazione...',
      totalTeachers: 0,
      processedTeachers: 0,
      errors: [],
      startTime: new Date(),
      userId: req.user._id
    });
    
    // Inizializza lo stato dell'importazione in memoria
    importStatus = {
      isRunning: true,
      progress: 0,
      currentStep: 'Inizializzazione...',
      totalTeachers: 0,
      processedTeachers: 0,
      errors: [],
      startTime: new Date(),
      endTime: null,
      sessionId: sessionId
    };
    
    // Rispondi immediatamente al client per evitare timeout
    res.status(200).json({
      success: true,
      message: 'File ricevuto, elaborazione in corso...',
      sessionId: sessionId,
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size
      }
    });
    
    // Continua l'elaborazione in background
    processImportAsync(filePath, req.user, sessionId).catch(err => {
      console.error('Errore durante l\'elaborazione asincrona:', err);
      updateImportStatus(sessionId, {
        isRunning: false,
        currentStep: 'Errore durante l\'elaborazione',
        endTime: new Date(),
        errors: [`Errore fatale: ${err.message}`]
      });
    });
    
  } catch (error) {
    console.error('❌ Errore durante l\'importazione degli orari:', error);
    
    // Reset dello stato in caso di errore
    if (importStatus.sessionId) {
      await updateImportStatus(importStatus.sessionId, {
        isRunning: false,
        currentStep: 'Errore durante l\'inizializzazione',
        endTime: new Date()
      });
    }
    
    // Assicurati di eliminare il file temporaneo in caso di errore
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Errore nell\'eliminazione del file temporaneo:', e);
      }
    }
    
    return res.status(500).json({
      success: false,
      message: 'Errore durante l\'importazione',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Funzione helper per aggiornare lo stato dell'importazione
async function updateImportStatus(sessionId, updates) {
  try {
    // Aggiorna il database
    await ImportStatus.findOneAndUpdate(
      { sessionId: sessionId },
      { $set: updates, $push: updates.errors ? { errors: { $each: updates.errors } } : {} },
      { new: true }
    );
    
    // Aggiorna anche lo stato in memoria se è la sessione corrente
    if (importStatus.sessionId === sessionId) {
      Object.assign(importStatus, updates);
      if (updates.errors && Array.isArray(updates.errors)) {
        importStatus.errors.push(...updates.errors);
      }
    }
    
    console.log(`📊 Stato aggiornato per sessione ${sessionId}:`, updates);
  } catch (error) {
    console.error(`❌ Errore nell'aggiornamento dello stato per sessione ${sessionId}:`, error);
  }
}

// Funzione asincrona per elaborare l'import in background
async function processImportAsync(filePath, user, sessionId) {
  try {
    console.log(`🚀 Inizio elaborazione asincrona del file: ${filePath}`);
    await updateImportStatus(sessionId, { currentStep: 'Lettura file JSON...' });
    
    // Leggi il file JSON
    let orariData;
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      orariData = JSON.parse(fileContent);
      console.log(`📄 File JSON letto correttamente, contiene ${orariData.orari?.length || 0} docenti`);
      await updateImportStatus(sessionId, { 
        currentStep: 'File JSON letto correttamente',
        totalTeachers: orariData.orari?.length || 0
      });
    } catch (error) {
      console.error('❌ Errore nella lettura del file JSON:', error);
      await updateImportStatus(sessionId, {
        currentStep: 'Errore nella lettura del file JSON',
        isRunning: false,
        endTime: new Date(),
        errors: [`Errore lettura file: ${error.message}`]
      });
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return;
    }
    
    // Valida la struttura del JSON
    await updateImportStatus(sessionId, { currentStep: 'Validazione struttura JSON...' });
    if (!validateJsonStructure(orariData)) {
      console.error('❌ Struttura JSON non valida');
      await updateImportStatus(sessionId, {
        currentStep: 'Struttura JSON non valida',
        isRunning: false,
        endTime: new Date(),
        errors: ['Struttura JSON non valida']
      });
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return;
    }
    
    // Statistiche per l'importazione
    const stats = {
      totalTeachers: orariData.orari.length,
      processedTeachers: 0,
      newClasses: 0,
      newSubjects: 0,
      insertedTeachers: 0,
      updatedTeachers: 0,
      updatedSchedules: 0,
      errors: []
    };
    
    console.log(`=== STATISTICHE INIZIALI ===`);
    console.log(`📊 Totale docenti da processare: ${stats.totalTeachers}`);
    console.log(`👥 Primi 3 docenti nel file:`, orariData.orari.slice(0, 3).map(p => p.professore));
    
    await updateImportStatus(sessionId, {
      currentStep: 'Elaborazione docenti in corso...',
      totalTeachers: stats.totalTeachers
    });
    
    // Elabora tutti i docenti
    const professori = orariData.orari;
    
    for (let i = 0; i < professori.length; i++) {
      const professore = professori[i];
      console.log(`\n=== ELABORAZIONE DOCENTE ${i + 1}/${professori.length} ===`);
      console.log(`👤 Codice docente: ${professore.professore}`);
      console.log(`📚 Numero lezioni: ${professore.lezioni?.length || 0}`);
      
      // Aggiorna lo stato
      await updateImportStatus(sessionId, {
        processedTeachers: i,
        progress: Math.round((i / professori.length) * 100),
        currentStep: `Elaborazione docente ${i + 1}/${professori.length}: ${professore.professore}`
      });
      
      try {
        stats.processedTeachers++;
        
        // Elabora il docente
        const docente = await processDocente(professore, stats);
        if (!docente) {
          console.log(`⏭️ Docente ${i + 1} saltato`);
          await updateImportStatus(sessionId, {
            errors: [`Docente ${i + 1} saltato: dati insufficienti`]
          });
          continue;
        }
        
        // Elabora le lezioni del docente
        await processLezioniDocente(docente, professore.lezioni || [], stats);
        
        console.log(`✅ Docente ${i + 1}/${professori.length} completato - Lezioni elaborate: ${professore.lezioni?.length || 0}`);
        
        // Pausa ogni 5 docenti per non sovraccaricare il database
        if ((i + 1) % 5 === 0 && i < professori.length - 1) {
          console.log(`⏸️ Pausa breve dopo ${i + 1} docenti...`);
          await updateImportStatus(sessionId, {
            currentStep: `Pausa dopo ${i + 1} docenti...`
          });
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        console.error(`❌ Errore elaborazione docente ${i + 1}/${professori.length}:`, error.message);
        console.error(`📋 Stack trace:`, error.stack);
        const errorMsg = `Errore docente ${i + 1}: ${error.message}`;
        stats.errors.push(errorMsg);
        await updateImportStatus(sessionId, {
          errors: [errorMsg]
        });
        console.log(`⏭️ Docente ${i + 1} saltato per errore generico, continuo con il prossimo`);
        // Continua con il prossimo docente invece di interrompere tutto
      }
    }
    
    // Aggiorna lo stato finale
    await updateImportStatus(sessionId, {
      processedTeachers: professori.length,
      progress: 100,
      currentStep: 'Finalizzazione importazione...'
    });
    
    // Cleanup e statistiche finali
    await finalizeImport(filePath, stats);
    
    // Completa lo stato
    await updateImportStatus(sessionId, {
      isRunning: false,
      currentStep: 'Importazione completata con successo',
      endTime: new Date(),
      errors: stats.errors
    });
    
  } catch (error) {
    console.error('❌ Errore durante l\'elaborazione asincrona:', error);
    console.error('📋 Stack trace:', error.stack);
    
    // Aggiorna lo stato di errore
    await updateImportStatus(sessionId, {
      isRunning: false,
      currentStep: 'Errore durante l\'elaborazione',
      endTime: new Date(),
      errors: [`Errore fatale: ${error.message}`]
    });
    
    // Cleanup del file temporaneo
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.error('❌ Errore nell\'eliminazione del file temporaneo:', e);
    }
  }
}

// Funzione per elaborare un singolo docente
async function processDocente(professore, stats) {
  const codiceDocente = professore.professore;
  
  if (!codiceDocente) {
    const errorMsg = `Manca il campo 'professore'`;
    stats.errors.push(errorMsg);
    console.log(`❌ ${errorMsg}`);
    return null;
  }
  
  try {
    // Prepara i dati del docente
    const docenteData = {
      nome: professore.nome || codiceDocente,
      cognome: professore.cognome || codiceDocente,
      codiceFiscale: professore.codiceFiscale || codiceDocente,
      codiceDocente: codiceDocente,
      email: professore.email || generateTempEmail(codiceDocente),
      telefono: professore.telefono || '',
      stato: professore.stato || 'attivo',
      classiInsegnamento: [],
      oreRecupero: 0
    };
    
    console.log(`📝 Dati docente: ${codiceDocente}`);
    
    // Gestione delle classi di insegnamento
    if (professore.classiInsegnamento && Array.isArray(professore.classiInsegnamento)) {
      console.log(`📚 Classi insegnamento: ${professore.classiInsegnamento.join(', ')}`);
      
      for (const codiceClasse of professore.classiInsegnamento) {
        try {
          console.log(`🔍 Cerco o creo classe di insegnamento: ${codiceClasse}`);
          
          const classeInsegnamento = await ClasseInsegnamento.findOneAndUpdate(
            { codiceClasse: codiceClasse },
            {
              $setOnInsert: {
                codiceClasse: codiceClasse,
                descrizione: `Classe ${codiceClasse}`
              }
            },
            {
              new: true,
              upsert: true
            }
          );
          
          docenteData.classiInsegnamento.push(classeInsegnamento._id);
          console.log(`✅ Classe di insegnamento aggiunta: ${codiceClasse}`);
        } catch (err) {
          console.error(`❌ Errore nella gestione della classe di insegnamento ${codiceClasse}:`, err);
          stats.errors.push(`Errore classe insegnamento ${codiceClasse}: ${err.message}`);
        }
      }
    }
    
    // Cerca o crea il docente
    let existingDocente = await Docente.findOne({
      $or: [
        { codiceFiscale: codiceDocente },
        { codiceDocente: codiceDocente }
      ]
    });
    
    let docente;
    if (existingDocente) {
      console.log(`🔄 Aggiornamento docente esistente: ${existingDocente._id}`);
      
      // Aggiorna solo i campi che non sono già valorizzati
      if (!existingDocente.nome || existingDocente.nome === existingDocente.codiceDocente) {
        existingDocente.nome = docenteData.nome;
      }
      if (!existingDocente.cognome || existingDocente.cognome === existingDocente.codiceDocente) {
        existingDocente.cognome = docenteData.cognome;
      }
      if (!existingDocente.email || existingDocente.email.includes('@temp.scuola.it')) {
        existingDocente.email = docenteData.email;
      }
      if (professore.telefono && (!existingDocente.telefono || existingDocente.telefono === '')) {
        existingDocente.telefono = docenteData.telefono;
      }
      if (professore.stato) {
        existingDocente.stato = docenteData.stato;
      }
      
      docente = await existingDocente.save();
      stats.updatedTeachers++;
      console.log(`✅ Docente aggiornato: ${docente.nome} ${docente.cognome}`);
    } else {
      console.log(`➕ Creazione nuovo docente`);
      docente = await Docente.create(docenteData);
      stats.insertedTeachers++;
      console.log(`✅ Nuovo docente creato: ${docente.nome} ${docente.cognome}`);
    }
    
    // Rimuovi gli orari esistenti per il docente
    const deletedCount = await OrarioLezioni.deleteMany({ docente: docente._id });
    console.log(`🗑️ Rimossi ${deletedCount.deletedCount} orari esistenti per docente ${docente._id}`);
    
    return docente;
    
  } catch (error) {
    console.error(`❌ Errore docente ${codiceDocente}:`, error.message);
    stats.errors.push(`Errore docente ${codiceDocente}: ${error.message}`);
    return null;
  }
}

// Funzione per elaborare le lezioni di un docente
async function processLezioniDocente(docente, lezioni, stats) {
  console.log(`📅 Elaborazione di ${lezioni.length} lezioni per docente ${docente.codiceDocente}`);
  
  const giornoMap = {
    'LU': 'Lun',
    'MA': 'Mar',
    'ME': 'Mer',
    'GI': 'Gio',
    'VE': 'Ven',
    'SA': 'Sab'
  };
  
  for (let k = 0; k < lezioni.length; k++) {
    const lezione = lezioni[k];
    console.log(`  📝 Lezione ${k + 1}/${lezioni.length}: ${lezione.giorno} ${lezione.ora} - Classe: ${lezione.classe} - Aula: ${lezione.aula} - Materia: ${lezione.materia}`);
    
    try {
      // Valida i dati obbligatori
      if (!lezione.giorno || !lezione.ora || !lezione.materia) {
        const errorMsg = `Dati lezione incompleti per docente ${docente.codiceDocente} - lezione ${k + 1}`;
        stats.errors.push(errorMsg);
        console.log(`  ❌ ${errorMsg}`);
        continue;
      }
      
      // Gestisci disponibilità vs lezioni normali
      const isDisponibilita = lezione.materia === "DISP";
      const hasClasse = lezione.classe && lezione.classe.trim() !== '';
      const hasAula = lezione.aula && lezione.aula.trim() !== '';
      
      // Per lezioni normali, deve esserci almeno la classe o l'aula
      if (!isDisponibilita && !hasClasse && !hasAula) {
        const errorMsg = `Dati lezione incompleti per docente ${docente.codiceDocente}: mancano sia classe che aula - lezione ${k + 1}`;
        stats.errors.push(errorMsg);
        console.log(`  ❌ ${errorMsg}`);
        continue;
      }
      
      // Normalizza aula e classe
      let aula, classeNome;
      if (isDisponibilita) {
        aula = 'Disponibilità';
        classeNome = '';
      } else {
        aula = hasAula ? lezione.aula.trim() : 'N/D';
        classeNome = hasClasse ? lezione.classe.trim() : 'N/D';
      }
      
      console.log(`  🏫 Elaborazione: ${lezione.giorno} ${lezione.ora} - ${isDisponibilita ? 'Disponibilità' : ('Classe: ' + classeNome + ' - Aula: ' + aula)} - Materia: ${lezione.materia}`);
      
      // Trova o crea la materia
      const materia = await findOrCreateMateria(lezione.materia, stats);
      if (!materia) {
        console.log(`  ⏭️ Lezione ${k + 1} saltata per errore nella materia`);
        continue;
      }
      
      // Trova o crea la classe (se necessario)
      const classe = await findOrCreateClasse(classeNome, aula, isDisponibilita, hasClasse, hasAula, stats);
      
      // Crea l'orario
      await createOrarioLezione(docente, materia, classe, lezione, giornoMap, aula, isDisponibilita, stats);
      
      console.log(`  ✅ Lezione ${k + 1}/${lezioni.length} completata con successo`);
      
    } catch (error) {
      console.error(`  ❌ Errore elaborazione lezione ${k + 1}:`, error.message);
      console.error(`  📋 Stack trace lezione:`, error.stack);
      stats.errors.push(`Errore lezione ${k + 1}: ${error.message}`);
      console.log(`  ⏭️ Lezione ${k + 1} saltata per errore generico`);
    }
  }
  
  console.log(`📅 Completata elaborazione lezioni per docente ${docente.codiceDocente}: ${lezioni.length} lezioni processate`);
}

// Funzione per trovare o creare una materia
async function findOrCreateMateria(codiceMateria, stats) {
  try {
    const materiaResult = await Materia.findOneAndUpdate(
      { codiceMateria: codiceMateria },
      {
        $setOnInsert: {
          codiceMateria: codiceMateria,
          descrizione: codiceMateria,
          coloreMateria: '#' + Math.floor(Math.random()*16777215).toString(16)
        }
      },
      {
        new: true,
        upsert: true
      }
    );
    
    console.log(`  📚 Materia: ${materiaResult.codiceMateria} (${materiaResult._id})`);
    return materiaResult;
    
  } catch (error) {
    console.error(`  ❌ Errore materia ${codiceMateria}:`, error.message);
    stats.errors.push(`Errore materia ${codiceMateria}: ${error.message}`);
    return null;
  }
}

// Funzione per trovare o creare una classe
async function findOrCreateClasse(classeNome, aula, isDisponibilita, hasClasse, hasAula, stats) {
  if (isDisponibilita) {
    console.log(`  🏫 Lezione di disponibilità - nessuna classe necessaria`);
    return null;
  }
  
  if (!hasClasse && hasAula) {
    console.log(`  🏫 Lezione solo con aula specificata`);
    try {
      const classeResult = await ClasseScolastica.findOneAndUpdate(
        {
          anno: 0,
          sezione: `AULA_${aula}`
        },
        {
          $setOnInsert: {
            anno: 0,
            sezione: `AULA_${aula}`,
            aula: aula,
            indirizzo: 'Classe Virtuale'
          }
        },
        {
          new: true,
          upsert: true
        }
      );
      console.log(`  🏫 Classe virtuale creata per aula ${aula}: ${classeResult._id}`);
      return classeResult;
    } catch (error) {
      console.error(`  ❌ Errore creazione classe virtuale per aula ${aula}:`, error.message);
      return null;
    }
  }
  
  // Gestione normale delle classi
  let anno = 1;
  let sezione = classeNome;
  
  if (classeNome.length >= 2) {
    const match = classeNome.match(/^([1-5])([A-Z].*)$/);
    if (match) {
      anno = parseInt(match[1]);
      sezione = match[2];
    }
  }
  
  try {
    const classeResult = await ClasseScolastica.findOneAndUpdate(
      {
        anno: anno,
        sezione: sezione
      },
      {
        $setOnInsert: {
          anno: anno,
          sezione: sezione,
          aula: aula !== 'N/D' ? aula : 'N/D',
          indirizzo: 'Da definire'
        }
      },
      {
        new: true,
        upsert: true
      }
    );
    
    console.log(`  🏫 Classe: ${classeResult.anno}${classeResult.sezione} (${classeResult._id})`);
    return classeResult;
    
  } catch (error) {
    console.error(`  ❌ Errore classe ${anno}${sezione}:`, error.message);
    stats.errors.push(`Errore classe ${anno}${sezione}: ${error.message}`);
    return null;
  }
}

// Funzione per creare un orario lezione
async function createOrarioLezione(docente, materia, classe, lezione, giornoMap, aula, isDisponibilita, stats) {
  try {
    // Calcola orario inizio e fine
    let oraInizio = lezione.ora;
    let oraFine = '';
    
    if (oraInizio.includes(':')) {
      const [ore, minuti] = oraInizio.split(':').map(Number);
      const dataInizio = new Date();
      dataInizio.setHours(ore, minuti);
      const dataFine = new Date(dataInizio.getTime() + 60 * 60 * 1000);
      oraFine = `${dataFine.getHours()}:${dataFine.getMinutes().toString().padStart(2, '0')}`;
    } else {
      oraFine = oraInizio;
    }
    
    // Crea il nuovo record di orario
    const nuovoOrario = new OrarioLezioni({
      docente: docente._id,
      materia: materia._id,
      giornoSettimana: giornoMap[lezione.giorno] || lezione.giorno,
      ora: getOraNumber(oraInizio),
      oraInizio: oraInizio,
      oraFine: oraFine,
      aula: aula,
      isDisponibilita: isDisponibilita,
      classe: !isDisponibilita && classe ? classe._id : null
    });
    
    const savedOrario = await nuovoOrario.save();
    console.log(`  ✅ Orario creato: ${savedOrario._id} per ${giornoMap[lezione.giorno] || lezione.giorno} ora ${getOraNumber(oraInizio)}`);
    
    // Collega l'orario alla classe se non è una disponibilità
    if (!isDisponibilita && classe) {
      await ClasseScolastica.findByIdAndUpdate(
        classe._id,
        { 
          $addToSet: { orarioLezioni: nuovoOrario._id },
          $set: { 
            aula: classe.aula === 'N/D' && aula !== 'N/D' ? aula : classe.aula 
          }
        }
      );
      console.log(`  🔗 Classe ${classe._id} aggiornata con orario ${nuovoOrario._id}`);
    } else {
      console.log(`  📋 Orario di disponibilità ${nuovoOrario._id} non collegato a classi`);
    }
    
    stats.updatedSchedules++;
    
  } catch (error) {
    console.error(`  ❌ Errore orario per ${docente.codiceDocente}:`, error.message);
    stats.errors.push(`Errore orario per ${docente.codiceDocente}: ${error.message}`);
    throw error;
  }
}

// Funzioni helper
function validateJsonStructure(data) {
  if (!data || typeof data !== 'object') {
    console.error('❌ Il file JSON non contiene un oggetto valido');
    return false;
  }

  if (!data.orari || !Array.isArray(data.orari) || data.orari.length === 0) {
    console.error('❌ Il file JSON non contiene un array "orari" valido o è vuoto');
    return false;
  }

  // Valida la struttura per ogni professore
  for (const docenteObj of data.orari) {
    if (!docenteObj.professore) {
      console.error('❌ Manca il campo "professore" in uno degli elementi');
      return false;
    }
    
    if (!Array.isArray(docenteObj.lezioni)) {
      console.error(`❌ Il campo "lezioni" per ${docenteObj.professore} deve essere un array`);
      return false;
    }
  }
  
  return true;
}

function generateTempEmail(codiceDocente) {
  const sanitizedCode = codiceDocente.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return `${sanitizedCode}@temp.scuola.it`;
}

function getOraNumber(oraStr) {
  const ore = parseInt(oraStr.split(':')[0]);
  return ore - 7; // 8:15 => ora 1
}

async function finalizeImport(filePath, stats) {
  // Elimina il file temporaneo
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log('🗑️ File temporaneo eliminato');
  }
  
  console.log('\n=== IMPORT COMPLETATO ===');
  console.log('📊 Statistiche finali:', {
    ...stats,
    errorCount: stats.errors.length,
  });
  
  if (stats.errors.length > 0) {
    console.log('❌ Errori riscontrati:');
    stats.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }
}

// Endpoint di test per il caricamento file
exports.testFileUpload = async (req, res) => {
  try {
    console.log('🧪 Test file upload - req.file:', req.file);
    console.log('🧪 Test file upload - req.body:', req.body);
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nessun file caricato' 
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'File ricevuto con successo',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('❌ Errore nel test file upload:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore nell\'elaborazione del file',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Endpoint di test per pulire i dati di test
exports.cleanTestData = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Endpoint non disponibile in produzione'
      });
    }
    
    console.log('🧹 Pulizia dati di test...');
    
    // Rimuovi docenti di test
    const deletedDocenti = await Docente.deleteMany({
      codiceDocente: { $regex: /^TEST/ }
    });
    
    // Rimuovi orari di test
    const deletedOrari = await OrarioLezioni.deleteMany({
      docente: { $in: [] } // Sarà vuoto dopo aver cancellato i docenti
    });
    
    // Rimuovi classi di test
    const deletedClassi = await ClasseScolastica.deleteMany({
      $or: [
        { sezione: { $regex: /^[ABC]$/ } },
        { anno: { $in: [1, 2, 3] } }
      ]
    });
    
    // Rimuovi materie di test
    const deletedMaterie = await Materia.deleteMany({
      codiceMateria: { $in: ['MAT', 'ITA', 'SCI', 'DISP'] }
    });
    
    // Rimuovi stati di importazione di test
    const deletedStatus = await ImportStatus.deleteMany({});
    
    console.log('🧹 Pulizia completata:', {
      docenti: deletedDocenti.deletedCount,
      orari: deletedOrari.deletedCount,
      classi: deletedClassi.deletedCount,
      materie: deletedMaterie.deletedCount,
      status: deletedStatus.deletedCount
    });
    
    res.status(200).json({
      success: true,
      message: 'Dati di test puliti con successo',
      deleted: {
        docenti: deletedDocenti.deletedCount,
        orari: deletedOrari.deletedCount,
        classi: deletedClassi.deletedCount,
        materie: deletedMaterie.deletedCount,
        status: deletedStatus.deletedCount
      }
    });
  } catch (error) {
    console.error('❌ Errore nella pulizia dei dati di test:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella pulizia dei dati di test',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Esporta le funzioni per il testing
module.exports = {
  importaOrari: exports.importaOrari,
  getImportStatus: exports.getImportStatus,
  testFileUpload: exports.testFileUpload,
  processImportAsync,
  cleanTestData: exports.cleanTestData
};

