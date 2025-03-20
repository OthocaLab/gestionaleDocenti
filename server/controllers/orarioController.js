const { validationResult } = require('express-validator');
const Materia = require('../models/Materia');
const ClasseInsegnamento = require('../models/ClasseInsegnamento');
const ClasseScolastica = require('../models/ClasseScolastica');
const OrarioLezioni = require('../models/OrarioLezioni');
const User = require('../models/User');

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