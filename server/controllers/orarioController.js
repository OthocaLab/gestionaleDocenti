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
    
    // Leggi il file JSON
    let orariData;
    try {
      // Leggi il file JSON in modo più efficiente (usando stream se necessario per file molto grandi)
      const fileContent = fs.readFileSync(filePath, 'utf8');
      orariData = JSON.parse(fileContent);
    } catch (error) {
      console.error('Error reading JSON file:', error);
      // Elimina il file temporaneo in caso di errore
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON file',
        error: process.env.NODE_ENV === 'development' ? error.message : {}
      });
    }
    
    if (!orariData || !orariData.orari || !Array.isArray(orariData.orari)) {
      // Elimina il file temporaneo
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: 'Invalid data format. Expected { orari: [...] }'
      });
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
    
    // Elabora i dati degli orari utilizzando batch processing
    const BATCH_SIZE = 10; // Elabora 10 docenti alla volta
    const professori = orariData.orari;
    
    for (let i = 0; i < professori.length; i += BATCH_SIZE) {
      const batch = professori.slice(i, i + BATCH_SIZE);
      
      // Elabora ogni batch in parallelo ma con un limite al parallelismo
      await Promise.all(batch.map(async (professore) => {
        try {
          stats.processedTeachers++;
          const codiceDocente = professore.professore;
          
          if (!codiceDocente) {
            stats.errors.push(`Teacher record is missing 'professore' field`);
            return; // Salta questo record
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
            
            console.log(`Elaborazione docente: ${codiceDocente}`, docenteData);
            
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
              console.log(`Docente aggiornato: ${docente.nome} ${docente.cognome}`);
            } else {
              // Crea un nuovo docente
              docente = await Docente.create(docenteData);
              stats.insertedTeachers++;
              console.log(`Nuovo docente creato: ${docente.nome} ${docente.cognome}`);
            }
            
            // Rimuovi gli orari esistenti per il docente
            await OrarioLezioni.deleteMany({ docente: docente._id });
            
          } catch (error) {
            console.error(`Errore creazione/aggiornamento docente ${codiceDocente}:`, error.message);
            stats.errors.push(`Errore docente ${codiceDocente}: ${error.message}`);
            return; // Salta questo professore in caso di errore
          }
          
          // Itera sulle lezioni del professore
          const lezioni = professore.lezioni || [];
          
          for (const lezione of lezioni) {
            if (!lezione.giorno || !lezione.ora || !lezione.classe || !lezione.materia) {
              stats.errors.push(`Dati lezione incompleti per docente ${codiceDocente}`);
              continue; // Salta questa lezione
            }
            
            // Normalizzazione dell'aula
            const aula = lezione.aula && lezione.aula.trim() !== '' ? lezione.aula.trim() : 'N/D';
            console.log(`Lezione: ${lezione.giorno} ${lezione.ora} - Classe: ${lezione.classe} - Aula: ${aula} - Materia: ${lezione.materia}`);
            
            // Trova o crea la materia
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
              
              // Non possiamo usare isNew su un documento ottenuto da findOneAndUpdate
              if (stats.newSubjects === 0) {
                stats.newSubjects++;
              }
            } catch (error) {
              console.error(`Errore creazione materia ${lezione.materia}:`, error.message);
              stats.errors.push(`Errore creazione materia ${lezione.materia}: ${error.message}`);
              continue; // Salta questa lezione se c'è un errore con la materia
            }
            
            // Estrai anno e sezione dal nome della classe
            let anno = 1;
            let sezione = lezione.classe;
            
            if (lezione.classe.length >= 2) {
              const match = lezione.classe.match(/^([1-5])([A-Z].*)$/);
              if (match) {
                anno = parseInt(match[1]);
                sezione = match[2];
              }
            }
            
            // Trova o crea la classe
            let classe;
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
                    aula: aula,
                    indirizzo: 'Da definire'
                  }
                },
                {
                  new: true,
                  upsert: true // Crea se non esiste
                }
              );
              
              classe = classeResult;
              
              // Non possiamo usare isNew su un documento ottenuto da findOneAndUpdate
              if (stats.newClasses === 0) {
                stats.newClasses++;
              }
            } catch (error) {
              console.error(`Errore creazione classe ${anno}${sezione}:`, error.message);
              stats.errors.push(`Errore creazione classe ${anno}${sezione}: ${error.message}`);
              continue; // Salta questa lezione se c'è un errore con la classe
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
                aula: aula // Ora utilizziamo il valore dell'aula normalizzato
              });
              
              await nuovoOrario.save();
              
              // Aggiorna la classe con il riferimento alla lezione
              await ClasseScolastica.findByIdAndUpdate(
                classe._id,
                { 
                  $addToSet: { orarioLezioni: nuovoOrario._id },
                  // Se non è già impostata un'aula per la classe, la impostiamo
                  $set: { 
                    aula: classe.aula === 'N/D' && aula !== 'N/D' ? aula : classe.aula 
                  }
                }
              );
              
              stats.updatedSchedules++;
            } catch (error) {
              console.error(`Errore creazione orario per ${codiceDocente}:`, error.message);
              stats.errors.push(`Errore orario per ${codiceDocente}: ${error.message}`);
              continue; // Salta questa lezione in caso di errore
            }
          }
        } catch (error) {
          console.error(`Error processing teacher batch:`, error.message);
          stats.errors.push(error.message);
          // Continua con il prossimo insegnante nel batch
        }
      }));
      
      // Piccola pausa tra i batch per evitare sovraccarico di memoria
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Elimina il file temporaneo
    fs.unlinkSync(filePath);
    
    return res.status(200).json({
      success: true,
      message: 'Import completed successfully',
      ...stats,
      errorCount: stats.errors.length,
      // Limita gli errori visualizzati a 10 per non sovracaricare la risposta
      errors: stats.errors.slice(0, 10)
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