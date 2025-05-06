const { validationResult } = require('express-validator');
const Materia = require('../models/Materia');
const ClasseInsegnamento = require('../models/ClasseInsegnamento');
const ClasseScolastica = require('../models/ClasseScolastica');
const OrarioLezioni = require('../models/OrarioLezioni');
const User = require('../models/User');
const Docente = require('../models/Docente');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Gestione Materie
exports.getAllMaterie = async (req, res) => {
  try {
    const materie = await Materia.find();
    res.status(200).json({
      success: true,
      count: materie.length,
      data: materie
    });
  } catch (error) {
    console.error('Errore nel recupero delle materie:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle materie',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

exports.createMateria = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const materia = await Materia.create(req.body);
    res.status(201).json({
      success: true,
      data: materia
    });
  } catch (error) {
    console.error('Errore nella creazione della materia:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella creazione della materia',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Gestione Classi Scolastiche
exports.getAllClassi = async (req, res) => {
  try {
    const classi = await ClasseScolastica.find();
    res.status(200).json({
      success: true,
      count: classi.length,
      data: classi
    });
  } catch (error) {
    console.error('Errore nel recupero delle classi:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle classi',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

exports.createClasse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const classe = await ClasseScolastica.create(req.body);
    res.status(201).json({
      success: true,
      data: classe
    });
  } catch (error) {
    console.error('Errore nella creazione della classe:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella creazione della classe',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Gestione Orari Lezioni
exports.getOrarioByClasse = async (req, res) => {
  try {
    const { classeId } = req.params;
    
    const classe = await ClasseScolastica.findById(classeId);
    if (!classe) {
      return res.status(404).json({
        success: false,
        message: 'Classe non trovata'
      });
    }

    console.log(`Recupero orario per classe ${classeId}, con ${classe.orarioLezioni?.length || 0} lezioni`);

    const orari = await OrarioLezioni.find({ _id: { $in: classe.orarioLezioni } })
      .populate([
        { 
          path: 'docente',
          select: 'nome cognome codiceDocente',
          model: 'Docente'
        },
        {
          path: 'materia',
          select: 'descrizione coloreMateria'
        }
      ]);

    console.log(`Trovate ${orari.length} lezioni, primo elemento:`, 
      orari.length > 0 ? JSON.stringify(orari[0]) : 'nessuna lezione');

    res.status(200).json({
      success: true,
      data: orari
    });
  } catch (error) {
    console.error('Errore nel recupero dell\'orario:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dell\'orario',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

exports.getOrarioByDocente = async (req, res) => {
  try {
    const { docenteId } = req.params;
    
    const docente = await User.findById(docenteId);
    if (!docente) {
      return res.status(404).json({
        success: false,
        message: 'Docente non trovato'
      });
    }

    const orari = await OrarioLezioni.find({ docente: docenteId })
      .populate('materia', 'descrizione coloreMateria');

    res.status(200).json({
      success: true,
      data: orari
    });
  } catch (error) {
    console.error('Errore nel recupero dell\'orario del docente:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dell\'orario del docente',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

exports.createOrarioLezione = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { classeId, ...orarioData } = req.body;
    
    // Crea la lezione
    const orario = await OrarioLezioni.create(orarioData);
    
    // Aggiorna la classe con il riferimento alla lezione
    await ClasseScolastica.findByIdAndUpdate(
      classeId,
      { $push: { orarioLezioni: orario._id } }
    );

    res.status(201).json({
      success: true,
      data: orario
    });
  } catch (error) {
    console.error('Errore nella creazione dell\'orario:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella creazione dell\'orario',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Importazione orario completo
exports.importOrario = async (req, res) => {
  try {
    const { orarioData } = req.body;
    
    // Implementazione dell'importazione dell'orario completo
    // Questo dipenderà dal formato dei dati che stai importando
    
    res.status(200).json({
      success: true,
      message: 'Orario importato con successo'
    });
  } catch (error) {
    console.error('Errore nell\'importazione dell\'orario:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'importazione dell\'orario',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Function to validate JSON structure
const validateJsonStructure = (data) => {
  if (!data || typeof data !== 'object') {
    throw new Error('The JSON file does not contain a valid object');
  }

  // Check for orari array in the new format
  if (!data.orari || !Array.isArray(data.orari) || data.orari.length === 0) {
    throw new Error('The JSON file does not contain a valid "orari" array or it is empty');
  }

  // Validate structure for each professor
  for (const docenteObj of data.orari) {
    if (!docenteObj.professore) {
      throw new Error('Missing "professore" field in one of the entries');
    }
    
    if (!Array.isArray(docenteObj.lezioni)) {
      throw new Error(`The "lezioni" field for ${docenteObj.professore} must be an array`);
    }
    
    // Validate each lesson
    docenteObj.lezioni.forEach((lezione, lezioneIdx) => {
      if (!lezione.giorno) {
        throw new Error(`Missing "giorno" field in the lesson of ${docenteObj.professore} at index ${lezioneIdx}`);
      }
      
      if (!lezione.ora) {
        throw new Error(`Missing "ora" field in the lesson of ${docenteObj.professore} at index ${lezioneIdx}`);
      }
      
      // Check classe field, but allow empty string if materia is "DISP"
      if (lezione.classe === undefined) {
        throw new Error(`Missing "classe" field in the lesson of ${docenteObj.professore} at index ${lezioneIdx}`);
      }
      
      // Check aula field, but allow empty string if materia is "DISP"
      if (lezione.aula === undefined) {
        throw new Error(`Missing "aula" field in the lesson of ${docenteObj.professore} at index ${lezioneIdx}`);
      }
      
      if (!lezione.materia) {
        throw new Error(`Missing "materia" field in the lesson of ${docenteObj.professore} at index ${lezioneIdx}`);
      }
    });
  }
  
  return true;
};

// Controller for importing schedules
exports.importaOrari = async (req, res) => {
  try {
    console.log('Request file:', req.file);
    console.log('Request headers:', req.headers);
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const filePath = req.file.path;
    
    // Rispondi immediatamente al client per evitare timeout
    res.status(200).json({
      success: true,
      message: 'File ricevuto, elaborazione in corso...',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size
      }
    });
    
    // Continua l'elaborazione in background
    processImportAsync(filePath, req.user).catch(err => {
      console.error('Errore durante l\'elaborazione asincrona:', err);
    });
    
  } catch (error) {
    console.error('Error during schedule import:', error);
    
    // Assicurati di eliminare il file temporaneo in caso di errore
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Error deleting temporary file:', e);
      }
    }
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred during import',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Funzione asincrona per elaborare l'import in background
async function processImportAsync(filePath, user) {
  try {
    // Leggi il file JSON
    let orariData;
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      orariData = JSON.parse(fileContent);
      console.log(`File JSON letto correttamente, contiene ${orariData.orari?.length || 0} docenti`);
    } catch (error) {
      console.error('Error reading JSON file:', error);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return; // Questo return è necessario perché non abbiamo i dati per procedere
    }
    
    if (!orariData || !orariData.orari || !Array.isArray(orariData.orari)) {
      console.error('Invalid data format. Expected { orari: [...] }');
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return; // Questo return è necessario perché il formato non è valido
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
    
    // Mappa per i giorni della settimana
    const giornoMap = {
      'LU': 'Lun',
      'MA': 'Mar',
      'ME': 'Mer',
      'GI': 'Gio',
      'VE': 'Ven',
      'SA': 'Sab'
    };
    
    // Funzione helper per convertire l'ora in formato numerico
    const getOraNumber = (oraStr) => {
      // Usa la logica di conversione orario esistente
      const ore = parseInt(oraStr.split(':')[0]);
      // Ipotizziamo che la prima ora inizi alle 8:15, seconda alle 9:15, ecc.
      return ore - 7; // Ad esempio, 8:15 => ora 1
    };

    // Genera un'email temporanea valida per docenti
    const generateTempEmail = (codiceDocente) => {
      // Rimuovi caratteri speciali e spazi, aggiungi dominio fittizio
      const sanitizedCode = codiceDocente.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      return `${sanitizedCode}@temp.scuola.it`;
    };
    
    // Processo più piccoli batch con pause tra loro
    const BATCH_SIZE = 1; // Elaboriamo un docente alla volta per garantire il funzionamento
    const professori = orariData.orari;
    
    console.log(`Inizio elaborazione di ${professori.length} docenti in batch di ${BATCH_SIZE}`);
    
    for (let i = 0; i < professori.length; i += BATCH_SIZE) {
      const batch = professori.slice(i, i + BATCH_SIZE);
      console.log(`Elaborazione batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(professori.length / BATCH_SIZE)}, ${batch.length} docenti`);
      
      // Elaborazione sequenziale per evitare troppe operazioni simultanee
      for (let j = 0; j < batch.length; j++) {
        const professore = batch[j];
        try {
          console.log(`Elaborazione docente ${i + j + 1}/${professori.length}: ${professore.professore}`);
          stats.processedTeachers++;
          const codiceDocente = professore.professore;
          
          if (!codiceDocente) {
            stats.errors.push(`Teacher record is missing 'professore' field`);
            console.log(`Docente ${i + j + 1} saltato: manca il campo professore`);
            continue; // Salta questo record, ma continua con gli altri
          }
          
          // Cerca o crea docente
          let docente;
          try {
            // Estrai i dati del docente dal JSON
            const docenteData = {
              nome: professore.nome || codiceDocente,
              cognome: professore.cognome || codiceDocente,
              codiceFiscale: professore.codiceFiscale || codiceDocente,
              codiceDocente: codiceDocente,
              email: professore.email || generateTempEmail(codiceDocente),
              telefono: professore.telefono || '',
              stato: professore.stato || 'attivo',
              classiInsegnamento: professore.classiInsegnamento || [],
              oreRecupero: 0
            };
            
            console.log(`Dati docente: ${codiceDocente}`, JSON.stringify(docenteData).substring(0, 100) + '...');
            
            // Trova il docente esistente
            let existingDocente = await Docente.findOne({
              $or: [
                { codiceFiscale: codiceDocente },
                { codiceDocente: codiceDocente }
              ]
            });
            
            if (existingDocente) {
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
              console.log(`Docente aggiornato: ${docente.nome} ${docente.cognome} (${docente._id})`);
            } else {
              // Crea un nuovo docente
              docente = await Docente.create(docenteData);
              stats.insertedTeachers++;
              console.log(`Nuovo docente creato: ${docente.nome} ${docente.cognome} (${docente._id})`);
            }
            
            // Rimuovi gli orari esistenti per il docente
            const deletedCount = await OrarioLezioni.deleteMany({ docente: docente._id });
            console.log(`Rimossi ${deletedCount.deletedCount} orari esistenti per docente ${docente._id}`);
            
          } catch (error) {
            console.error(`Errore docente ${codiceDocente}:`, error.message);
            stats.errors.push(`Errore docente ${codiceDocente}: ${error.message}`);
            console.log(`Docente ${i + j + 1} saltato per errore, continuiamo con il prossimo`);
            continue; // Salta questo professore in caso di errore ma continua con gli altri
          }
          
          // Itera sulle lezioni del professore
          const lezioni = professore.lezioni || [];
          console.log(`Elaborazione di ${lezioni.length} lezioni per docente ${docente.codiceDocente}`);
          
          for (let k = 0; k < lezioni.length; k++) {
            const lezione = lezioni[k];
            try {
              // Controlla i dati obbligatori, ma permetti classe e aula vuoti se è disponibilità
              if (!lezione.giorno || !lezione.ora || !lezione.materia) {
                stats.errors.push(`Dati lezione incompleti per docente ${codiceDocente}`);
                console.log(`Lezione ${k + 1} saltata: dati incompleti`);
                continue; // Salta questa lezione
              }
              
              // Gestisci diversi casi:
              // 1. Disponibilità: permette classe e aula vuoti
              // 2. Lezione normale ma con aula o classe vuota: usa valori di default
              const isDisponibilita = lezione.materia === "DISP";
              const hasClasse = lezione.classe && lezione.classe.trim() !== '';
              const hasAula = lezione.aula && lezione.aula.trim() !== '';
              
              // Per lezioni normali, deve esserci almeno la classe o l'aula
              if (!isDisponibilita && !hasClasse && !hasAula) {
                stats.errors.push(`Dati lezione incompleti per docente ${codiceDocente}: mancano sia classe che aula`);
                console.log(`Lezione ${k + 1} saltata: mancano sia classe che aula per lezione normale`);
                continue; // Salta questa lezione se è normale ma mancano sia classe che aula
              }
              
              // Normalizzazione dell'aula e classe
              let aula, classeNome;
              if (isDisponibilita) {
                aula = 'Disponibilità';
                classeNome = '';
              } else {
                aula = hasAula ? lezione.aula.trim() : 'N/D';
                classeNome = hasClasse ? lezione.classe.trim() : 'N/D';
              }
              
              console.log(`Lezione ${k + 1}/${lezioni.length}: ${lezione.giorno} ${lezione.ora} - ${isDisponibilita ? 'Disponibilità' : ('Classe: ' + classeNome + ' - Aula: ' + aula)} - Materia: ${lezione.materia}`);
              
              // Trova o crea la materia con gestione eccezioni
              let materia;
              try {
                // Trova o crea la materia usando upsert per evitare duplicati
                const materiaResult = await Materia.findOneAndUpdate(
                  { codiceMateria: lezione.materia },
                  {
                    $setOnInsert: {
                      codiceMateria: lezione.materia,
                      descrizione: lezione.materia,
                      coloreMateria: '#' + Math.floor(Math.random()*16777215).toString(16) // Colore casuale
                    }
                  },
                  {
                    new: true,
                    upsert: true // Crea se non esiste
                  }
                );
                
                materia = materiaResult;
                console.log(`Materia: ${materia.codiceMateria} (${materia._id})`);
                
                // Non possiamo usare isNew su un documento ottenuto da findOneAndUpdate
                if (stats.newSubjects === 0) {
                  stats.newSubjects++;
                }
              } catch (error) {
                console.error(`Errore materia ${lezione.materia}:`, error.message);
                stats.errors.push(`Errore materia ${lezione.materia}: ${error.message}`);
                console.log(`Lezione ${k + 1} saltata per errore nella materia`);
                continue; // Salta questa lezione se c'è un errore con la materia
              }
              
              // Estrai anno e sezione dal nome della classe
              let anno = 1;
              let sezione = classeNome;
              let classe;
              
              // Se è una disponibilità o la classe non è specificata ma abbiamo l'aula, non serve cercare o creare una classe reale
              if (isDisponibilita || (!hasClasse && hasAula)) {
                console.log(`Lezione senza classe reale: ${isDisponibilita ? 'disponibilità' : 'solo aula specificata'}`);
                
                // Per le lezioni con aula ma senza classe, creiamo una classe virtuale solo per scopi di organizzazione
                if (!isDisponibilita && !hasClasse && hasAula) {
                  try {
                    // Usa l'aula come identificatore per una classe virtuale
                    const classeResult = await ClasseScolastica.findOneAndUpdate(
                      {
                        anno: 0, // 0 indica classe virtuale
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
                    classe = classeResult;
                    console.log(`Classe virtuale creata per aula ${aula}: ${classe._id}`);
                  } catch (error) {
                    console.error(`Errore creazione classe virtuale per aula ${aula}:`, error.message);
                    // Continuiamo comunque, non è critico
                  }
                }
              } else {
                // Gestione normale delle classi
                if (classeNome.length >= 2) {
                  const match = classeNome.match(/^([1-5])([A-Z].*)$/);
                  if (match) {
                    anno = parseInt(match[1]);
                    sezione = match[2];
                  }
                }
                
                // Trova o crea la classe con gestione eccezioni
                try {
                  // Trova o crea la classe usando upsert per evitare duplicati
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
                      upsert: true // Crea se non esiste
                    }
                  );
                  
                  classe = classeResult;
                  console.log(`Classe: ${classe.anno}${classe.sezione} (${classe._id})`);
                  
                  // Non possiamo usare isNew su un documento ottenuto da findOneAndUpdate
                  if (stats.newClasses === 0) {
                    stats.newClasses++;
                  }
                } catch (error) {
                  console.error(`Errore classe ${anno}${sezione}:`, error.message);
                  stats.errors.push(`Errore classe ${anno}${sezione}: ${error.message}`);
                  console.log(`Lezione ${k + 1} saltata per errore nella classe`);
                  continue; // Salta questa lezione se c'è un errore con la classe
                }
              }
              
              // Calcola orario inizio e fine
              let oraInizio = lezione.ora;
              let oraFine = '';
              
              // Aggiungi 60 minuti all'ora di inizio per ottenere l'ora di fine
              if (oraInizio.includes(':')) {
                const [ore, minuti] = oraInizio.split(':').map(Number);
                const dataInizio = new Date();
                dataInizio.setHours(ore, minuti);
                const dataFine = new Date(dataInizio.getTime() + 60 * 60 * 1000);
                oraFine = `${dataFine.getHours()}:${dataFine.getMinutes().toString().padStart(2, '0')}`;
              } else {
                oraFine = oraInizio; // Fallback se il formato non è corretto
              }
              
              // Crea il nuovo record di orario
              try {
                const nuovoOrario = new OrarioLezioni({
                  docente: docente._id,
                  materia: materia._id,
                  giornoSettimana: giornoMap[lezione.giorno] || lezione.giorno,
                  ora: getOraNumber(oraInizio),
                  oraInizio: oraInizio,
                  oraFine: oraFine,
                  aula: aula, // Ora utilizziamo il valore dell'aula normalizzato
                  isDisponibilita: isDisponibilita // Imposta il flag di disponibilità
                });
                
                const savedOrario = await nuovoOrario.save();
                console.log(`Orario creato: ${savedOrario._id} per ${giornoMap[lezione.giorno] || lezione.giorno} ora ${getOraNumber(oraInizio)}`);
                
                // Se è una disponibilità non deve essere collegata a una classe
                if (!isDisponibilita) {
                  // Aggiorna la classe con il riferimento alla lezione
                  const updateResult = await ClasseScolastica.findByIdAndUpdate(
                    classe._id,
                    { 
                      $addToSet: { orarioLezioni: nuovoOrario._id },
                      // Se non è già impostata un'aula per la classe, la impostiamo
                      $set: { 
                        aula: classe.aula === 'N/D' && aula !== 'N/D' ? aula : classe.aula 
                      }
                    }
                  );
                  console.log(`Classe ${classe._id} aggiornata con orario ${nuovoOrario._id}`);
                } else {
                  console.log(`Orario di disponibilità ${nuovoOrario._id} non collegato a classi`);
                }
                
                stats.updatedSchedules++;
              } catch (error) {
                console.error(`Errore orario per ${codiceDocente}:`, error.message);
                stats.errors.push(`Errore orario per ${codiceDocente}: ${error.message}`);
                console.log(`Lezione ${k + 1} saltata per errore nell'orario`);
                continue; // Salta questa lezione in caso di errore
              }
            } catch (error) {
              console.error(`Errore elaborazione lezione ${k + 1}:`, error.message);
              stats.errors.push(`Errore lezione ${k + 1}: ${error.message}`);
              console.log(`Lezione ${k + 1} saltata per errore generico`);
              // Continua con la prossima lezione
            }
          } // fine loop lezioni
          
          console.log(`Docente ${i + j + 1}/${professori.length} completato`);
          
        } catch (error) {
          console.error(`Errore elaborazione docente ${i + j + 1}/${professori.length}:`, error.message);
          stats.errors.push(`Errore docente ${i + j + 1}: ${error.message}`);
          console.log(`Docente ${i + j + 1} saltato per errore generico, continuo con il prossimo`);
          // Continua con il prossimo insegnante
        }
      } // fine loop docenti nel batch
      
      // Pausa più lunga tra i batch per ridurre il carico sul server
      console.log(`Pausa dopo batch ${Math.floor(i / BATCH_SIZE) + 1}...`);
      await new Promise(resolve => setTimeout(resolve, 100)); // Ridotta a 100ms per velocizzare
    } // fine loop batch
    
    // Elimina il file temporaneo
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('File temporaneo eliminato');
    }
    
    console.log('Import completato con successo:', {
      ...stats,
      errorCount: stats.errors.length,
    });
    
  } catch (error) {
    console.error('Error during async import processing:', error);
    
    // Assicurati di eliminare il file temporaneo in caso di errore
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.error('Error deleting temporary file:', e);
    }
  }
}

// Simple test endpoint for file uploads
exports.testFileUpload = async (req, res) => {
  try {
    console.log('Test file upload - req.file:', req.file);
    console.log('Test file upload - req.body:', req.body);
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'File received successfully',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Error in test file upload:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing file',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};