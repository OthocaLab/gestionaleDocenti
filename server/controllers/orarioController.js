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
    
    // First, try to find the user
    const user = await User.findById(docenteId);
    
    // If user not found or not a docente, try to find directly in Docente model
    let docente;
    if (!user) {
      docente = await Docente.findById(docenteId);
      if (!docente) {
        return res.status(404).json({
          success: false,
          message: 'Docente non trovato'
        });
      }
    } else if (user.ruolo !== 'docente') {
      return res.status(400).json({
        success: false,
        message: 'L\'utente selezionato non è un docente'
      });
    }

    const docenteToUse = docente ? docente._id : docenteId;
    
    // Trova tutte le classi e le loro lezioni associate
    const classi = await ClasseScolastica.find().select('_id anno sezione indirizzo aula orarioLezioni');
    
    // Mappa degli ID delle lezioni per classe
    const lezioniClasseMap = {};
    classi.forEach(classe => {
      if (classe.orarioLezioni && classe.orarioLezioni.length > 0) {
        classe.orarioLezioni.forEach(lezioneId => {
          if (!lezioniClasseMap[lezioneId.toString()]) {
            lezioniClasseMap[lezioneId.toString()] = [];
          }
          lezioniClasseMap[lezioneId.toString()].push({
            classeId: classe._id,
            anno: classe.anno,
            sezione: classe.sezione,
            indirizzo: classe.indirizzo,
            aula: classe.aula
          });
        });
      }
    });

    // Ottiene le lezioni del docente
    const orari = await OrarioLezioni.find({ docente: docenteToUse })
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

    // Aggiunge i dati della classe a ciascuna lezione
    const orariCompleti = orari.map(orario => {
      const orarioObj = orario.toObject();
      const classiInfo = lezioniClasseMap[orario._id.toString()];
      
      if (classiInfo && classiInfo.length > 0) {
        // Se ci sono più classi per la stessa lezione, le includiamo tutte
        orarioObj.classi = classiInfo;
        // Per retrocompatibilità, usiamo la prima classe anche come proprietà "classe"
        orarioObj.classe = {
          id: classiInfo[0].classeId,
          anno: classiInfo[0].anno,
          sezione: classiInfo[0].sezione,
          indirizzo: classiInfo[0].indirizzo,
          aula: classiInfo[0].aula
        };
        // Aggiungiamo anche l'aula come proprietà diretta per renderla più facile da accedere
        orarioObj.aula = classiInfo[0].aula;
      }
      
      return orarioObj;
    });

    res.status(200).json({
      success: true,
      data: orariCompleti
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
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Estrai il classeId dal corpo della richiesta
    const { classeId, ...orarioData } = req.body;

    // Crea un nuovo orario lezione includendo il riferimento alla classe
    const orarioLezione = new OrarioLezioni({
      ...orarioData,
      classe: classeId // Aggiungi il riferimento alla classe
    });

    await orarioLezione.save();

    // Se la classe esiste, aggiorna il suo riferimento all'orario lezioni
    if (classeId) {
      await ClasseScolastica.findByIdAndUpdate(
        classeId,
        { $push: { orarioLezioni: orarioLezione._id } }
      );
    }

    res.status(201).json({
      success: true,
      data: orarioLezione
    });
  } catch (error) {
    console.error('Errore nella creazione dell\'orario lezione:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella creazione dell\'orario lezione',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Ottieni docenti disponibili per sostituzioni
exports.getDocentiDisponibiliSostituzioni = async (req, res) => {
  try {
    const { giorno, ora } = req.query;
    
    if (!giorno || !ora) {
      return res.status(400).json({
        success: false,
        message: 'Giorno e ora sono parametri obbligatori'
      });
    }
    
    // Trova le materie con codice "DISP"
    const materieDisp = await Materia.find({ codiceMateria: "DISP" });
    
    if (!materieDisp || materieDisp.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nessuna materia di disponibilità (DISP) trovata nel sistema'
      });
    }
    
    const materieDispIds = materieDisp.map(m => m._id);
    
    // Trova docenti con disponibilità nell'ora e giorno specificati
    const orariDisponibili = await OrarioLezioni.find({
      giornoSettimana: giorno,
      ora: parseInt(ora),
      materia: { $in: materieDispIds }
    }).populate({
      path: 'docente',
      select: 'nome cognome codiceDocente oreRecupero email stato'
    });
    
    // Estrai i docenti dalle disponibilità trovate
    const docentiDisponibili = orariDisponibili.map(orario => orario.docente);
    
    res.status(200).json({
      success: true,
      count: docentiDisponibili.length,
      data: docentiDisponibili
    });
    
  } catch (error) {
    console.error('Errore nel recupero dei docenti disponibili:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dei docenti disponibili',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};