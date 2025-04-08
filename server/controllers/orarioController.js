const { validationResult } = require('express-validator');
const Materia = require('../models/Materia');
const ClasseInsegnamento = require('../models/ClasseInsegnamento');
const ClasseScolastica = require('../models/ClasseScolastica');
const OrarioLezioni = require('../models/OrarioLezioni');
const User = require('../models/User');
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

    const orari = await OrarioLezioni.find({ _id: { $in: classe.orarioLezioni } })
      .populate('docente', 'nome cognome')
      .populate('materia', 'descrizione coloreMateria');

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

  // Check that there is at least one teacher
  if (Object.keys(data).length === 0) {
    throw new Error('The JSON file does not contain any teacher data');
  }

  // Validate structure for each teacher
  for (const codiceDocente in data) {
    const docente = data[codiceDocente];
    
    if (!docente.docente) {
      throw new Error(`Missing 'docente' field for ${codiceDocente}`);
    }
    
    if (!Array.isArray(docente.orario)) {
      throw new Error(`The 'orario' field for ${codiceDocente} must be an array`);
    }
    
    // Validate each day in the schedule
    docente.orario.forEach((giorno, idx) => {
      if (!giorno.giorno) {
        throw new Error(`Missing 'giorno' field in the schedule of ${codiceDocente} at index ${idx}`);
      }
      
      if (!Array.isArray(giorno.lezioni)) {
        throw new Error(`The 'lezioni' field for ${codiceDocente} on day ${giorno.giorno} must be an array`);
      }
      
      // Validate each lesson
      giorno.lezioni.forEach((lezione, lezioneIdx) => {
        if (!lezione.ora) {
          throw new Error(`Missing 'ora' field in the lesson of ${codiceDocente} on day ${giorno.giorno} at index ${lezioneIdx}`);
        }
        
        if (!lezione.classe) {
          throw new Error(`Missing 'classe' field in the lesson of ${codiceDocente} on day ${giorno.giorno} at index ${lezioneIdx}`);
        }
        
        if (!lezione.aula) {
          throw new Error(`Missing 'aula' field in the lesson of ${codiceDocente} on day ${giorno.giorno} at index ${lezioneIdx}`);
        }
      });
    });
  }
  
  return true;
};

// Controller for importing schedules
// In your importaOrari function, make sure you're correctly handling the file upload

exports.importaOrari = async (req, res) => {
  // Start the session at the beginning of the function
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Debug logging
    console.log('Request file:', req.file);
    console.log('Request headers:', req.headers);
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    // Read the JSON file
    const filePath = path.join(req.file.path);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let jsonData;
    
    try {
      jsonData = JSON.parse(fileContent);
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        message: 'The file does not contain valid JSON', 
        error: error.message 
      });
    }

    // Validate JSON structure
    try {
      validateJsonStructure(jsonData);
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid JSON structure', 
        error: error.message 
      });
    }

    // Statistics for the response
    const stats = {
      insertedTeachers: 0,
      updatedSchedules: 0,
      newClasses: 0
    };

    // Set to track processed classes
    const processedClasses = new Set();

    // Process each teacher in the JSON
    for (const codiceDocente in jsonData) {
      const docenteData = jsonData[codiceDocente];
      
      // Find or create the teacher
      let docente = await User.findOne({ 
        codiceDocente: docenteData.docente,
        ruolo: 'docente'
      }).session(session);
      
      if (!docente) {
        docente = new User({
          nome: `Docente ${docenteData.docente}`, // Temporary name
          cognome: '', // To be updated manually
          email: `${docenteData.docente.toLowerCase()}@scuola.it`, // Temporary email
          password: await require('bcryptjs').hash('password123', 10), // Default password
          ruolo: 'docente',
          codiceDocente: docenteData.docente
        });
        
        await docente.save({ session });
        stats.insertedTeachers++;
      }

      // Delete existing schedules for this teacher
      await OrarioLezioni.deleteMany({ docente: docente._id }).session(session);
      
      // Process the teacher's schedule
      for (const giorno of docenteData.orario) {
        for (const lezione of giorno.lezioni) {
          // Check if the class exists
          const classeNome = lezione.classe;
          
          // Extract year and section from class name (e.g., "1A" -> year: 1, section: "A")
          const anno = parseInt(classeNome.charAt(0));
          const sezione = classeNome.substring(1);
          
          let classe = await ClasseScolastica.findOne({ 
            anno: anno,
            sezione: sezione
          }).session(session);
          
          if (!classe) {
            classe = new ClasseScolastica({
              anno: anno,
              sezione: sezione,
              aula: lezione.aula,
              indirizzo: 'Generale' // Default value, to be updated manually
            });
            
            await classe.save({ session });
            
            if (!processedClasses.has(classeNome)) {
              stats.newClasses++;
              processedClasses.add(classeNome);
            }
          }
          
          // Create a default subject if none exists
          let materia = await Materia.findOne({ 
            codiceMateria: 'DEFAULT'
          }).session(session);
          
          if (!materia) {
            materia = new Materia({
              codiceMateria: 'DEFAULT',
              descrizione: 'Materia Default',
              coloreMateria: '#3498db'
            });
            
            await materia.save({ session });
          }
          
          // Parse time range (e.g., "8:15-9:15")
          const [oraInizio, oraFine] = lezione.ora.split('-');
          
          // Map day names to abbreviated format
          const giornoMap = {
            'Lunedì': 'Lun',
            'Martedì': 'Mar',
            'Mercoledì': 'Mer',
            'Giovedì': 'Gio',
            'Venerdì': 'Ven',
            'Sabato': 'Sab',
            'Domenica': 'Dom'
          };
          
          // Determine the hour number based on start time
          const getOraNumber = (timeStr) => {
            const hour = parseInt(timeStr.split(':')[0]);
            return hour - 7; // Assuming first hour starts at 8:00, so 8-7=1, 9-7=2, etc.
          };
          
          // Create the new schedule record
          const nuovoOrario = new OrarioLezioni({
            docente: docente._id,
            materia: materia._id,
            giornoSettimana: giornoMap[giorno.giorno] || giorno.giorno,
            ora: getOraNumber(oraInizio),
            oraInizio: oraInizio,
            oraFine: oraFine,
            aula: lezione.aula
          });
          
          await nuovoOrario.save({ session });
          
          // Update the class with the reference to the lesson
          await ClasseScolastica.findByIdAndUpdate(
            classe._id,
            { $addToSet: { orarioLezioni: nuovoOrario._id } },
            { session }
          );
          
          stats.updatedSchedules++;
        }
      }
    }

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
    
    // Delete the temporary file
    fs.unlinkSync(filePath);
    
    return res.status(200).json({
      success: true,
      message: 'Import completed successfully',
      ...stats
    });
    
  } catch (error) {
    // Rollback in case of error
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error during schedule import:', error);
    
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